"""Tests for the transfers endpoints (00058 T3).

Polymorphic legs ({kind, id}); at least one leg must be a courant. Supabase is
mocked — these cover routing, validation, and household scoping, not the DB.
"""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
ACCOUNT_A = "00000000-0000-0000-0000-0000000000a1"
ACCOUNT_B = "00000000-0000-0000-0000-0000000000a2"
SAVINGS_A = "00000000-0000-0000-0000-0000000000b1"
TRANSFER_ID = "00000000-0000-0000-0000-0000000000c1"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}


def _row(from_kind, from_id, to_kind, to_id):
    return {
        "id": TRANSFER_ID,
        "household_id": HOUSEHOLD_ID,
        "from_kind": from_kind,
        "from_id": from_id,
        "to_kind": to_kind,
        "to_id": to_id,
        "amount": 100.0,
        "date": "2026-06-13",
        "note": None,
        "created_by": USER_ID,
        "created_at": "2026-06-13T10:00:00+00:00",
    }


def _mock_auth(mock_jwks):
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = MagicMock()


def _patches():
    return (
        patch("app.core.auth.get_jwks_client"),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transfers._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.transfers.get_supabase"),
    )


def _setup(mock_supabase, *, legs_exist=True, created_row=None):
    """Wire the shared supabase mock: leg-existence selects + the insert."""
    instance = MagicMock()
    mock_supabase.return_value = instance

    leg = MagicMock()
    leg.data = [{"id": "x"}] if legs_exist else []
    (
        instance.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = leg

    if created_row is not None:
        created = MagicMock()
        created.data = [created_row]
        instance.table.return_value.insert.return_value.execute.return_value = created
    return instance


@pytest.mark.asyncio
async def test_create_transfer_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/transfers", json={})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_transfer_courant_to_courant_returns_201():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _setup(mock_supabase, created_row=_row("courant", ACCOUNT_A, "courant", ACCOUNT_B))
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transfers",
                json={
                    "from_kind": "courant", "from_id": ACCOUNT_A,
                    "to_kind": "courant", "to_id": ACCOUNT_B,
                    "amount": 100.0, "date": "2026-06-13",
                },
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 201
    assert response.json()["from_id"] == ACCOUNT_A


@pytest.mark.asyncio
async def test_create_transfer_courant_to_epargne_returns_201():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _setup(mock_supabase, created_row=_row("courant", ACCOUNT_A, "epargne", SAVINGS_A))
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transfers",
                json={
                    "from_kind": "courant", "from_id": ACCOUNT_A,
                    "to_kind": "epargne", "to_id": SAVINGS_A,
                    "amount": 100.0, "date": "2026-06-13",
                },
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 201
    assert response.json()["to_kind"] == "epargne"


@pytest.mark.asyncio
async def test_create_transfer_epargne_to_epargne_returns_422():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _setup(mock_supabase)  # never reaches supabase
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transfers",
                json={
                    "from_kind": "epargne", "from_id": SAVINGS_A,
                    "to_kind": "epargne", "to_id": SAVINGS_A,
                    "amount": 100.0, "date": "2026-06-13",
                },
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_transfer_leg_in_other_household_returns_404():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _setup(mock_supabase, legs_exist=False)  # leg not found in household
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transfers",
                json={
                    "from_kind": "courant", "from_id": ACCOUNT_A,
                    "to_kind": "courant", "to_id": ACCOUNT_B,
                    "amount": 100.0, "date": "2026-06-13",
                },
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_transfer_rejects_non_positive_amount():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _setup(mock_supabase)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transfers",
                json={
                    "from_kind": "courant", "from_id": ACCOUNT_A,
                    "to_kind": "courant", "to_id": ACCOUNT_B,
                    "amount": 0, "date": "2026-06-13",
                },
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_transfer_returns_204():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        mock_supabase.return_value = MagicMock()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/transfers/{TRANSFER_ID}",
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_list_transfers_returns_household_rows():
    p_jwks, p_decode, p_household, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        instance = MagicMock()
        mock_supabase.return_value = instance
        listed = MagicMock()
        listed.data = [_row("courant", ACCOUNT_A, "courant", ACCOUNT_B)]
        (
            instance.table.return_value
            .select.return_value
            .eq.return_value
            .order.return_value
            .execute.return_value
        ) = listed
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/transfers",
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 200
    assert len(response.json()) == 1
