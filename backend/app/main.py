from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import budgets, health, spending_goals, transactions, users

app = FastAPI(title="Kash API", version="0.1.0")

_is_dev = settings.environment == "development"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _is_dev else ["https://kash.vercel.app"],
    allow_origin_regex=None if _is_dev else r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(spending_goals.router)
