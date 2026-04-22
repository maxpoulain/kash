"""Tests for savings snapshots — snapshot creation and history endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
ACCOUNT_ID = "00000000-0000-0000-0000-000000000010"
ACCOUNT_ID_2 = "00000000-0000-0000-0000-000000000011"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_ACCOUNT = {
    "id": ACCOUNT_ID,
    "name": "Livret A",
    "type": "Livret A",
    "balance": 5000.0,
    "institution": None,
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


@pytest.mark.asyncio
async def test_create_account_upserts_snapshot():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.savings_accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.savings_accounts.get_supabase") as mock_get_supabase,
        patch("app.routers.savings_accounts._upsert_snapshot") as mock_snapshot,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase

        insert_result = MagicMock()
        insert_result.data = [FAKE_ACCOUNT]
        supabase.table.return_value.insert.return_value.execute.return_value = insert_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/savings-accounts",
                json={"name": "Livret A", "type": "Livret A", "balance": 5000.0},
                headers={"Authorization": "Bearer fake-token"},
            )

    assert response.status_code == 201
    mock_snapshot.assert_called_once_with(ACCOUNT_ID, 5000.0)


@pytest.mark.asyncio
async def test_update_account_upserts_snapshot():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.savings_accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.savings_accounts.get_supabase") as mock_get_supabase,
        patch("app.routers.savings_accounts._upsert_snapshot") as mock_snapshot,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase

        update_result = MagicMock()
        update_result.data = [{**FAKE_ACCOUNT, "balance": 6000.0}]
        supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = update_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                f"/api/savings-accounts/{ACCOUNT_ID}",
                json={"balance": 6000.0},
                headers={"Authorization": "Bearer fake-token"},
            )

    assert response.status_code == 200
    mock_snapshot.assert_called_once_with(ACCOUNT_ID, 6000.0)


@pytest.mark.asyncio
async def test_history_aggregates_by_date():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.savings_accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.savings_accounts.get_supabase") as mock_get_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase

        accounts_result = MagicMock()
        accounts_result.data = [{"id": ACCOUNT_ID}, {"id": ACCOUNT_ID_2}]

        snapshots_result = MagicMock()
        snapshots_result.data = [
            {"account_id": ACCOUNT_ID, "date": "2026-04-01", "balance": 5000.0},
            {"account_id": ACCOUNT_ID_2, "date": "2026-04-01", "balance": 3000.0},
            {"account_id": ACCOUNT_ID, "date": "2026-04-10", "balance": 5500.0},
        ]

        # First table("savings_accounts").select().eq().execute() → accounts
        # Second table("savings_snapshots").select().in_().order().execute() → snapshots
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result
        supabase.table.return_value.select.return_value.in_.return_value.order.return_value.execute.return_value = snapshots_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/savings-accounts/history",
                headers={"Authorization": "Bearer fake-token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["date"] == "2026-04-01"
    assert data[0]["total"] == 8000.0  # 5000 + 3000
    assert data[1]["date"] == "2026-04-10"
    assert data[1]["total"] == 8500.0  # 5500 + 3000 (account2 forward-filled)


@pytest.mark.asyncio
async def test_history_empty_when_no_accounts():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.savings_accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.savings_accounts.get_supabase") as mock_get_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase

        accounts_result = MagicMock()
        accounts_result.data = []
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/savings-accounts/history",
                headers={"Authorization": "Bearer fake-token"},
            )

    assert response.status_code == 200
    assert response.json() == []
