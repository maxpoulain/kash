"""Schemas for spending goals."""

from uuid import UUID

from pydantic import BaseModel


class GoalOut(BaseModel):
    """Single spending goal with calculated spending."""

    category_id: UUID
    category_name: str
    category_icon: str | None
    category_color: str | None
    goal_amount: float
    spent_amount: float
    progress_percent: float
    remaining: float
    status: str  # "on_track", "under_pace", "over_budget"


class SpendingGoalsResponse(BaseModel):
    """Response for GET /api/spending-goals."""

    month: str
    total_goal: float
    total_spent: float
    total_remaining: float
    goals: list[GoalOut]
