"""Recurring transaction rule endpoints + lazy materialization of due occurrences."""

from datetime import date as Date
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.categories import _ensure_category_exists
from app.core.supabase import get_supabase
from app.schemas.recurring_transactions import (
    RecurringTransactionCreate,
    RecurringTransactionOut,
    RecurringTransactionUpdate,
)
from app.services.recurring import due_occurrences, initial_next_run_date

router = APIRouter(prefix="/api/recurring-transactions")


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


def materialize_due_for_household(household_id: str, today: Date | None = None) -> None:
    """Generate any due transactions for the household's active recurring rules.

    Idempotent: each rule's ``next_run_date`` is advanced past ``today`` so a
    second call the same day creates nothing.
    """
    today = today or Date.today()
    supabase = get_supabase()

    rules = cast(
        list[dict],
        (
            supabase.table("recurring_transactions")
            .select("*")
            .eq("household_id", household_id)
            .eq("active", True)
            .lte("next_run_date", today.isoformat())
            .execute()
            .data
        )
        or [],
    )

    for rule in rules:
        end = Date.fromisoformat(rule["end_date"]) if rule["end_date"] else None
        occurrences, new_next = due_occurrences(
            next_run_date=Date.fromisoformat(rule["next_run_date"]),
            frequency=rule["frequency"],
            anchor_day=rule["anchor_day"],
            today=today,
            end_date=end,
        )
        if occurrences:
            supabase.table("transactions").insert(
                [
                    {
                        "household_id": household_id,
                        "created_by": rule["created_by"],
                        "category_id": rule["category_id"],
                        "amount": rule["amount"],
                        "type": rule["type"],
                        "date": occ.isoformat(),
                        "note": rule["note"],
                        "recurring_id": rule["id"],
                    }
                    for occ in occurrences
                ]
            ).execute()
        if new_next.isoformat() != rule["next_run_date"]:
            supabase.table("recurring_transactions").update(
                {"next_run_date": new_next.isoformat()}
            ).eq("id", rule["id"]).execute()


@router.get("", response_model=list[RecurringTransactionOut])
async def list_recurring_transactions(
    claims: dict = Depends(get_current_user),
) -> list[RecurringTransactionOut]:
    """List recurring rules for the user's household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    rows = cast(
        list[dict],
        (
            supabase.table("recurring_transactions")
            .select("*")
            .eq("household_id", household_id)
            .order("created_at", desc=True)
            .execute()
            .data
        )
        or [],
    )
    return [RecurringTransactionOut(**row) for row in rows]


@router.post("", response_model=RecurringTransactionOut, status_code=status.HTTP_201_CREATED)
async def create_recurring_transaction(
    body: RecurringTransactionCreate,
    claims: dict = Depends(get_current_user),
) -> RecurringTransactionOut:
    """Create a recurring rule, computing its first run date."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    anchor_day = cast(int, body.anchor_day)
    next_run = initial_next_run_date(body.start_date, anchor_day, body.frequency.value)

    category_id = _ensure_category_exists(
        household_id, str(body.category_id) if body.category_id else None
    )

    payload = {
        "household_id": household_id,
        "created_by": claims["sub"],
        "category_id": category_id,
        "amount": body.amount,
        "type": body.type.value,
        "note": body.note,
        "frequency": body.frequency.value,
        "anchor_day": anchor_day,
        "start_date": body.start_date.isoformat(),
        "end_date": body.end_date.isoformat() if body.end_date else None,
        "next_run_date": next_run.isoformat(),
    }
    rows = cast(
        list[dict],
        supabase.table("recurring_transactions").insert(payload).execute().data or [],
    )
    return RecurringTransactionOut(**rows[0])


@router.patch("/{rule_id}", response_model=RecurringTransactionOut)
async def update_recurring_transaction(
    rule_id: str,
    body: RecurringTransactionUpdate,
    claims: dict = Depends(get_current_user),
) -> RecurringTransactionOut:
    """Update a recurring rule. Returns 403 if it belongs to another household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing = cast(
        dict,
        (
            supabase.table("recurring_transactions")
            .select("household_id")
            .eq("id", rule_id)
            .single()
            .execute()
            .data
        )
        or {},
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    if existing["household_id"] != household_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = body.model_dump(exclude_none=True)
    for key in ("type", "frequency"):
        if key in updates:
            updates[key] = updates[key].value
    for key in ("start_date", "end_date"):
        if key in updates and updates[key] is not None:
            updates[key] = updates[key].isoformat()
    if "category_id" in updates and updates["category_id"] is not None:
        updates["category_id"] = _ensure_category_exists(
            household_id, str(updates["category_id"])
        )

    rows = cast(
        list[dict],
        supabase.table("recurring_transactions")
        .update(updates)
        .eq("id", rule_id)
        .execute()
        .data
        or [],
    )
    return RecurringTransactionOut(**rows[0])


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_transaction(
    rule_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    """Delete a recurring rule. Already-generated transactions are kept."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing = cast(
        dict,
        (
            supabase.table("recurring_transactions")
            .select("household_id")
            .eq("id", rule_id)
            .single()
            .execute()
            .data
        )
        or {},
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    if existing["household_id"] != household_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    supabase.table("recurring_transactions").delete().eq("id", rule_id).execute()
