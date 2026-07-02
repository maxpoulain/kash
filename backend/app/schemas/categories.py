"""Schemas for categories."""

from pydantic import BaseModel, Field

from app.schemas.transactions import TransactionType


class CategoryCreate(BaseModel):
    """Payload to create a custom category for the household."""

    name: str = Field(min_length=1, max_length=50)
    icon: str | None = None
    type: TransactionType = TransactionType.expense
