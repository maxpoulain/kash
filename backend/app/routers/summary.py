"""Financial summary (aggregation) endpoint.

Aggregates a household's transactions for a given month into totals and
per-category breakdowns. Feeds the frontend "Analyse" page (Sankey + sections).
"""

from datetime import datetime, timezone
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.recurring_transactions import materialize_due_for_household
from app.routers.transactions import _get_household_id
from app.schemas.summary import CategoryAmount, SummaryOut

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
    claims: dict = Depends(get_current_user),
) -> SummaryOut:
    """Aggregate the household's transactions for ``month`` (defaults to current).

    Materializes any due recurring transactions first, so the summary matches
    what ``GET /transactions`` would return for the same month.
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

    tx_result = (
        supabase.table("transactions")
        .select("amount,type,category_id")
        .eq("household_id", household_id)
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

    return SummaryOut(
        month=month,
        total_income=total_income,
        total_expense=total_expense,
        net=total_income - total_expense,
        savings_rate=savings_rate,
        income_by_category=_to_breakdown(by_category["income"]),
        expense_by_category=_to_breakdown(by_category["expense"]),
    )
