import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_returns_200_and_ok():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_db_returns_200():
    """Test DB health endpoint returns proper structure.

    Note: This test does not mock Supabase, so it will fail if
    Supabase is not running. In CI, this should be skipped or
    use a mocked client.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health/db")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "db" in data
