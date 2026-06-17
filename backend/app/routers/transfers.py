"""Transfers between accounts (00058 T3).

Polymorphic legs ({kind, id}): a leg is a checking account ('courant') or a
savings/wealth account ('epargne'). Symmetric model. At least one leg must be courant.

Transfers never touch the `transactions` table, so summary/goals/budgets ignore
them by construction (no income/expense effect). Their effect on a compte's
calculated balance is handled in routers/accounts.py (_compute_balances).
"""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.transactions import _get_household_id
from app.schemas.transfers import Kind, TransferCreate, TransferOut, TransferUpdate

router = APIRouter(prefix="/api/transfers")

# Which table backs each leg kind.
_KIND_TABLE = {"courant": "accounts", "epargne": "savings_accounts"}


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
    """Record a transfer. At least one leg must be courant; both legs must belong
    to the caller's household."""
    household_id = _get_household_id(claims["sub"])

    if payload.from_kind != "courant" and payload.to_kind != "courant":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one leg must be courant (epargne→epargne not allowed)",
        )

    legs: list[tuple[Kind, str]] = [
        (payload.from_kind, str(payload.from_id)),
        (payload.to_kind, str(payload.to_id)),
    ]
    for kind, leg_id in legs:
        if not _leg_belongs_to_household(kind, leg_id, household_id):
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


@router.patch("/{transfer_id}", response_model=TransferOut)
async def update_transfer(
    transfer_id: str,
    payload: TransferUpdate,
    claims: dict = Depends(get_current_user),
) -> TransferOut:
    """Update a transfer. 404 if missing, 403 if it belongs to another household.

    Validation mirrors create but runs on the merged (existing + patch) legs: at
    least one leg must stay courant, and any leg must belong to the household.
    """
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing_result = (
        supabase.table("transfers").select("*").eq("id", transfer_id).single().execute()
    )
    existing: dict = existing_result.data if isinstance(existing_result.data, dict) else {}
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
    if existing["household_id"] != household_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = payload.model_dump(exclude_unset=True)

    # Merge patch over existing to validate the resulting legs.
    from_kind = cast(Kind, updates.get("from_kind", existing["from_kind"]))
    from_id = str(updates.get("from_id", existing["from_id"]))
    to_kind = cast(Kind, updates.get("to_kind", existing["to_kind"]))
    to_id = str(updates.get("to_id", existing["to_id"]))

    if from_kind != "courant" and to_kind != "courant":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one leg must be courant (epargne→epargne not allowed)",
        )

    legs: list[tuple[Kind, str]] = [(from_kind, from_id), (to_kind, to_id)]
    for kind, leg_id in legs:
        if not _leg_belongs_to_household(kind, leg_id, household_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{kind} {leg_id} not found in household",
            )

    # Normalise UUID/date fields for the DB.
    if "from_id" in updates:
        updates["from_id"] = str(updates["from_id"])
    if "to_id" in updates:
        updates["to_id"] = str(updates["to_id"])
    if "date" in updates:
        updates["date"] = updates["date"].isoformat()

    if updates:
        supabase.table("transfers").update(updates).eq("id", transfer_id).execute()

    refreshed = (
        supabase.table("transfers").select("*").eq("id", transfer_id).single().execute()
    )
    return TransferOut(**cast(dict, refreshed.data))


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
