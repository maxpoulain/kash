"""Tests for the financial summary (aggregation) endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CAT_FOOD = "00000000-0000-0000-0000-0000000000f0"
CAT_SALARY = "00000000-0000-0000-0000-0000000000a0"
PEA = "00000000-0000-0000-0000-0000000000e1"
LIVRET = "00000000-0000-0000-0000-0000000000e2"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

CATEGORIES = [
    {"id": CAT_FOOD, "name": "Courses", "icon": "🛒"},
    {"id": CAT_SALARY, "name": "Salaire", "icon": "💰"},
]


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _query(rows):
    """A query mock whose builder methods chain back to itself, terminating in
    ``.execute().data == rows`` regardless of the chain length/shape."""
    q = MagicMock()
    q.execute.return_value.data = rows
    for method in ("select", "eq", "in_", "gte", "lt", "or_", "order", "neq"):
        getattr(q, method).return_value = q
    return q


def _mock_supabase(
    mock_supabase, *, categories, transactions, transfers=None, savings_accounts=None
):
    """Dispatch each ``table(name)`` call to its own query mock by table name."""
    supabase_instance = MagicMock()
    mock_supabase.return_value = supabase_instance

    tables = {
        "categories": _query(categories),
        "transactions": _query(transactions),
        "transfers": _query(transfers or []),
        "savings_accounts": _query(savings_accounts or []),
    }
    supabase_instance.table.side_effect = lambda name: tables[name]
    return tables


def _patches():
    return (
        patch("app.core.auth.get_jwks_client"),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.summary._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.summary.materialize_due_for_household"),
        patch("app.routers.summary.visible_account_ids", return_value=["acc-1"]),
        patch("app.routers.summary.get_supabase"),
    )


@pytest.mark.asyncio
async def test_summary_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_summary_invalid_month_returns_422():
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase:
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
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
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
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
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
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
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
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
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
    assert data["savings_destinations"] == []


@pytest.mark.asyncio
async def test_summary_savings_destinations_grouped_and_named():
    # Two contributions to the PEA + one to a Livret. The query already filters to
    # courant→epargne (asserted below); these are the rows it returns.
    transfers = [
        {"to_id": PEA, "amount": 500.0},
        {"to_id": PEA, "amount": 200.0},
        {"to_id": LIVRET, "amount": 300.0},
    ]
    savings_accounts = [
        {"id": PEA, "name": "PEA"},
        {"id": LIVRET, "name": "Livret A"},
    ]
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        tables = _mock_supabase(
            mock_supabase,
            categories=CATEGORIES,
            transactions=[{"amount": 2000.0, "type": "income", "category_id": CAT_SALARY}],
            transfers=transfers,
            savings_accounts=savings_accounts,
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    dests = response.json()["savings_destinations"]
    # Grouped by destination, largest first, names resolved.
    assert dests == [
        {"account_id": PEA, "name": "PEA", "amount": 700.0},
        {"account_id": LIVRET, "name": "Livret A", "amount": 300.0},
    ]

    # The internal/withdrawal exclusion is enforced by the query's kind filters,
    # and the visibility scope by from_id ∈ visible accounts.
    eq_calls = tables["transfers"].eq.call_args_list
    assert ("from_kind", "courant") in [c.args for c in eq_calls]
    assert ("to_kind", "epargne") in [c.args for c in eq_calls]
    tables["transfers"].in_.assert_any_call("from_id", ["acc-1"])


@pytest.mark.asyncio
async def test_summary_totals_unchanged_by_transfers():
    # Same transactions as the totals test; adding transfers must not move totals.
    transactions = [
        {"amount": 2000.0, "type": "income", "category_id": CAT_SALARY},
        {"amount": 300.0, "type": "expense", "category_id": CAT_FOOD},
    ]
    transfers = [{"to_id": PEA, "amount": 1500.0}]
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(
            mock_supabase,
            categories=CATEGORIES,
            transactions=transactions,
            transfers=transfers,
            savings_accounts=[{"id": PEA, "name": "PEA"}],
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    data = response.json()
    assert data["total_income"] == 2000.0
    assert data["total_expense"] == 300.0
    assert data["net"] == 1700.0
    # The transfer surfaces only as a savings destination, never in the totals.
    assert data["savings_destinations"][0]["amount"] == 1500.0


@pytest.mark.asyncio
async def test_summary_no_transfers_empty_destinations():
    p_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase = _patches()
    with p_jwks as mock_jwks, p_decode, p_household, p_materialize, p_visible, p_supabase as mock_supabase:
        _mock_auth(mock_jwks)
        _mock_supabase(
            mock_supabase,
            categories=CATEGORIES,
            transactions=[{"amount": 100.0, "type": "income", "category_id": CAT_SALARY}],
            transfers=[],
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/summary?month=2026-06",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.json()["savings_destinations"] == []
