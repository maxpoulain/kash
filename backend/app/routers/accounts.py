"""Accounts endpoints — cash-flow containers with calculated balances.

Part of 00058-comptes-multiples (T2). Balance = initial_balance + Σ income −
Σ expense (transfers join in T3). Listing scopes through visible_account_ids so
T4 can hide other members' private accounts without touching this router.
"""

from collections import defaultdict
from datetime import date, datetime, timezone
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.accounts import visible_account_ids
from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.transactions import _get_household_id
from app.schemas.accounts import AccountCreate, AccountOut, AccountUpdate

router = APIRouter(prefix="/api/accounts")


def _compute_balances(account_ids: list[str]) -> dict[str, float]:
    """Net delta per account, excluding initial_balance:
    +income −expense (transactions) +transfer-in −transfer-out (transfers, compte legs).
    """
    if not account_ids:
        return {}
    supabase = get_supabase()
    deltas: dict[str, float] = defaultdict(float)

    tx = (
        supabase.table("transactions")
        .select("account_id,amount,type")
        .in_("account_id", account_ids)
        .execute()
    )
    tx_rows = cast(list[dict], tx.data if isinstance(tx.data, list) else [])
    for row in tx_rows:
        amount = float(row["amount"])
        deltas[row["account_id"]] += amount if row["type"] == "income" else -amount

    # Transfers: a leg only affects a balance when it's a courant. Epargne legs
    # are recorded but leave the asset value untouched (manual/snapshot).
    ids_csv = ",".join(account_ids)
    tr = (
        supabase.table("transfers")
        .select("from_kind,from_id,to_kind,to_id,amount")
        .or_(f"from_id.in.({ids_csv}),to_id.in.({ids_csv})")
        .execute()
    )
    tr_rows = cast(list[dict], tr.data if isinstance(tr.data, list) else [])
    account_set = set(account_ids)
    for row in tr_rows:
        amount = float(row["amount"])
        if row["from_kind"] == "courant" and row["from_id"] in account_set:
            deltas[row["from_id"]] -= amount
        if row["to_kind"] == "courant" and row["to_id"] in account_set:
            deltas[row["to_id"]] += amount

    return deltas


def account_networth_events(account_ids: list[str]) -> tuple[float, list[tuple[date, float]]]:
    """Net-worth history inputs for a set of accounts (00058 T5b).

    Returns ``(base, events)`` where ``base`` is the constant Σ ``initial_balance``
    and ``events`` is every dated balance change (income +, expense −, courant
    transfer legs ±). The balance at date ``d`` is ``base + Σ events with date ≤ d``.

    A ``courant → courant`` transfer between two of these accounts emits two events
    (−amount, +amount) that net to zero — internal moves don't change net worth.
    Computed on the fly (accounts are calculated, never stored); see the increment.
    """
    if not account_ids:
        return 0.0, []
    supabase = get_supabase()

    acc_rows = cast(
        list[dict],
        supabase.table("accounts")
        .select("initial_balance")
        .in_("id", account_ids)
        .execute()
        .data
        or [],
    )
    base = sum(float(row["initial_balance"]) for row in acc_rows)

    events: list[tuple[date, float]] = []

    tx_rows = cast(
        list[dict],
        supabase.table("transactions")
        .select("amount,type,date")
        .in_("account_id", account_ids)
        .execute()
        .data
        or [],
    )
    for row in tx_rows:
        amount = float(row["amount"])
        events.append((date.fromisoformat(row["date"]), amount if row["type"] == "income" else -amount))

    ids_csv = ",".join(account_ids)
    tr_rows = cast(
        list[dict],
        supabase.table("transfers")
        .select("from_kind,from_id,to_kind,to_id,amount,date")
        .or_(f"from_id.in.({ids_csv}),to_id.in.({ids_csv})")
        .execute()
        .data
        or [],
    )
    account_set = set(account_ids)
    for row in tr_rows:
        amount = float(row["amount"])
        d = date.fromisoformat(row["date"])
        if row["from_kind"] == "courant" and row["from_id"] in account_set:
            events.append((d, -amount))
        if row["to_kind"] == "courant" and row["to_id"] in account_set:
            events.append((d, amount))

    return base, events


def _to_out(row: dict, delta: float) -> AccountOut:
    return AccountOut(**row, balance=float(row["initial_balance"]) + delta)


@router.get("", response_model=list[AccountOut])
async def list_accounts(
    include_archived: bool = False,
    claims: dict = Depends(get_current_user),
) -> list[AccountOut]:
    """List the user's visible accounts with calculated balances."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    visible = visible_account_ids(household_id, claims["sub"])
    if not visible:
        return []

    query = supabase.table("accounts").select("*").in_("id", visible)
    if not include_archived:
        query = query.is_("archived_at", "null")
    rows = cast(list[dict], query.order("created_at").execute().data or [])

    deltas = _compute_balances([row["id"] for row in rows])
    return [_to_out(row, deltas.get(row["id"], 0.0)) for row in rows]


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreate,
    claims: dict = Depends(get_current_user),
) -> AccountOut:
    """Create an account for the user's household (owner_id null = household account)."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("accounts")
        .insert(
            {
                "household_id": household_id,
                "name": payload.name,
                "type": payload.type,
                "initial_balance": payload.initial_balance,
                "institution": payload.institution,
            }
        )
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Insert failed"
        )
    # Fresh account: no transactions yet, so balance == initial_balance.
    return _to_out(rows[0], 0.0)


@router.patch("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: str,
    payload: AccountUpdate,
    claims: dict = Depends(get_current_user),
) -> AccountOut:
    """Rename, retype, adjust initial_balance, or archive/unarchive an account."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    updates: dict = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.type is not None:
        updates["type"] = payload.type
    if payload.initial_balance is not None:
        updates["initial_balance"] = payload.initial_balance
    if payload.institution is not None:
        updates["institution"] = payload.institution
    if payload.archived is not None:
        updates["archived_at"] = (
            datetime.now(timezone.utc).isoformat() if payload.archived else None
        )
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update"
        )

    result = (
        supabase.table("accounts")
        .update(updates)
        .eq("id", account_id)
        .eq("household_id", household_id)
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    deltas = _compute_balances([account_id])
    return _to_out(rows[0], deltas.get(account_id, 0.0))


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    """Hard-delete an account, but only if it carries no transactions (else 409)."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing = (
        supabase.table("transactions")
        .select("id")
        .eq("account_id", account_id)
        .limit(1)
        .execute()
    )
    if cast(list[dict], existing.data or []):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account has transactions; archive it instead",
        )

    supabase.table("accounts").delete().eq("id", account_id).eq(
        "household_id", household_id
    ).execute()
