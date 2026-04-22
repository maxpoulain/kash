"""Savings accounts endpoints."""

import datetime
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
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

    # All account IDs for this household
    accounts_result = (
        supabase.table("savings_accounts")
        .select("id")
        .eq("household_id", household_id)
        .execute()
    )
    account_ids = [row["id"] for row in cast(list[dict], accounts_result.data or [])]
    if not account_ids:
        return []

    # All snapshots for these accounts, ordered by date
    snapshots_result = (
        supabase.table("savings_snapshots")
        .select("account_id, date, balance")
        .in_("account_id", account_ids)
        .order("date")
        .execute()
    )
    rows = cast(list[dict], snapshots_result.data or [])

    # For each date, sum the latest known balance per account
    # Since we have one row per (account, date), we need to forward-fill:
    # at each date, an account's balance is the most recent snapshot on or before that date.
    # Build a sorted list of all distinct dates, then accumulate per-account last-known balance.
    from collections import defaultdict

    dates: list[datetime.date] = sorted({datetime.date.fromisoformat(r["date"]) for r in rows})
    if not dates:
        return []

    # Group snapshots by account
    by_account: dict[str, list[tuple[datetime.date, float]]] = defaultdict(list)
    for r in rows:
        by_account[r["account_id"]].append((datetime.date.fromisoformat(r["date"]), float(r["balance"])))

    # For each date, compute total using last known balance per account
    last_known: dict[str, float] = {}
    result_points: list[NetWorthHistoryPoint] = []
    snapshot_index: dict[str, int] = {aid: 0 for aid in by_account}

    for date in dates:
        for aid, snapshots in by_account.items():
            idx = snapshot_index[aid]
            while idx < len(snapshots) and snapshots[idx][0] <= date:
                last_known[aid] = snapshots[idx][1]
                idx += 1
            snapshot_index[aid] = idx
        total = sum(last_known.values())
        result_points.append(NetWorthHistoryPoint(date=date, total=total))

    return result_points
