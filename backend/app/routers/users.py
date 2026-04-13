"""User endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.supabase import get_supabase

router = APIRouter(prefix="/api")


class UserProfile(BaseModel):
    id: str
    email: str
    household_id: str | None = None


@router.get("/me", response_model=UserProfile)
async def get_me(claims: dict = Depends(get_current_user)) -> UserProfile:
    """Return the authenticated user's profile."""
    user_id = claims["sub"]
    email = claims.get("email", "")

    supabase = get_supabase()
    result = supabase.table("users").select("id, household_id").eq("id", user_id).single().execute()

    data: dict = result.data if isinstance(result.data, dict) else {}
    household_id: str | None = data.get("household_id")  # type: ignore[assignment]

    return UserProfile(id=user_id, email=email, household_id=household_id)
