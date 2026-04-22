import datetime

from pydantic import BaseModel


class SavingsAccountCreate(BaseModel):
    name: str
    type: str
    balance: float
    institution: str | None = None


class SavingsAccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    balance: float | None = None
    institution: str | None = None


class SavingsAccountOut(BaseModel):
    id: str
    name: str
    type: str
    balance: float
    institution: str | None


class NetWorthHistoryPoint(BaseModel):
    date: datetime.date
    total: float
