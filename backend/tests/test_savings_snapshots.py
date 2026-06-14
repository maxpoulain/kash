"""Tests for savings snapshots — snapshot creation and history endpoint."""

from datetime import date
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


def _history_patches():
    """Auth + household + the two cash helpers (patched per-test) for the history endpoint."""
    return (
        patch("app.core.auth.get_jwks_client"),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.savings_accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.savings_accounts.get_supabase"),
        patch("app.routers.savings_accounts.visible_account_ids", return_value=[ACCOUNT_ID]),
        patch("app.routers.savings_accounts.account_networth_events", return_value=(0.0, [])),
    )


async def _get_history():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.get(
            "/api/savings-accounts/history",
            headers={"Authorization": "Bearer fake-token"},
        )


@pytest.mark.asyncio
async def test_history_aggregates_by_date():
    """Wealth-only (no cash events): forward-filled snapshots summed per date."""
    p_jwks, p_decode, p_household, p_supabase, p_visible, p_events = _history_patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_get_supabase, p_visible, p_events:
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
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result
        supabase.table.return_value.select.return_value.in_.return_value.order.return_value.execute.return_value = snapshots_result

        response = await _get_history()

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0] == {"date": "2026-04-01", "total": 8000.0}  # 5000 + 3000
    assert data[1] == {"date": "2026-04-10", "total": 8500.0}  # 5500 + 3000 (acct2 forward-filled)


@pytest.mark.asyncio
async def test_history_includes_account_cash():
    """Cash-only household (no wealth): balances back-filled from dated events."""
    p_jwks, p_decode, p_household, p_supabase, p_visible, p_events = _history_patches()
    cash = (1000.0, [(date(2026, 4, 1), 500.0), (date(2026, 4, 10), -200.0)])
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_get_supabase, p_visible, patch(
        "app.routers.savings_accounts.account_networth_events", return_value=cash
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase
        accounts_result = MagicMock()
        accounts_result.data = []  # no wealth accounts
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result

        response = await _get_history()

    assert response.status_code == 200
    data = response.json()
    # base 1000 + cumulative cash events on/before each date.
    assert data == [
        {"date": "2026-04-01", "total": 1500.0},  # 1000 + 500
        {"date": "2026-04-10", "total": 1300.0},  # 1000 + 500 - 200
    ]


@pytest.mark.asyncio
async def test_history_combines_cash_and_wealth():
    p_jwks, p_decode, p_household, p_supabase, p_visible, p_events = _history_patches()
    cash = (1000.0, [(date(2026, 4, 5), 500.0)])
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_get_supabase, p_visible, patch(
        "app.routers.savings_accounts.account_networth_events", return_value=cash
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase
        accounts_result = MagicMock()
        accounts_result.data = [{"id": ACCOUNT_ID}]
        snapshots_result = MagicMock()
        snapshots_result.data = [{"account_id": ACCOUNT_ID, "date": "2026-04-01", "balance": 3000.0}]
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result
        supabase.table.return_value.select.return_value.in_.return_value.order.return_value.execute.return_value = snapshots_result

        response = await _get_history()

    assert response.status_code == 200
    data = response.json()
    assert data == [
        {"date": "2026-04-01", "total": 4000.0},  # wealth 3000 + cash base 1000
        {"date": "2026-04-05", "total": 4500.0},  # wealth 3000 (ff) + 1000 + 500
    ]


@pytest.mark.asyncio
async def test_history_empty_when_no_accounts_and_no_cash():
    p_jwks, p_decode, p_household, p_supabase, p_visible, p_events = _history_patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_get_supabase, patch(
        "app.routers.savings_accounts.visible_account_ids", return_value=[]
    ), p_events:
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_get_supabase.return_value = supabase
        accounts_result = MagicMock()
        accounts_result.data = []
        supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = accounts_result

        response = await _get_history()

    assert response.status_code == 200
    assert response.json() == []
