"""Schemas for recurring transaction rules."""

from datetime import date as Date
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, model_validator

from app.schemas.transactions import TransactionType


class Frequency(str, Enum):
    weekly = "weekly"
    monthly = "monthly"


class RecurringTransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category_id: UUID | None = None
    note: str | None = None
    frequency: Frequency
    start_date: Date
    end_date: Date | None = None
    # Optional: defaults to the day implied by start_date (day-of-month for
    # monthly, weekday 0-6 for weekly).
    anchor_day: int | None = None

    @model_validator(mode="after")
    def _default_anchor_day(self) -> "RecurringTransactionCreate":
        if self.anchor_day is None:
            self.anchor_day = (
                self.start_date.day
                if self.frequency == Frequency.monthly
                else self.start_date.weekday()
            )
        return self


class RecurringTransactionUpdate(BaseModel):
    amount: float | None = None
    type: TransactionType | None = None
    category_id: UUID | None = None
    note: str | None = None
    frequency: Frequency | None = None
    anchor_day: int | None = None
    start_date: Date | None = None
    end_date: Date | None = None
    active: bool | None = None


class RecurringTransactionOut(BaseModel):
    id: UUID
    household_id: UUID
    created_by: UUID
    category_id: UUID | None
    amount: float
    type: TransactionType
    note: str | None
    frequency: Frequency
    anchor_day: int
    start_date: Date
    end_date: Date | None
    next_run_date: Date
    active: bool
    created_at: datetime
    updated_at: datetime
