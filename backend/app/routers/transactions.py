"""Categories and transactions endpoints."""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.accounts import visible_account_ids
from app.core.auth import get_current_user
from app.core.categories import (
    _ensure_category_exists,
    find_duplicate_category,
)
from app.core.supabase import get_supabase
from app.routers.recurring_transactions import materialize_due_for_household
from app.schemas.categories import CategoryCreate
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


def _get_default_account_id(household_id: str) -> str | None:
    """Return the household's principal account: the oldest one.

    At T1 there is exactly one account per household ("Compte principal"), so this
    is unambiguous. Used to attach a transaction when no account_id is supplied.
    """
    supabase = get_supabase()
    result = (
        supabase.table("accounts")
        .select("id")
        .eq("household_id", household_id)
        .order("created_at")
        .limit(1)
        .execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return rows[0]["id"] if rows else None


# --- Categories ---


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(claims: dict = Depends(get_current_user)) -> list[CategoryOut]:
    """List categories created for the user's household.

    Suggested categories are merged on the frontend (see 00052), so this returns
    only the household's own categories. A suggestion becomes a real row here the
    first time it is used (lazy creation in transactions/recurring routes).
    """
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("categories")
        .select("*")
        .eq("household_id", household_id)
        .execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return [CategoryOut(**row) for row in rows]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    claims: dict = Depends(get_current_user),
) -> CategoryOut:
    """Create a custom category for the user's household.

    Duplicate detection is case-insensitive and trimmed (the DB unique
    constraint on (household_id, name) is case-sensitive in Postgres).
    """
    household_id = _get_household_id(claims["sub"])
    name = category.name.strip()
    if find_duplicate_category(household_id, name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="duplicate")
    supabase = get_supabase()
    result = (
        supabase.table("categories")
        .insert(
            {
                "household_id": household_id,
                "name": name,
                "icon": category.icon,
                "type": category.type.value,
            }
        )
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
    # Validate input before doing any I/O.
    month_bounds: tuple[str, str] | None = None
    if month:
        try:
            year_str, month_str = month.split("-")
            year, m = int(year_str), int(month_str)
            next_year, next_month = (year, m + 1) if m < 12 else (year + 1, 1)
            month_bounds = (f"{year}-{m:02d}-01", f"{next_year}-{next_month:02d}-01")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="month must be in YYYY-MM format",
            )

    household_id = _get_household_id(claims["sub"])
    materialize_due_for_household(household_id)
    supabase = get_supabase()

    # Scope to the accounts the user may see. No-op in T1 (all accounts shared);
    # T4 flips visible_account_ids to exclude other members' private accounts.
    account_ids = visible_account_ids(household_id, claims["sub"])

    query = (
        supabase.table("transactions")
        .select("*")
        .eq("household_id", household_id)
        .in_("account_id", account_ids)
    )
    if month_bounds:
        query = query.gte("date", month_bounds[0]).lt("date", month_bounds[1])

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

    category_id = _ensure_category_exists(
        household_id, str(body.category_id) if body.category_id else None
    )

    account_id = (
        str(body.account_id) if body.account_id else _get_default_account_id(household_id)
    )

    payload = {
        "household_id": household_id,
        "created_by": claims["sub"],
        "amount": body.amount,
        "type": body.type.value,
        "date": body.date.isoformat(),
        "note": body.note,
        "category_id": category_id,
        "account_id": account_id,
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
        updates["category_id"] = _ensure_category_exists(
            household_id, str(updates["category_id"])
        )
    if "account_id" in updates:
        updates["account_id"] = str(updates["account_id"])

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
