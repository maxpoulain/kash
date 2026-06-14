"""Financial summary (aggregation) endpoint.

Aggregates a household's transactions for a given month into totals and
per-category breakdowns. Feeds the frontend "Analyse" page (Sankey + sections).
"""

from datetime import datetime, timezone
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.accounts import visible_account_ids
from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.recurring_transactions import materialize_due_for_household
from app.routers.transactions import _get_household_id
from app.schemas.summary import (
    AccountTransferFlow,
    CategoryAmount,
    SavingsDestination,
    SummaryOut,
)

router = APIRouter(prefix="/api")


def _month_bounds(month: str) -> tuple[str, str]:
    """Return [start, end) ISO date bounds for a YYYY-MM month string.

    Raises HTTP 422 if the format is invalid.
    """
    try:
        year_str, month_str = month.split("-")
        year, m = int(year_str), int(month_str)
        if not 1 <= m <= 12:
            raise ValueError
        next_year, next_month = (year, m + 1) if m < 12 else (year + 1, 1)
        return f"{year}-{m:02d}-01", f"{next_year}-{next_month:02d}-01"
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must be in YYYY-MM format",
        )


@router.get("/summary", response_model=SummaryOut)
async def get_summary(
    month: str | None = Query(None, description="Month to summarize, format YYYY-MM"),
    account_id: str | None = Query(None, description="Scope to a single account (default: all visible)"),
    claims: dict = Depends(get_current_user),
) -> SummaryOut:
    """Aggregate the household's transactions for ``month`` (defaults to current).

    Materializes any due recurring transactions first, so the summary matches
    what ``GET /transactions`` would return for the same month. When ``account_id``
    is given, the summary is scoped to that one account and inter-account transfers
    touching it surface as flows (00058 T5c).
    """
    if month is None:
        now = datetime.now(timezone.utc)
        month = f"{now.year}-{now.month:02d}"
    start, end = _month_bounds(month)

    household_id = _get_household_id(claims["sub"])
    materialize_due_for_household(household_id)
    supabase = get_supabase()

    # Category metadata (name + icon) for this household and global categories.
    cat_result = (
        supabase.table("categories")
        .select("id,name,icon")
        .or_(f"household_id.is.null,household_id.eq.{household_id}")
        .execute()
    )
    cat_rows = cast(list[dict], cat_result.data if isinstance(cat_result.data, list) else [])
    cat_meta = {row["id"]: (row.get("name"), row.get("icon")) for row in cat_rows}

    # Scope to visible accounts. No-op in T1 (all shared); T4 flips the helper to
    # exclude other members' private accounts, and the summary follows automatically.
    visible = visible_account_ids(household_id, claims["sub"])
    if account_id is not None:
        if account_id not in visible:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
        account_ids = [account_id]
    else:
        account_ids = visible

    tx_result = (
        supabase.table("transactions")
        .select("amount,type,category_id")
        .eq("household_id", household_id)
        .in_("account_id", account_ids)
        .gte("date", start)
        .lt("date", end)
        .execute()
    )
    tx_rows = cast(list[dict], tx_result.data if isinstance(tx_result.data, list) else [])

    total_income = 0.0
    total_expense = 0.0
    # type -> category_id (or None) -> summed amount
    by_category: dict[str, dict[str | None, float]] = {"income": {}, "expense": {}}

    for tx in tx_rows:
        tx_type = tx["type"]
        if tx_type not in by_category:
            continue
        amount = float(tx["amount"])
        category_id = tx.get("category_id")
        buckets = by_category[tx_type]
        buckets[category_id] = buckets.get(category_id, 0.0) + amount
        if tx_type == "income":
            total_income += amount
        else:
            total_expense += amount

    def _to_breakdown(buckets: dict[str | None, float]) -> list[CategoryAmount]:
        items = []
        for category_id, amount in buckets.items():
            name, icon = cat_meta.get(category_id, (None, None)) if category_id else (None, None)
            items.append(
                CategoryAmount(
                    category_id=UUID(category_id) if category_id else None,
                    name=name,
                    icon=icon,
                    amount=amount,
                )
            )
        # Largest contributions first.
        items.sort(key=lambda item: item.amount, reverse=True)
        return items

    savings_rate = (total_income - total_expense) / total_income if total_income > 0 else None

    savings_destinations = _savings_destinations(supabase, household_id, account_ids, start, end)
    account_transfers = (
        _account_transfers(supabase, household_id, account_id, start, end)
        if account_id is not None
        else []
    )

    return SummaryOut(
        month=month,
        total_income=total_income,
        total_expense=total_expense,
        net=total_income - total_expense,
        savings_rate=savings_rate,
        income_by_category=_to_breakdown(by_category["income"]),
        expense_by_category=_to_breakdown(by_category["expense"]),
        savings_destinations=savings_destinations,
        account_transfers=account_transfers,
    )


