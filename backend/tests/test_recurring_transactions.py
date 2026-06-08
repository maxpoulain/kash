"""Tests for recurring transaction rule endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
RULE_ID = "00000000-0000-0000-0000-000000000005"
OTHER_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000099"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_RULE = {
    "id": RULE_ID,
    "household_id": HOUSEHOLD_ID,
    "created_by": USER_ID,
    "category_id": CATEGORY_ID,
    "amount": 1200.0,
    "type": "expense",
    "note": "Loyer",
    "frequency": "monthly",
    "anchor_day": 5,
    "start_date": "2026-06-05",
    "end_date": None,
    "next_run_date": "2026-06-05",
    "active": True,
    "created_at": "2026-06-01T10:00:00+00:00",
    "updated_at": "2026-06-01T10:00:00+00:00",
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


@pytest.mark.asyncio
async def test_list_recurring_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/recurring-transactions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_recurring_returns_rules():
    list_result = MagicMock()
    list_result.data = [FAKE_RULE]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.recurring_transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch(
            "app.routers.recurring_transactions._get_household_id",
            return_value=HOUSEHOLD_ID,
        ),
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .order.return_value
            .execute.return_value
        ) = list_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/recurring-transactions",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["note"] == "Loyer"
    assert data[0]["frequency"] == "monthly"


@pytest.mark.asyncio
async def test_create_recurring_returns_201_and_computes_next_run():
    created_result = MagicMock()
    created_result.data = [FAKE_RULE]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.recurring_transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch(
            "app.routers.recurring_transactions._get_household_id",
            return_value=HOUSEHOLD_ID,
        ),
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
                "/api/recurring-transactions",
                json={
                    "amount": 1200.0,
                    "type": "expense",
                    "note": "Loyer",
                    "frequency": "monthly",
                    "start_date": "2026-06-05",
                },
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    # anchor_day defaulted from start_date, next_run_date computed by the service.
    inserted = supabase_instance.table.return_value.insert.call_args[0][0]
    assert inserted["anchor_day"] == 5
    assert inserted["next_run_date"] == "2026-06-05"


@pytest.mark.asyncio
async def test_update_recurring_from_other_household_returns_403():
    other_result = MagicMock()
    other_result.data = {"household_id": OTHER_HOUSEHOLD_ID}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.recurring_transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch(
            "app.routers.recurring_transactions._get_household_id",
            return_value=HOUSEHOLD_ID,
        ),
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute.return_value
        ) = other_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/recurring-transactions/{RULE_ID}",
                json={"amount": 1300.0},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_recurring_not_found_returns_404():
    empty_result = MagicMock()
    empty_result.data = {}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.recurring_transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch(
            "app.routers.recurring_transactions._get_household_id",
            return_value=HOUSEHOLD_ID,
        ),
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute.return_value
        ) = empty_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/recurring-transactions/{RULE_ID}",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 404
