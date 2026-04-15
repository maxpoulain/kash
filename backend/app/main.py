from fastapi import FastAPI

from app.routers import health, transactions, users

app = FastAPI(title="Kash API", version="0.1.0")

app.include_router(health.router)
app.include_router(users.router)
app.include_router(transactions.router)
