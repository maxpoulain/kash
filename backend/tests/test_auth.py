"""Tests for JWT authentication middleware and /api/me endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_me_without_token_returns_401():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/api/me", headers={"Authorization": "Bearer invalid.token.here"}
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token_returns_profile():
    fake_claims = {
        "sub": "user-123",
        "email": "test@example.com",
    }
    fake_db_result = MagicMock()
    fake_db_result.data = {"id": "user-123", "household_id": "household-456"}

    with patch("app.core.auth.get_jwks_client") as mock_jwks, patch(
        "app.routers.users.get_supabase"
    ) as mock_supabase:
        mock_signing_key = MagicMock()
        mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key

        with patch("app.core.auth.jwt.decode", return_value=fake_claims):
            mock_supabase.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = fake_db_result

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.get(
                    "/api/me", headers={"Authorization": "Bearer valid.token.here"}
                )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "user-123"
    assert data["email"] == "test@example.com"
    assert data["household_id"] == "household-456"
