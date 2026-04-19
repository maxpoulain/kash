"""Tests for spending goals endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
GOAL_ID = "00000000-0000-0000-0000-000000000004"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_GOAL = {
    "id": GOAL_ID,
    "household_id": HOUSEHOLD_ID,
    "created_by": USER_ID,
    "category_id": CATEGORY_ID,
    "month": "2026-04-01",
    "amount": 500.0,
    "created_at": "2026-04-01T10:00:00+00:00",
    "updated_at": "2026-04-01T10:00:00+00:00",
}

FAKE_CATEGORY = {
    "id": CATEGORY_ID,
    "name": "Groceries",
    "icon": "🛒",
    "color": "#E8F5E9",
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _mock_goals_query(supabase, goals_data: list[dict]):
    """Mock goals SELECT query chain."""
    result = MagicMock()
    result.data = goals_data
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = result
    return result


def _mock_transactions_query(supabase, tx_data: list[dict]):
    """Mock transactions SELECT query chain."""
    result = MagicMock()
    result.data = tx_data
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .gte.return_value
        .lt.return_value
        .execute.return_value
    ) = result
    return result


# --- GET /api/spending-goals ---


@pytest.mark.asyncio
async def test_get_spending_goals_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/spending-goals?month=2026-04")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_spending_goals_invalid_month_returns_422():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=avril-2026",
                headers={"Authorization": "Bearer faketoken"},
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_spending_goals_empty_returns_empty_array():
    """No goals set for the month → returns empty goals array with zeros."""
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [])
        _mock_transactions_query(supabase, [])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-04"
    assert data["total_goal"] == 0.0
    assert data["total_spent"] == 0.0
    assert data["total_remaining"] == 0.0
    assert data["goals"] == []


@pytest.mark.asyncio
async def test_get_spending_goals_returns_goals_with_spent_amounts():
    """Goals exist and transactions exist → returns goals with correct calculations."""
    goal_with_category = {
        **FAKE_GOAL,
        "categories": FAKE_CATEGORY,
    }
    fake_transaction = {
        "category_id": CATEGORY_ID,
        "amount": 312.0,
        "type": "expense",
    }

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, [fake_transaction])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-04"
    assert data["total_goal"] == 500.0
    assert data["total_spent"] == 312.0
    assert data["total_remaining"] == 188.0
    assert len(data["goals"]) == 1

    goal = data["goals"][0]
    assert goal["category_id"] == CATEGORY_ID
    assert goal["category_name"] == "Groceries"
    assert goal["category_icon"] == "🛒"
    assert goal["goal_amount"] == 500.0
    assert goal["spent_amount"] == 312.0
    assert goal["progress_percent"] == 62.4
    assert goal["remaining"] == 188.0
    assert goal["status"] == "on_track"


@pytest.mark.asyncio
async def test_get_spending_goals_over_budget_status():
    """Spent more than goal → status is 'over_budget'."""
    goal_with_category = {
        **FAKE_GOAL,
        "amount": 200.0,
        "categories": FAKE_CATEGORY,
    }
    fake_transaction = {
        "category_id": CATEGORY_ID,
        "amount": 250.0,
        "type": "expense",
    }

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, [fake_transaction])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    goal = response.json()["goals"][0]
    assert goal["status"] == "over_budget"
    assert goal["progress_percent"] == 125.0


@pytest.mark.asyncio
async def test_get_spending_goals_under_pace_status():
    """Spent less than 50% of goal → status is 'under_pace'."""
    goal_with_category = {
        **FAKE_GOAL,
        "amount": 500.0,
        "categories": FAKE_CATEGORY,
    }
    fake_transaction = {
        "category_id": CATEGORY_ID,
        "amount": 100.0,
        "type": "expense",
    }

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, [fake_transaction])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    goal = response.json()["goals"][0]
    assert goal["status"] == "under_pace"
    assert goal["progress_percent"] == 20.0


@pytest.mark.asyncio
async def test_get_spending_goals_multiple_categories():
    """Multiple goals with different categories → all returned with correct spent amounts."""
    cat2_id = "00000000-0000-0000-0000-000000000005"
    cat2_name = "Restaurants"

    goal1 = {
        **FAKE_GOAL,
        "categories": FAKE_CATEGORY,
    }
    goal2 = {
        **FAKE_GOAL,
        "id": "00000000-0000-0000-0000-000000000006",
        "category_id": cat2_id,
        "amount": 220.0,
        "categories": {"id": cat2_id, "name": cat2_name, "icon": "🍽️", "color": None},
    }

    tx1 = {"category_id": CATEGORY_ID, "amount": 300.0, "type": "expense"}
    tx2 = {"category_id": CATEGORY_ID, "amount": 50.0, "type": "expense"}
    tx3 = {"category_id": cat2_id, "amount": 198.0, "type": "expense"}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal1, goal2])
        _mock_transactions_query(supabase, [tx1, tx2, tx3])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data["goals"]) == 2
    assert data["total_goal"] == 720.0  # 500 + 220
    assert data["total_spent"] == 548.0  # 300 + 50 + 198

    # Find goals by category name
    goals_by_name = {g["category_name"]: g for g in data["goals"]}
    assert goals_by_name["Groceries"]["spent_amount"] == 350.0
    assert goals_by_name["Restaurants"]["spent_amount"] == 198.0


@pytest.mark.asyncio
async def test_get_spending_goals_aggregates_spent_correctly():
    """Multiple transactions for same category → spent amounts are summed."""
    goal_with_category = {
        **FAKE_GOAL,
        "categories": FAKE_CATEGORY,
    }
    transactions = [
        {"category_id": CATEGORY_ID, "amount": 100.0, "type": "expense"},
        {"category_id": CATEGORY_ID, "amount": 75.5, "type": "expense"},
        {"category_id": CATEGORY_ID, "amount": 24.5, "type": "expense"},
    ]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, transactions)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    goal = response.json()["goals"][0]
    assert goal["spent_amount"] == 200.0  # 100 + 75.5 + 24.5


@pytest.mark.asyncio
async def test_get_spending_goals_no_transactions_returns_zero_spent():
    """Goal exists but no transactions for that category → spent is 0."""
    goal_with_category = {
        **FAKE_GOAL,
        "categories": FAKE_CATEGORY,
    }

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, [])  # No transactions

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    goal = response.json()["goals"][0]
    assert goal["spent_amount"] == 0.0
    assert goal["progress_percent"] == 0.0
    assert goal["remaining"] == 500.0
    assert goal["status"] == "under_pace"


@pytest.mark.asyncio
async def test_get_spending_goals_only_expense_transactions_count():
    """API query filters by type='expense', so only expense transactions are returned."""
    goal_with_category = {
        **FAKE_GOAL,
        "categories": FAKE_CATEGORY,
    }
    # Mock only returns expense transactions (database filters by type='expense')
    expense_transactions = [
        {"category_id": CATEGORY_ID, "amount": 100.0, "type": "expense"},
    ]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.spending_goals._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.spending_goals.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _mock_goals_query(supabase, [goal_with_category])
        _mock_transactions_query(supabase, expense_transactions)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/spending-goals?month=2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    goal = response.json()["goals"][0]
    assert goal["spent_amount"] == 100.0  # Only expense transactions counted
