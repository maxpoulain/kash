"""Spending goals endpoints."""

import re
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from app.core.auth import get_current_user
from app.core.categories import _ensure_category_exists
from app.core.supabase import get_supabase
from app.schemas.spending_goals import GoalCreate, GoalOut, GoalUpdate, SpendingGoalsResponse

router = APIRouter(prefix="/api/spending-goals")

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


def _get_first_day_of_month(month: str) -> str:
    """Convert YYYY-MM to YYYY-MM-01 for date comparison."""
    return f"{month}-01"


def _get_next_month_start(month: str) -> str:
    """Get the first day of the next month."""
    year, m = month.split("-")
    next_year, next_month = (int(year), int(m) + 1) if int(m) < 12 else (int(year) + 1, 1)
    return f"{next_year}-{next_month:02d}-01"


def _calculate_status(progress_percent: float) -> str:
    """Determine status based on progress percentage."""
    if progress_percent > 100:
        return "over_budget"
    elif progress_percent < 50:
        return "under_pace"
    else:
        return "on_track"


def _build_goal_out(goal_row: dict, spent_amount: float) -> GoalOut:
    """Build a GoalOut from a DB row and pre-computed spent amount."""
    cat_data = goal_row.get("categories", {}) or {}
    goal_amount = float(goal_row["amount"])
    remaining = goal_amount - spent_amount

    if goal_amount > 0:
        progress_percent = (spent_amount / goal_amount) * 100
    else:
        progress_percent = 0.0

    return GoalOut(
        id=goal_row["id"],
        category_id=goal_row["category_id"],
        category_name=cat_data.get("name", "Unknown"),
        category_icon=cat_data.get("icon"),
        goal_amount=goal_amount,
        spent_amount=spent_amount,
        progress_percent=round(progress_percent, 1),
        remaining=round(remaining, 2),
        status=_calculate_status(progress_percent),
    )


def _fetch_spent_amount(household_id: str, category_id: str, month: str) -> float:
    """Fetch total spent for a category in a month."""
    supabase = get_supabase()
    month_start = _get_first_day_of_month(month)
    next_month_start = _get_next_month_start(month)
    tx_result = (
        supabase.table("transactions")
        .select("amount")
        .eq("household_id", household_id)
        .eq("type", "expense")
        .eq("category_id", category_id)
        .gte("date", month_start)
        .lt("date", next_month_start)
        .execute()
    )
    transactions = cast(list[dict], tx_result.data or [])
    return sum(float(tx["amount"]) for tx in transactions)


@router.get("", response_model=SpendingGoalsResponse)
async def get_spending_goals(
    month: str,
    claims: dict = Depends(get_current_user),
) -> SpendingGoalsResponse:
    """Get all spending goals for a month with spending progress.

    Returns empty goals array if no goals are set for the month.
    """
    _validate_month(month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    # Fetch spending goals for the month
    month_start = _get_first_day_of_month(month)
    goals_result = (
        supabase.table("spending_goals")
        .select("*, categories(id, name, icon)")
        .eq("household_id", household_id)
        .eq("month", month_start)
        .execute()
    )
    goals_data = cast(list[dict], goals_result.data or [])

    # Fetch expense transactions for the month
    next_month_start = _get_next_month_start(month)
    tx_result = (
        supabase.table("transactions")
        .select("category_id, amount")
        .eq("household_id", household_id)
        .eq("type", "expense")
        .gte("date", month_start)
        .lt("date", next_month_start)
        .execute()
    )
    transactions = cast(list[dict], tx_result.data or [])

    # Build spent map per category
    spent_map: dict[str, float] = {}
    for tx in transactions:
        cat_id = tx.get("category_id")
        if cat_id:
            spent_map[cat_id] = spent_map.get(cat_id, 0.0) + float(tx["amount"])

    # Build goal outputs
    goals: list[GoalOut] = []
    total_goal = 0.0
    total_spent = 0.0

    for goal in goals_data:
        spent_amount = spent_map.get(str(goal["category_id"]), 0.0)
        goals.append(_build_goal_out(goal, spent_amount))
        total_goal += float(goal["amount"])
        total_spent += spent_amount

    return SpendingGoalsResponse(
        month=month,
        total_goal=round(total_goal, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(total_goal - total_spent, 2),
        goals=goals,
    )


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_spending_goal(
    payload: GoalCreate,
    claims: dict = Depends(get_current_user),
) -> GoalOut:
    """Create a new spending goal for a category in a given month."""
    _validate_month(payload.month)
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    month_start = _get_first_day_of_month(payload.month)

    # Suggested categories only get a DB row on first use (same lazy creation
    # as transactions) — a goal must be able to be the first use.
    category_id = _ensure_category_exists(household_id, str(payload.category_id))

    try:
        result = (
            supabase.table("spending_goals")
            .insert(
                {
                    "household_id": household_id,
                    "created_by": claims["sub"],
                    "category_id": category_id,
                    "month": month_start,
                    "amount": payload.amount,
                }
            )
            .execute()
        )
    except APIError as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A goal already exists for this category and month",
            )
        if "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        raise

    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Insert failed",
        )

    # Re-fetch with category join for goal output
    goal_row = (
        supabase.table("spending_goals")
        .select("*, categories(id, name, icon)")
        .eq("id", rows[0]["id"])
        .single()
        .execute()
    )
    goal_data = cast(dict, goal_row.data if isinstance(goal_row.data, dict) else {})

    return _build_goal_out(goal_data, spent_amount=0.0)


@router.put("/{goal_id}", response_model=GoalOut)
async def update_spending_goal(
    goal_id: str,
    payload: GoalUpdate,
    claims: dict = Depends(get_current_user),
) -> GoalOut:
    """Update the amount of an existing spending goal."""
    household_id = _get_household_id(claims["sub"])
    supabase = get_supabase()

    result = (
        supabase.table("spending_goals")
        .update({"amount": payload.amount})
        .eq("id", goal_id)
        .eq("household_id", household_id)
        .execute()
    )
    rows = cast(list[dict], result.data or [])
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    # Re-fetch with category join for goal output
    goal_row = (
        supabase.table("spending_goals")
        .select("*, categories(id, name, icon)")
        .eq("id", rows[0]["id"])
        .single()
        .execute()
    )
    goal_data = cast(dict, goal_row.data if isinstance(goal_row.data, dict) else {})

    # Extract month from the goal row to fetch spent amount
    month_date = str(goal_data.get("month", ""))
    month = month_date[:7] if len(month_date) >= 7 else ""
    spent_amount = _fetch_spent_amount(household_id, str(goal_data["category_id"]), month)

    return _build_goal_out(goal_data, spent_amount)
