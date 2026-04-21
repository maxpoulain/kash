"""Savings accounts endpoints."""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.schemas.savings_accounts import SavingsAccountCreate, SavingsAccountOut, SavingsAccountUpdate

router = APIRouter(prefix="/api/savings-accounts")


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
    return SavingsAccountOut(**rows[0])


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
    return SavingsAccountOut(**rows[0])


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_account(
    account_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    supabase.table("savings_accounts").delete().eq("id", account_id).eq("household_id", household_id).execute()
