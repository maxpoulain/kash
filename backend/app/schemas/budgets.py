"""Schemas for budgets and budget allocations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AllocationIn(BaseModel):
    category_id: UUID
    amount: float


class BudgetUpsert(BaseModel):
    income: float
    allocations: list[AllocationIn]


class AllocationOut(BaseModel):
    id: UUID
    category_id: UUID
    amount: float


class BudgetOut(BaseModel):
    id: UUID
    household_id: UUID
    month: str
    income: float
    over_budget: bool
    allocations: list[AllocationOut]
    created_at: datetime
    updated_at: datetime


class CategorySummary(BaseModel):
    category_id: UUID | None
    category_name: str
    allocated: float
    spent: float
    remaining: float


class BudgetSummary(BaseModel):
    month: str
    income: float
    total_allocated: float
    total_spent: float
    over_budget: bool
    categories: list[CategorySummary]
