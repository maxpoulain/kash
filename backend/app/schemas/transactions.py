"""Schemas for categories and transactions."""

from datetime import date as Date
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


# --- Categories ---


class CategoryOut(BaseModel):
    id: UUID
    household_id: UUID | None
    name: str
    icon: str | None
    type: TransactionType


# --- Transactions ---


class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category_id: UUID | None = None
    date: Date
    note: str | None = None


class TransactionUpdate(BaseModel):
    amount: float | None = None
    type: TransactionType | None = None
    category_id: UUID | None = None
    date: Date | None = None
    note: str | None = None


class TransactionOut(BaseModel):
    id: UUID
    household_id: UUID
    created_by: UUID
    category_id: UUID | None
    amount: float
    type: TransactionType
    date: Date
    note: str | None
    created_at: datetime
    updated_at: datetime