def _savings_destinations(
    supabase, household_id: str, account_ids: list[str], start: str, end: str
) -> list[SavingsDestination]:
    """Sum this month's savings contributions (``courant → epargne`` transfers).

    Grouped by destination wealth account. Only transfers leaving a *visible*
    checking account count; internal ``courant → courant`` and ``epargne →
    courant`` withdrawals are excluded by the kind filters. Transfers never touch
    ``transactions``, so income/expense totals stay unaffected — this only feeds
    the Sankey's savings decomposition (00058 T5a).
    """
    if not account_ids:
        return []

    transfer_result = (
        supabase.table("transfers")
        .select("to_id,amount")
        .eq("household_id", household_id)
        .eq("from_kind", "courant")
        .eq("to_kind", "epargne")
        .in_("from_id", account_ids)
        .gte("date", start)
        .lt("date", end)
        .execute()
    )
    transfer_rows = cast(
        list[dict], transfer_result.data if isinstance(transfer_result.data, list) else []
    )
    if not transfer_rows:
        return []

    by_dest: dict[str, float] = {}
    for row in transfer_rows:
        to_id = row["to_id"]
        by_dest[to_id] = by_dest.get(to_id, 0.0) + float(row["amount"])

    name_result = (
        supabase.table("savings_accounts")
        .select("id,name")
        .in_("id", list(by_dest.keys()))
        .execute()
    )
    name_rows = cast(list[dict], name_result.data if isinstance(name_result.data, list) else [])
    names = {row["id"]: row.get("name") for row in name_rows}

    destinations = [
        SavingsDestination(account_id=UUID(to_id), name=names.get(to_id), amount=amount)
        for to_id, amount in by_dest.items()
    ]
    destinations.sort(key=lambda dest: dest.amount, reverse=True)
    return destinations


def _account_transfers(
    supabase, household_id: str, account_id: str, start: str, end: str
) -> list[AccountTransferFlow]:
    """Inter-account transfers touching ``account_id`` this month, as Sankey flows.

    Single-account view only (00058 T5c): ``out`` = ``account_id → another courant``,
    ``in`` = ``→ account_id`` from a courant or epargne. ``account_id → epargne`` is a
    SavingsDestination, not a transfer flow, so it is excluded here. The counterpart's
    name is resolved from ``accounts`` (courant legs) or ``savings_accounts`` (epargne).
    """
    rows = cast(
        list[dict],
        supabase.table("transfers")
        .select("from_kind,from_id,to_kind,to_id,amount")
        .eq("household_id", household_id)
        .or_(f"from_id.eq.{account_id},to_id.eq.{account_id}")
        .gte("date", start)
        .lt("date", end)
        .execute()
        .data
        or [],
    )

    # Collect counterpart legs to resolve names, split by which table backs them.
    flows: list[tuple[str, str, str, float]] = []  # (direction, kind, counterpart_id, amount)
    for row in rows:
        amount = float(row["amount"])
        if row["from_id"] == account_id and row["to_kind"] == "courant":
            flows.append(("out", row["to_kind"], row["to_id"], amount))
        elif row["to_id"] == account_id:
            flows.append(("in", row["from_kind"], row["from_id"], amount))
        # from_id == account_id and to_kind == 'epargne' → handled as a SavingsDestination.

    if not flows:
        return []

    courant_ids = {cid for _, kind, cid, _ in flows if kind == "courant"}
    epargne_ids = {cid for _, kind, cid, _ in flows if kind == "epargne"}
    names: dict[str, str | None] = {}
    for table, ids in (("accounts", courant_ids), ("savings_accounts", epargne_ids)):
        if ids:
            for row in cast(
                list[dict],
                supabase.table(table).select("id,name").in_("id", list(ids)).execute().data or [],
            ):
                names[row["id"]] = row.get("name")

    return [
        AccountTransferFlow(direction=direction, counterpart_name=names.get(cid), amount=amount)
        for direction, _, cid, amount in flows
    ]
