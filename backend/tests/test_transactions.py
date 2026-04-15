"""Tests for categories and transactions endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
TX_ID = "00000000-0000-0000-0000-000000000004"
OTHER_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000099"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_CATEGORY = {
    "id": CATEGORY_ID,
    "household_id": None,
    "name": "Loyer",
    "icon": "🏠",
    "is_default": True,
}

FAKE_TRANSACTION = {
    "id": TX_ID,
    "household_id": HOUSEHOLD_ID,
    "created_by": USER_ID,
    "category_id": CATEGORY_ID,
    "amount": 100.0,
    "type": "expense",
    "date": "2026-04-01",
    "note": None,
    "created_at": "2026-04-01T10:00:00+00:00",
    "updated_at": "2026-04-01T10:00:00+00:00",
}


def _mock_auth(mock_jwks):
    """Configure mock JWKS to return fake claims."""
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _mock_supabase_household(mock_supabase):
    """Make _get_household_id return HOUSEHOLD_ID."""
    household_result = MagicMock()
    household_result.data = {"household_id": HOUSEHOLD_ID}
    (
        mock_supabase.return_value.table.return_value
        .select.return_value
        .eq.return_value
        .single.return_value
        .execute.return_value
    ) = household_result


# --- /api/categories ---


@pytest.mark.asyncio
async def test_list_categories_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/categories")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_categories_returns_predefined_and_custom():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        categories_result = MagicMock()
        categories_result.data = [FAKE_CATEGORY]
        (
            supabase_instance.table.return_value
            .select.return_value
            .or_.return_value
            .execute.return_value
        ) = categories_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/categories", headers={"Authorization": "Bearer valid.token"}
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Loyer"


# --- /api/transactions ---


@pytest.mark.asyncio
async def test_list_transactions_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/transactions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_transaction_returns_201():
    created_result = MagicMock()
    created_result.data = [FAKE_TRANSACTION]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        (
            supabase_instance.table.return_value
            .insert.return_value
            .execute.return_value
        ) = created_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transactions",
                json={"amount": 100.0, "type": "expense", "date": "2026-04-01"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 100.0
    assert data["type"] == "expense"


@pytest.mark.asyncio
async def test_list_transactions_invalid_month_returns_422():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)
        _mock_supabase_household(mock_supabase)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/transactions?month=bad-format",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_transaction_from_other_household_returns_403():
    other_household_result = MagicMock()
    other_household_result.data = {"household_id": OTHER_HOUSEHOLD_ID}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        household_result = MagicMock()
        household_result.data = {"household_id": HOUSEHOLD_ID}

        # First call: _get_household_id → returns user's household
        # Second call: ownership check → returns other household
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute
        ).side_effect = [household_result, other_household_result]

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                "/api/transactions/tx-999",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_transaction_from_other_household_returns_403():
    other_household_result = MagicMock()
    other_household_result.data = {"household_id": OTHER_HOUSEHOLD_ID}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        household_result = MagicMock()
        household_result.data = {"household_id": HOUSEHOLD_ID}

        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute
        ).side_effect = [household_result, other_household_result]

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                "/api/transactions/tx-999",
                json={"amount": 200.0},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 403
