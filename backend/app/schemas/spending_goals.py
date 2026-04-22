"""Schemas for spending goals."""

from uuid import UUID

from pydantic import BaseModel, field_validator


class GoalCreate(BaseModel):
    month: str
    category_id: UUID
    amount: float

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class GoalUpdate(BaseModel):
    amount: float

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class GoalOut(BaseModel):
    """Single spending goal with calculated spending."""

    id: UUID
    category_id: UUID
    category_name: str
    category_icon: str | None
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
