"""Spending goals endpoints."""

import re
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.schemas.spending_goals import GoalOut, SpendingGoalsResponse

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
        cat_data = goal.get("categories", {}) or {}
        cat_id = str(goal["category_id"])
        goal_amount = float(goal["amount"])
        spent_amount = spent_map.get(cat_id, 0.0)
        remaining = goal_amount - spent_amount

        # Calculate progress percentage
        if goal_amount > 0:
            progress_percent = (spent_amount / goal_amount) * 100
        else:
            progress_percent = 0.0

        goals.append(
            GoalOut(
                category_id=goal["category_id"],
                category_name=cat_data.get("name", "Unknown"),
                category_icon=cat_data.get("icon"),
                goal_amount=goal_amount,
                spent_amount=spent_amount,
                progress_percent=round(progress_percent, 1),
                remaining=round(remaining, 2),
                status=_calculate_status(progress_percent),
            )
        )

        total_goal += goal_amount
        total_spent += spent_amount

    return SpendingGoalsResponse(
        month=month,
        total_goal=round(total_goal, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(total_goal - total_spent, 2),
        goals=goals,
    )
