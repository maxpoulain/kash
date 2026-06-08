"""Categories and transactions endpoints."""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.routers.recurring_transactions import materialize_due_for_household
from app.schemas.transactions import (
    CategoryOut,
    TransactionCreate,
    TransactionOut,
    TransactionUpdate,
)

router = APIRouter(prefix="/api")


def _get_household_id(user_id: str) -> str:
    """Fetch the household_id for the given user."""
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
    household_id: str = data["household_id"]
    return household_id


# --- Categories ---


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(claims: dict = Depends(get_current_user)) -> list[CategoryOut]:
    """List predefined categories plus custom ones for the user's household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("categories")
        .select("*")
        .or_(f"household_id.is.null,household_id.eq.{household_id}")
        .execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return [CategoryOut(**row) for row in rows]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    name: str,
    icon: str | None = None,
    claims: dict = Depends(get_current_user),
) -> CategoryOut:
    """Create a custom category for the user's household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("categories")
        .insert({"household_id": household_id, "name": name, "icon": icon, "is_default": False})
        .execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return CategoryOut(**rows[0])


# --- Transactions ---


@router.get("/transactions", response_model=list[TransactionOut])
async def list_transactions(
    month: str | None = Query(None, description="Filter by month, format YYYY-MM"),
    claims: dict = Depends(get_current_user),
) -> list[TransactionOut]:
    """List transactions for the user's household, optionally filtered by month.

    Materializes any due recurring transactions before returning (lazy generation).
    """
    household_id = _get_household_id(claims["sub"])
    materialize_due_for_household(household_id)
    supabase = get_supabase()

    query = supabase.table("transactions").select("*").eq("household_id", household_id)

    if month:
        try:
            year_str, month_str = month.split("-")
            year, m = int(year_str), int(month_str)
            next_year, next_month = (year, m + 1) if m < 12 else (year + 1, 1)
            query = query.gte("date", f"{year}-{m:02d}-01").lt(
                "date", f"{next_year}-{next_month:02d}-01"
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="month must be in YYYY-MM format",
            )

    result = query.order("date", desc=True).execute()
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return [TransactionOut(**row) for row in rows]


@router.post("/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    body: TransactionCreate,
    claims: dict = Depends(get_current_user),
) -> TransactionOut:
    """Create a transaction for the user's household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    payload = {
        "household_id": household_id,
        "created_by": claims["sub"],
        "amount": body.amount,
        "type": body.type.value,
        "date": body.date.isoformat(),
        "note": body.note,
        "category_id": str(body.category_id) if body.category_id else None,
    }

    result = supabase.table("transactions").insert(payload).execute()
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return TransactionOut(**rows[0])


@router.put("/transactions/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    claims: dict = Depends(get_current_user),
) -> TransactionOut:
    """Update a transaction. Returns 403 if it belongs to another household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing_result = (
        supabase.table("transactions")
        .select("household_id")
        .eq("id", transaction_id)
        .single()
        .execute()
    )
    existing: dict = existing_result.data if isinstance(existing_result.data, dict) else {}
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if existing["household_id"] != household_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = body.model_dump(exclude_none=True)
    if "type" in updates:
        updates["type"] = updates["type"].value
    if "date" in updates:
        updates["date"] = updates["date"].isoformat()
    if "category_id" in updates:
        updates["category_id"] = str(updates["category_id"])

    result = (
        supabase.table("transactions").update(updates).eq("id", transaction_id).execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return TransactionOut(**rows[0])


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    claims: dict = Depends(get_current_user),
) -> None:
    """Delete a transaction. Returns 403 if it belongs to another household."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    existing_result = (
        supabase.table("transactions")
        .select("household_id")
        .eq("id", transaction_id)
        .single()
        .execute()
    )
    existing: dict = existing_result.data if isinstance(existing_result.data, dict) else {}
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if existing["household_id"] != household_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    supabase.table("transactions").delete().eq("id", transaction_id).execute()
