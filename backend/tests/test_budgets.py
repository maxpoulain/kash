"""Tests for budget endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
BUDGET_ID = "00000000-0000-0000-0000-000000000010"
ALLOC_ID = "00000000-0000-0000-0000-000000000011"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_BUDGET = {
    "id": BUDGET_ID,
    "household_id": HOUSEHOLD_ID,
    "month": "2026-04",
    "income": 4000.0,
    "created_at": "2026-04-01T10:00:00+00:00",
    "updated_at": "2026-04-01T10:00:00+00:00",
}

FAKE_ALLOCATION = {
    "id": ALLOC_ID,
    "category_id": CATEGORY_ID,
    "amount": 1200.0,
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _mock_household(mock_get_household):
    mock_get_household.return_value = HOUSEHOLD_ID


# --- GET /api/budgets/{month} ---


@pytest.mark.asyncio
async def test_get_budget_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/budgets/2026-04")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_budget_invalid_month_returns_422():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/avril-2026",
                headers={"Authorization": "Bearer faketoken"},
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_budget_not_found_returns_404():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        budget_result = MagicMock()
        budget_result.data = None
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .maybe_single.return_value
            .execute.return_value
        ) = budget_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_budget_returns_budget_with_allocations():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        budget_result = MagicMock()
        budget_result.data = [FAKE_BUDGET]
        alloc_result = MagicMock()
        alloc_result.data = [FAKE_ALLOCATION]

        # budget query (uses .limit(1).execute())
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ) = budget_result
        # allocation query
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = alloc_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-04"
    assert data["income"] == 4000.0
    assert data["over_budget"] is False
    assert len(data["allocations"]) == 1


# --- PUT /api/budgets/{month} ---


@pytest.mark.asyncio
async def test_upsert_budget_creates_and_returns_budget():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        upsert_result = MagicMock()
        upsert_result.data = [FAKE_BUDGET]
        delete_result = MagicMock()
        alloc_result = MagicMock()
        alloc_result.data = [FAKE_ALLOCATION]

        supabase.table.return_value.upsert.return_value.execute.return_value = upsert_result
        supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = delete_result
        supabase.table.return_value.insert.return_value.execute.return_value = alloc_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                "/api/budgets/2026-04",
                json={
                    "income": 4000.0,
                    "allocations": [{"category_id": CATEGORY_ID, "amount": 1200.0}],
                },
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 4000.0
    assert data["over_budget"] is False


@pytest.mark.asyncio
async def test_upsert_budget_over_budget_flag():
    over_budget_row = {**FAKE_BUDGET, "income": 1000.0}
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        upsert_result = MagicMock()
        upsert_result.data = [over_budget_row]
        alloc_result = MagicMock()
        alloc_result.data = [FAKE_ALLOCATION]  # 1200 > income 1000

        supabase.table.return_value.upsert.return_value.execute.return_value = upsert_result
        supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        supabase.table.return_value.insert.return_value.execute.return_value = alloc_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                "/api/budgets/2026-04",
                json={
                    "income": 1000.0,
                    "allocations": [{"category_id": CATEGORY_ID, "amount": 1200.0}],
                },
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    assert response.json()["over_budget"] is True
