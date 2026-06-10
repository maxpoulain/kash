"""Schemas for the financial summary (aggregation) endpoint."""

from uuid import UUID

from pydantic import BaseModel


class CategoryAmount(BaseModel):
    """Aggregated amount for a single category bucket.

    A null ``category_id`` represents uncategorized transactions.
    """

    category_id: UUID | None
    name: str | None
    icon: str | None
    amount: float


class SummaryOut(BaseModel):
    """Financial summary for a household over a single month."""

    month: str
    total_income: float
    total_expense: float
    net: float
    savings_rate: float | None
    income_by_category: list[CategoryAmount]
    expense_by_category: list[CategoryAmount]
