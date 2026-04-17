"""Budget endpoints — zero-based budgeting."""

import re
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.schemas.budgets import (
    AllocationOut,
    BudgetOut,
    BudgetSummary,
    BudgetUpsert,
    CategorySummary,
)

router = APIRouter(prefix="/api/budgets")

_MONTH_RE = re.compile(r"^\d{4}-\d{2}$")


def _validate_month(month: str) -> None:
    if not _MONTH_RE.match(month):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must be in YYYY-MM format",
        )


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


def _build_budget_out(budget_row: dict, allocation_rows: list[dict]) -> BudgetOut:
    allocations = [AllocationOut(**row) for row in allocation_rows]
    total_allocated = sum(a.amount for a in allocations)
    return BudgetOut(
        id=budget_row["id"],
        household_id=budget_row["household_id"],
        month=budget_row["month"],
        income=budget_row["income"],
        over_budget=total_allocated > budget_row["income"],
        allocations=allocations,
        created_at=budget_row["created_at"],
        updated_at=budget_row["updated_at"],
    )


@router.get("/{month}", response_model=BudgetOut)
async def get_budget(
    month: str,
    claims: dict = Depends(get_current_user),
) -> BudgetOut:
    """Get budget for a given month. Returns 404 if not yet created."""
    _validate_month(month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    budget_result = (
        supabase.table("budgets")
        .select("*")
        .eq("household_id", household_id)
        .eq("month", month)
        .limit(1)
        .execute()
    )
    rows = cast(list[dict], budget_result.data if isinstance(budget_result.data, list) else [])
    budget_row: dict | None = rows[0] if rows else None
    if not budget_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    alloc_result = (
        supabase.table("budget_allocations")
        .select("id, category_id, amount")
        .eq("budget_id", budget_row["id"])
        .execute()
    )
    allocation_rows = cast(list[dict], alloc_result.data or [])
    return _build_budget_out(budget_row, allocation_rows)


@router.put("/{month}", response_model=BudgetOut)
async def upsert_budget(
    month: str,
    body: BudgetUpsert,
    claims: dict = Depends(get_current_user),
) -> BudgetOut:
    """Create or update budget for a given month (upsert). Atomically replaces allocations."""
    _validate_month(month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    # Upsert budget row
    upsert_result = (
        supabase.table("budgets")
        .upsert(
            {"household_id": household_id, "month": month, "income": body.income},
            on_conflict="household_id,month",
        )
        .execute()
    )
    rows = cast(list[dict], upsert_result.data or [])
    budget_row = rows[0]
    budget_id = budget_row["id"]

    # Replace allocations atomically: delete then insert
    supabase.table("budget_allocations").delete().eq("budget_id", budget_id).execute()

    allocation_rows: list[dict] = []
    if body.allocations:
        alloc_payload = [
            {
                "budget_id": budget_id,
                "category_id": str(a.category_id),
                "amount": a.amount,
            }
            for a in body.allocations
        ]
        alloc_result = supabase.table("budget_allocations").insert(alloc_payload).execute()
        allocation_rows = cast(list[dict], alloc_result.data or [])

    return _build_budget_out(budget_row, allocation_rows)


@router.get("/{month}/summary", response_model=BudgetSummary)
async def get_budget_summary(
    month: str,
    claims: dict = Depends(get_current_user),
) -> BudgetSummary:
    """Return allocated vs spent per category for the month.

    Works even without a budget: shows real spending with allocated=0.
    """
    _validate_month(month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    budget_result = (
        supabase.table("budgets")
        .select("*")
        .eq("household_id", household_id)
        .eq("month", month)
        .limit(1)
        .execute()
    )
    rows = cast(list[dict], budget_result.data if isinstance(budget_result.data, list) else [])
    budget_row: dict | None = rows[0] if rows else None

    # Fetch allocations only if a budget exists
    allocations: list[dict] = []
    if budget_row:
        alloc_result = (
            supabase.table("budget_allocations")
            .select("category_id, amount, categories(id, name)")
            .eq("budget_id", budget_row["id"])
            .execute()
        )
        allocations = cast(list[dict], alloc_result.data or [])

    # Fetch expense transactions for the month
    year, m = month.split("-")
    next_year, next_month = (int(year), int(m) + 1) if int(m) < 12 else (int(year) + 1, 1)
    tx_result = (
        supabase.table("transactions")
        .select("category_id, amount, type")
        .eq("household_id", household_id)
        .eq("type", "expense")
        .gte("date", f"{year}-{int(m):02d}-01")
        .lt("date", f"{next_year}-{next_month:02d}-01")
        .execute()
    )
    transactions = cast(list[dict], tx_result.data or [])

    spent_map: dict[str, float] = {}
    for tx in transactions:
        cat_id = tx["category_id"]
        if cat_id:
            spent_map[cat_id] = spent_map.get(cat_id, 0.0) + tx["amount"]

    # Build summaries from allocations first
    categories_seen: set[str] = set()
    category_summaries: list[CategorySummary] = []

    for alloc in allocations:
        cat_id = str(alloc["category_id"])
        cat_name = alloc["categories"]["name"] if alloc.get("categories") else "Inconnue"
        allocated = float(alloc["amount"])
        spent = spent_map.get(cat_id, 0.0)
        categories_seen.add(cat_id)
        category_summaries.append(
            CategorySummary(
                category_id=alloc["category_id"],
                category_name=cat_name,
                allocated=allocated,
                spent=spent,
                remaining=allocated - spent,
            )
        )

    # Add categories with spending but no allocation
    unallocated_ids = [cid for cid in spent_map if cid not in categories_seen]
    if unallocated_ids:
        cat_result = (
            supabase.table("categories")
            .select("id, name")
            .in_("id", unallocated_ids)
            .execute()
        )
        cat_name_map = {str(c["id"]): c["name"] for c in cast(list[dict], cat_result.data or [])}
        for cat_id in unallocated_ids:
            spent = spent_map[cat_id]
            category_summaries.append(
                CategorySummary(
                    category_id=UUID(cat_id),
                    category_name=cat_name_map.get(cat_id, "Inconnue"),
                    allocated=0.0,
                    spent=spent,
                    remaining=-spent,
                )
            )

    income = float(budget_row["income"]) if budget_row else 0.0
    total_allocated = sum(c.allocated for c in category_summaries)
    total_spent = sum(c.spent for c in category_summaries)

    return BudgetSummary(
        month=month,
        income=income,
        total_allocated=total_allocated,
        total_spent=total_spent,
        over_budget=total_allocated > income if income > 0 else False,
        categories=category_summaries,
    )


@router.post("/{month}/copy-from/{source_month}", response_model=BudgetOut)
async def copy_budget(
    month: str,
    source_month: str,
    claims: dict = Depends(get_current_user),
) -> BudgetOut:
    """Copy allocations from source_month into month. Income is NOT copied."""
    _validate_month(month)
    _validate_month(source_month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    # Source budget must exist
    source_result = (
        supabase.table("budgets")
        .select("*")
        .eq("household_id", household_id)
        .eq("month", source_month)
        .limit(1)
        .execute()
    )
    source_rows = cast(list[dict], source_result.data if isinstance(source_result.data, list) else [])
    source_row: dict | None = source_rows[0] if source_rows else None
    if not source_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source budget {source_month} not found",
        )

    # Get source allocations
    source_alloc_result = (
        supabase.table("budget_allocations")
        .select("category_id, amount")
        .eq("budget_id", source_row["id"])
        .execute()
    )
    source_allocs = cast(list[dict], source_alloc_result.data or [])

    # Upsert target budget (keep existing income if already set, else use 0)
    target_result = (
        supabase.table("budgets")
        .select("*")
        .eq("household_id", household_id)
        .eq("month", month)
        .limit(1)
        .execute()
    )
    target_rows = cast(list[dict], target_result.data if isinstance(target_result.data, list) else [])
    target_row: dict | None = target_rows[0] if target_rows else None
    income = float(target_row["income"]) if target_row else 0.0

    upsert_result = (
        supabase.table("budgets")
        .upsert(
            {"household_id": household_id, "month": month, "income": income},
            on_conflict="household_id,month",
        )
        .execute()
    )
    budget_row = cast(list[dict], upsert_result.data or [])[0]
    budget_id = budget_row["id"]

    # Replace allocations with source allocations
    supabase.table("budget_allocations").delete().eq("budget_id", budget_id).execute()

    allocation_rows: list[dict] = []
    if source_allocs:
        alloc_payload = [
            {"budget_id": budget_id, "category_id": str(a["category_id"]), "amount": a["amount"]}
            for a in source_allocs
        ]
        alloc_result = supabase.table("budget_allocations").insert(alloc_payload).execute()
        allocation_rows = cast(list[dict], alloc_result.data or [])

    return _build_budget_out(budget_row, allocation_rows)
