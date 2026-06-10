"""Tests for the financial summary (aggregation) endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CAT_FOOD = "00000000-0000-0000-0000-0000000000f0"
CAT_SALARY = "00000000-0000-0000-0000-0000000000a0"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

CATEGORIES = [
    {"id": CAT_FOOD, "name": "Courses", "icon": "🛒"},
    {"id": CAT_SALARY, "name": "Salaire", "icon": "💰"},
]


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _mock_supabase(mock_supabase, *, categories, transactions):
    """Wire the two queries the endpoint issues: categories then transactions."""
    supabase_instance = MagicMock()
    mock_supabase.return_value = supabase_instance

    cat_result = MagicMock()
    cat_result.data = categories
    (
        supabase_instance.table.return_value
        .select.return_value
        .or_.return_value
        .execute.return_value
    ) = cat_result

    tx_result = MagicMock()
    tx_result.data = transactions
    (
        supabase_instance.table.return_value
        .select.return_value
        .eq.return_value
        .gte.return_value
        .lt.return_value
        .execute.return_value
    ) = tx_result


def _patches():
    return (
        patch("app.core.auth.get_jwks_client"),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.summary._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.summary.materialize_due_for_household"),
        patch("app.routers.summary.get_supabase"),
    )


@pytest.mark.asyncio
async def test_summary_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_summary_invalid_month_returns_422():
    p_jwks, p_decode, p_household, p_materialize, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_supabase:
        _mock_auth(mock_jwks)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=bad-format",
                headers={"Authorization": "Bearer valid.token"},
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_summary_aggregates_totals_and_breakdown():
    transactions = [
        {"amount": 2000.0, "type": "income", "category_id": CAT_SALARY},
        {"amount": 500.0, "type": "income", "category_id": None},
        {"amount": 300.0, "type": "expense", "category_id": CAT_FOOD},
        {"amount": 100.0, "type": "expense", "category_id": CAT_FOOD},
    ]
    p_jwks, p_decode, p_household, p_materialize, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(mock_supabase, categories=CATEGORIES, transactions=transactions)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == 2500.0
    assert data["total_expense"] == 400.0
    assert data["net"] == 2100.0
    assert data["savings_rate"] == pytest.approx(2100.0 / 2500.0)

    # Breakdown sums must match the totals.
    assert sum(c["amount"] for c in data["income_by_category"]) == 2500.0
    assert sum(c["amount"] for c in data["expense_by_category"]) == 400.0

    # Largest contribution first; category metadata resolved.
    assert data["income_by_category"][0]["category_id"] == CAT_SALARY
    assert data["income_by_category"][0]["name"] == "Salaire"
    food = next(c for c in data["expense_by_category"] if c["category_id"] == CAT_FOOD)
    assert food["amount"] == 400.0
    assert food["icon"] == "🛒"


@pytest.mark.asyncio
async def test_summary_uncategorized_bucket():
    transactions = [
        {"amount": 80.0, "type": "expense", "category_id": None},
    ]
    p_jwks, p_decode, p_household, p_materialize, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(mock_supabase, categories=CATEGORIES, transactions=transactions)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data["expense_by_category"]) == 1
    bucket = data["expense_by_category"][0]
    assert bucket["category_id"] is None
    assert bucket["name"] is None
    assert bucket["amount"] == 80.0


@pytest.mark.asyncio
async def test_summary_no_income_savings_rate_null():
    transactions = [
        {"amount": 120.0, "type": "expense", "category_id": CAT_FOOD},
    ]
    p_jwks, p_decode, p_household, p_materialize, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(mock_supabase, categories=CATEGORIES, transactions=transactions)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == 0.0
    assert data["savings_rate"] is None


@pytest.mark.asyncio
async def test_summary_empty_month_returns_zeros():
    p_jwks, p_decode, p_household, p_materialize, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(mock_supabase, categories=CATEGORIES, transactions=[])
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == 0.0
    assert data["total_expense"] == 0.0
    assert data["net"] == 0.0
    assert data["savings_rate"] is None
    assert data["income_by_category"] == []
    assert data["expense_by_category"] == []
