"""Transfers between accounts (00058 T3).

Polymorphic legs ({kind, id}): a leg is a cash-flow account ('compte') or a wealth
asset ('patrimoine'). Symmetric model. At least one leg must be a compte.

Transfers never touch the `transactions` table, so summary/goals/budgets ignore
them by construction (no income/expense effect). Their effect on a compte's
calculated balance is handled in routers/accounts.py (_compute_balances).
"""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.transactions import _get_household_id
from app.schemas.transfers import Kind, TransferCreate, TransferOut

router = APIRouter(prefix="/api/transfers")

# Which table backs each leg kind.
_KIND_TABLE = {"compte": "accounts", "patrimoine": "savings_accounts"}


def _leg_belongs_to_household(kind: Kind, leg_id: str, household_id: str) -> bool:
    """True if the {kind, id} leg exists within the household."""
    supabase = get_supabase()
    result = (
        supabase.table(_KIND_TABLE[kind])
        .select("id")
        .eq("id", leg_id)
        .eq("household_id", household_id)
        .execute()
    )
    return bool(cast(list[dict], result.data or []))


@router.get("", response_model=list[TransferOut])
async def list_transfers(claims: dict = Depends(get_current_user)) -> list[TransferOut]:
    """List the household's transfers, most recent first."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    rows = cast(
        list[dict],
        supabase.table("transfers")
        .select("*")
        .eq("household_id", household_id)
        .order("date", desc=True)
        .execute()
        .data
        or [],
    )
    return [TransferOut(**row) for row in rows]


@router.post("", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    payload: TransferCreate,
    claims: dict = Depends(get_current_user),
) -> TransferOut:
    """Record a transfer. At least one leg must be a compte; both legs must belong
    to the caller's household."""
    household_id = _get_household_id(claims["sub"])

    if payload.from_kind != "compte" and payload.to_kind != "compte":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one leg must be a compte (patrimoine→patrimoine not allowed)",
        )

    for kind, leg_id in ((payload.from_kind, payload.from_id), (payload.to_kind, payload.to_id)):
        if not _leg_belongs_to_household(kind, str(leg_id), household_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{kind} {leg_id} not found in household",
            )

    supabase = get_supabase()
    result = (
        supabase.table("transfers")
        .insert(
            {
                "household_id": household_id,
                "created_by": claims["sub"],
                "from_kind": payload.from_kind,
                "from_id": str(payload.from_id),
                "to_kind": payload.to_kind,
                "to_id": str(payload.to_id),
                "amount": payload.amount,
                "date": payload.date.isoformat(),
                "note": payload.note,
            }
        )
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Insert failed"
        )
    return TransferOut(**rows[0])


@router.delete("/{transfer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transfer(
    transfer_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    """Delete a transfer; its balance effects vanish since balances are calculated."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    supabase.table("transfers").delete().eq("id", transfer_id).eq(
        "household_id", household_id
    ).execute()
