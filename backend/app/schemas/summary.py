"""Schemas for the financial summary (aggregation) endpoint."""

from typing import Literal
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


class SavingsDestination(BaseModel):
    """A named wealth destination fed by ``courant → epargne`` transfers this month.

    Powers the Sankey's savings decomposition (00058 T5a): each entry is one
    wealth account and the total contributed to it during the month. Internal
    ``courant → courant`` transfers and ``epargne → courant`` withdrawals are
    excluded; the totals above are unaffected (transfers are never income/expense).
    """

    account_id: UUID
    name: str | None
    amount: float


class AccountTransferFlow(BaseModel):
    """An inter-account transfer surfaced as a Sankey flow in a single-account view.

    Only populated when the summary is scoped to one account (00058 T5c): a
    ``courant → courant`` move touching the scoped account, which is internal (and
    so invisible) in the combined view. ``in`` = money arriving from ``counterpart_name``,
    ``out`` = money leaving to it. ``courant → epargne`` is excluded — it is a
    SavingsDestination instead. Never counted in income/expense totals.
    """

    direction: Literal["in", "out"]
    counterpart_name: str | None
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
    savings_destinations: list[SavingsDestination]
    account_transfers: list[AccountTransferFlow] = []
