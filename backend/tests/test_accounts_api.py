"""Tests for the accounts CRUD endpoints (00058 T2)."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
ACCOUNT_ID = "00000000-0000-0000-0000-0000000000a1"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

ACCOUNT_ROW = {
    "id": ACCOUNT_ID,
    "household_id": HOUSEHOLD_ID,
    "owner_id": None,
    "name": "Compte commun",
    "type": "checking",
    "visibility": "shared",
    "initial_balance": 100.0,
    "institution": None,
    "archived_at": None,
    "created_at": "2026-06-01T10:00:00+00:00",
    "updated_at": "2026-06-01T10:00:00+00:00",
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _patches():
    return (
        patch("app.core.auth.get_jwks_client"),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.accounts._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.accounts.get_supabase"),
    )


@pytest.mark.asyncio
async def test_list_accounts_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/accounts")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_accounts_computes_balance_from_transactions():
    """balance = initial_balance + Σ income − Σ expense."""
    transactions = [
        {"account_id": ACCOUNT_ID, "amount": 200.0, "type": "income"},
        {"account_id": ACCOUNT_ID, "amount": 50.0, "type": "expense"},
    ]
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with (
        p_jwks as mock_jwks,
        p_decode,
        p_household,
        p_supabase as mock_supabase,
        patch("app.routers.accounts.visible_account_ids", return_value=[ACCOUNT_ID]),
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        accounts_result = MagicMock()
        accounts_result.data = [ACCOUNT_ROW]
        (
            supabase_instance.table.return_value
            .select.return_value
            .in_.return_value
            .is_.return_value
            .order.return_value
            .execute.return_value
        ) = accounts_result

        tx_result = MagicMock()
        tx_result.data = transactions
        (
            supabase_instance.table.return_value
            .select.return_value
            .in_.return_value
            .execute.return_value
        ) = tx_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/accounts", headers={"Authorization": "Bearer valid.token"}
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # 100 (initial) + 200 income − 50 expense = 250
    assert data[0]["balance"] == 250.0
    assert data[0]["name"] == "Compte commun"


@pytest.mark.asyncio
async def test_list_accounts_empty_when_no_visible_accounts():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with (
        p_jwks as mock_jwks,
        p_decode,
        p_household,
        p_supabase,
        patch("app.routers.accounts.visible_account_ids", return_value=[]),
    ):
        _mock_auth(mock_jwks)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/accounts", headers={"Authorization": "Bearer valid.token"}
            )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_account_returns_balance_equals_initial():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        created = MagicMock()
        created.data = [ACCOUNT_ROW]
        supabase_instance.table.return_value.insert.return_value.execute.return_value = created

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/accounts",
                json={"name": "Compte commun", "type": "checking", "initial_balance": 100.0},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["balance"] == 100.0  # no transactions yet
    assert data["initial_balance"] == 100.0
    assert data["institution"] is None


@pytest.mark.asyncio
async def test_create_account_persists_institution():
    """The optional institution is forwarded to the insert and returned."""
    row = {**ACCOUNT_ROW, "institution": "Boursorama"}
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        created = MagicMock()
        created.data = [row]
        insert = supabase_instance.table.return_value.insert
        insert.return_value.execute.return_value = created

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/accounts",
                json={"name": "Compte commun", "institution": "Boursorama"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    assert response.json()["institution"] == "Boursorama"
    # institution made it into the inserted payload
    assert insert.call_args.args[0]["institution"] == "Boursorama"


@pytest.mark.asyncio
async def test_delete_account_with_transactions_returns_409():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        has_txns = MagicMock()
        has_txns.data = [{"id": "tx-1"}]
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ) = has_txns

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/accounts/{ACCOUNT_ID}",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_delete_account_without_transactions_returns_204():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        no_txns = MagicMock()
        no_txns.data = []
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ) = no_txns

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/accounts/{ACCOUNT_ID}",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_patch_account_archive_sets_archived_at():
    archived_row = {**ACCOUNT_ROW, "archived_at": "2026-06-13T12:00:00+00:00"}
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        updated = MagicMock()
        updated.data = [archived_row]
        (
            supabase_instance.table.return_value
            .update.return_value
            .eq.return_value
            .eq.return_value
            .execute.return_value
        ) = updated

        # balance lookup after update
        tx_result = MagicMock()
        tx_result.data = []
        (
            supabase_instance.table.return_value
            .select.return_value
            .in_.return_value
            .execute.return_value
        ) = tx_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/accounts/{ACCOUNT_ID}",
                json={"archived": True},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    # The update payload carried a non-null archived_at.
    update_payload = supabase_instance.table.return_value.update.call_args[0][0]
    assert update_payload["archived_at"] is not None
    assert response.json()["archived_at"] is not None
