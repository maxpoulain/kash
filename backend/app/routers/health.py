"""Health check endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.supabase import get_supabase

router = APIRouter()


class HealthResponse(BaseModel):
    status: str


class HealthDBResponse(BaseModel):
    status: str
    db: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> dict[str, str]:
    """Basic health check - returns OK if the API is running."""
    return {"status": "ok"}


@router.get("/health/db", response_model=HealthDBResponse)
async def health_db_check() -> dict[str, str]:
    """Database health check - verifies Supabase connectivity."""
    try:
        supabase = get_supabase()
        # Simple query to verify connection using built-in PostgreSQL function
        # This executes: SELECT * FROM auth.users LIMIT 0
        supabase.table("users").select("id").limit(1).execute()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": f"disconnected: {type(e).__name__}"}
