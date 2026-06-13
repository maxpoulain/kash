"""Schemas for accounts (cash-flow containers, calculated balance).

Part of 00058-comptes-multiples (T2). Distinct from savings_accounts (patrimoine,
manual balance). Balance here is computed from transactions, never stored.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    type: str = "checking"  # checking | savings | cash
    initial_balance: float = 0.0


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    initial_balance: float | None = None
    archived: bool | None = None  # True → set archived_at; False → clear it


class AccountOut(BaseModel):
    id: UUID
    household_id: UUID
    owner_id: UUID | None
    name: str
    type: str
    visibility: str
    initial_balance: float
    balance: float  # initial_balance + Σ income − Σ expense (transfers added in T3)
    archived_at: datetime | None
