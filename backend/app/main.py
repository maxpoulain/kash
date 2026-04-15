from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, transactions, users

app = FastAPI(title="Kash API", version="0.1.0")

_origins = (
    ["*"]
    if settings.environment == "development"
    else [
        "https://kash.vercel.app",
        "https://*.vercel.app",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(transactions.router)
