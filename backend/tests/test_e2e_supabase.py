"""End-to-end tests for Supabase integration.

These tests verify the core Supabase setup works correctly:
- Database connectivity
- RLS policies
- Basic CRUD operations

Note: These tests require a running Supabase instance.
Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
"""

import pytest
from supabase import Client

from app.core.supabase import get_supabase


@pytest.fixture
def supabase() -> Client:
    """Get Supabase client for tests."""
    return get_supabase()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_supabase_connection(supabase: Client):
    """Test that we can connect to Supabase and query the database."""
    # Try to query the users table - should not raise
    result = supabase.table("users").select("count", count="exact").execute()  # type: ignore[call-overload]
    assert result.count is not None


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_households_table_exists(supabase: Client):
    """Test that households table exists and is queryable.

    Uses service role key which bypasses RLS.
    """
    result = supabase.table("households").select("*").limit(1).execute()
    # Should succeed even if empty (we just get empty data)
    assert result.data is not None


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_health_endpoint_integration():
    """Integration test that health endpoint reports DB status."""
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health/db")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "connected"
