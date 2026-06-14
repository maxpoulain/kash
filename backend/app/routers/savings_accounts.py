"""Savings accounts endpoints."""

import datetime
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.accounts import visible_account_ids
from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.accounts import account_networth_events
from app.schemas.savings_accounts import NetWorthHistoryPoint, SavingsAccountCreate, SavingsAccountOut, SavingsAccountUpdate

router = APIRouter(prefix="/api/savings-accounts")


def _upsert_snapshot(account_id: str, balance: float) -> None:
    supabase = get_supabase()
    today = datetime.date.today().isoformat()
    supabase.table("savings_snapshots").upsert(
        {"account_id": account_id, "date": today, "balance": balance},
        on_conflict="account_id,date",
    ).execute()


def _get_household_id(user_id: str) -> str:
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("household_id")
        .eq("id", user_id)
        .single()
        .execute()
    )
    data: dict = result.data if isinstance(result.data, dict) else {}
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return cast(str, data["household_id"])


@router.get("", response_model=list[SavingsAccountOut])
async def list_savings_accounts(
    claims: dict = Depends(get_current_user),
) -> list[SavingsAccountOut]:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("savings_accounts")
        .select("id, name, type, balance, institution")
        .eq("household_id", household_id)
        .order("created_at")
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    return [SavingsAccountOut(**row) for row in rows]


@router.post("", response_model=SavingsAccountOut, status_code=status.HTTP_201_CREATED)
async def create_savings_account(
    payload: SavingsAccountCreate,
    claims: dict = Depends(get_current_user),
) -> SavingsAccountOut:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("savings_accounts")
        .insert({
            "household_id": household_id,
            "created_by": claims["sub"],
            "name": payload.name,
            "type": payload.type,
            "balance": payload.balance,
            "institution": payload.institution,
        })
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Insert failed")
    account = SavingsAccountOut(**rows[0])
    _upsert_snapshot(account.id, account.balance)
    return account


@router.put("/{account_id}", response_model=SavingsAccountOut)
async def update_savings_account(
    account_id: str,
    payload: SavingsAccountUpdate,
    claims: dict = Depends(get_current_user),
) -> SavingsAccountOut:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update")

    result = (
        supabase.table("savings_accounts")
        .update(updates)
        .eq("id", account_id)
        .eq("household_id", household_id)
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    account = SavingsAccountOut(**rows[0])
    _upsert_snapshot(account.id, account.balance)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_account(
    account_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    supabase.table("savings_accounts").delete().eq("id", account_id).eq("household_id", household_id).execute()


@router.get("/history", response_model=list[NetWorthHistoryPoint])
async def get_net_worth_history(
    claims: dict = Depends(get_current_user),
) -> list[NetWorthHistoryPoint]:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    # Wealth (patrimoine): forward-filled snapshots — at each date, an account's
    # value is its most recent snapshot on or before that date. A household may have
    # no wealth accounts yet and still get history from its cash accounts below.
    from collections import defaultdict

    by_account: dict[str, list[tuple[datetime.date, float]]] = defaultdict(list)
    account_ids = [
        row["id"]
        for row in cast(
            list[dict],
            supabase.table("savings_accounts")
            .select("id")
            .eq("household_id", household_id)
            .execute()
            .data
            or [],
        )
    ]
    if account_ids:
        snapshot_rows = cast(
            list[dict],
            supabase.table("savings_snapshots")
            .select("account_id, date, balance")
            .in_("account_id", account_ids)
            .order("date")
            .execute()
            .data
            or [],
        )
        for r in snapshot_rows:
            by_account[r["account_id"]].append(
                (datetime.date.fromisoformat(r["date"]), float(r["balance"]))
            )

    # Cash (comptes): each visible account's balance at a past date, computed on
    # the fly from its dated events (00058 T5b). Sorted so we can sweep cumulatively.
    visible = visible_account_ids(household_id, claims["sub"])
    base_cash, cash_events = account_networth_events(visible)
    cash_events.sort(key=lambda ev: ev[0])

    # The axis is every date that moves net worth: snapshot dates ∪ cash-event dates.
    dates: list[datetime.date] = sorted(
        {d for snaps in by_account.values() for d, _ in snaps} | {d for d, _ in cash_events}
    )
    if not dates:
        return []

    last_known: dict[str, float] = {}
    snapshot_index: dict[str, int] = {aid: 0 for aid in by_account}
    cash_index = 0
    cash_running = 0.0
    result_points: list[NetWorthHistoryPoint] = []

    for date in dates:
        for aid, snapshots in by_account.items():
            idx = snapshot_index[aid]
            while idx < len(snapshots) and snapshots[idx][0] <= date:
                last_known[aid] = snapshots[idx][1]
                idx += 1
            snapshot_index[aid] = idx
        while cash_index < len(cash_events) and cash_events[cash_index][0] <= date:
            cash_running += cash_events[cash_index][1]
            cash_index += 1
        total = sum(last_known.values()) + base_cash + cash_running
        result_points.append(NetWorthHistoryPoint(date=date, total=total))

    return result_points
