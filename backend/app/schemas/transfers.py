"""Schemas for transfers between accounts (00058 T3).

Polymorphic legs: each side is a 'compte' (accounts) or 'patrimoine'
(savings_accounts). At least one leg must be a compte — enforced both in the DB
and in the router (router returns a clean 422 instead of a DB error).
"""

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

Kind = Literal["compte", "patrimoine"]


class TransferCreate(BaseModel):
    from_kind: Kind
    from_id: UUID
    to_kind: Kind
    to_id: UUID
    amount: float = Field(gt=0)
    date: date
    note: str | None = None


class TransferOut(BaseModel):
    id: UUID
    household_id: UUID
    from_kind: str
    from_id: UUID
    to_kind: str
    to_id: UUID
    amount: float
    date: date
    note: str | None
    created_by: UUID | None
    created_at: datetime
