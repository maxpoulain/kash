"""Tests for budget endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
SOURCE_BUDGET_ID = "00000000-0000-0000-0000-000000000009"
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


def _budget_limit_mock(supabase, data: list[dict]):
    """Mock .select().eq().eq().limit(1).execute() chain."""
    result = MagicMock()
    result.data = data
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = result
    return result


def _alloc_eq_mock(supabase, data: list[dict]):
    """Mock .select().eq().execute() chain (allocations)."""
    result = MagicMock()
    result.data = data
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value
    ) = result
    return result


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
        _budget_limit_mock(supabase, [])

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
        _budget_limit_mock(supabase, [FAKE_BUDGET])
        _alloc_eq_mock(supabase, [FAKE_ALLOCATION])

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
async def test_upsert_budget_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(
            "/api/budgets/2026-04",
            json={"income": 4000.0, "allocations": []},
        )
    assert response.status_code == 401


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
        alloc_result = MagicMock()
        alloc_result.data = [FAKE_ALLOCATION]

        supabase.table.return_value.upsert.return_value.execute.return_value = upsert_result
        supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
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
async def test_upsert_budget_is_idempotent():
    """Second PUT with same data must return 200 (upsert, not error)."""
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
        alloc_result = MagicMock()
        alloc_result.data = [FAKE_ALLOCATION]

        supabase.table.return_value.upsert.return_value.execute.return_value = upsert_result
        supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        supabase.table.return_value.insert.return_value.execute.return_value = alloc_result

        payload = {
            "income": 4000.0,
            "allocations": [{"category_id": CATEGORY_ID, "amount": 1200.0}],
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r1 = await client.put(
                "/api/budgets/2026-04", json=payload,
                headers={"Authorization": "Bearer faketoken"},
            )
            r2 = await client.put(
                "/api/budgets/2026-04", json=payload,
                headers={"Authorization": "Bearer faketoken"},
            )

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["income"] == r2.json()["income"]


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


# --- GET /api/budgets/{month}/summary ---


@pytest.mark.asyncio
async def test_get_summary_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/budgets/2026-04/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_summary_without_budget_returns_empty_summary():
    """No budget configured → returns 200 with income=0 and no categories."""
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        # No budget row
        budget_result = MagicMock()
        budget_result.data = []
        supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = budget_result

        # No transactions
        tx_result = MagicMock()
        tx_result.data = []
        supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lt.return_value.execute.return_value = tx_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/2026-04/summary",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 0.0
    assert data["categories"] == []
    assert data["over_budget"] is False


@pytest.mark.asyncio
async def test_get_summary_without_budget_shows_unallocated_spending():
    """No budget configured but transactions exist → returns spending with allocated=0."""
    cat_id = CATEGORY_ID
    fake_tx = {"category_id": cat_id, "amount": 500.0, "type": "expense"}
    fake_cat = {"id": cat_id, "name": "Courses"}

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
        budget_result.data = []
        supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = budget_result

        tx_result = MagicMock()
        tx_result.data = [fake_tx]
        supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lt.return_value.execute.return_value = tx_result

        cat_result = MagicMock()
        cat_result.data = [fake_cat]
        supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = cat_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/2026-04/summary",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 0.0
    assert len(data["categories"]) == 1
    cat = data["categories"][0]
    assert cat["allocated"] == 0.0
    assert cat["spent"] == 500.0
    assert cat["remaining"] == -500.0
    assert cat["category_name"] == "Courses"


@pytest.mark.asyncio
async def test_get_summary_returns_allocated_vs_spent():
    alloc_with_category = {
        "category_id": CATEGORY_ID,
        "amount": 1200.0,
        "categories": {"id": CATEGORY_ID, "name": "Loyer"},
    }
    fake_transaction = {"category_id": CATEGORY_ID, "amount": 900.0, "type": "expense"}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        _budget_limit_mock(supabase, [FAKE_BUDGET])

        alloc_result = MagicMock()
        alloc_result.data = [alloc_with_category]
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = alloc_result

        tx_result = MagicMock()
        tx_result.data = [fake_transaction]
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .gte.return_value
            .lt.return_value
            .execute.return_value
        ) = tx_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/budgets/2026-04/summary",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 4000.0
    assert data["over_budget"] is False
    assert len(data["categories"]) == 1
    cat = data["categories"][0]
    assert cat["allocated"] == 1200.0
    assert cat["spent"] == 900.0
    assert cat["remaining"] == 300.0


# --- POST /api/budgets/{month}/copy-from/{source_month} ---


@pytest.mark.asyncio
async def test_copy_budget_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/budgets/2026-05/copy-from/2026-04")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_copy_budget_source_not_found_returns_404():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase
        _budget_limit_mock(supabase, [])

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/budgets/2026-05/copy-from/2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_copy_budget_copies_allocations_not_income():
    source_budget = {**FAKE_BUDGET, "id": SOURCE_BUDGET_ID, "month": "2026-04", "income": 3500.0}
    target_budget = {**FAKE_BUDGET, "month": "2026-05", "income": 0.0}
    source_alloc = {"category_id": CATEGORY_ID, "amount": 1200.0}
    copied_alloc = {**FAKE_ALLOCATION, "amount": 1200.0}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.budgets._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.budgets.get_supabase") as mock_supabase,
    ):
        _mock_auth(mock_jwks)
        supabase = MagicMock()
        mock_supabase.return_value = supabase

        source_result = MagicMock()
        source_result.data = [source_budget]
        target_result = MagicMock()
        target_result.data = []

        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ) = MagicMock()
        supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.side_effect = [
            source_result,
            target_result,
        ]

        source_alloc_result = MagicMock()
        source_alloc_result.data = [source_alloc]
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = source_alloc_result

        upsert_result = MagicMock()
        upsert_result.data = [target_budget]
        supabase.table.return_value.upsert.return_value.execute.return_value = upsert_result
        supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()

        alloc_insert_result = MagicMock()
        alloc_insert_result.data = [copied_alloc]
        supabase.table.return_value.insert.return_value.execute.return_value = alloc_insert_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/budgets/2026-05/copy-from/2026-04",
                headers={"Authorization": "Bearer faketoken"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["income"] == 0.0  # income NOT copied from source
    assert len(data["allocations"]) == 1
    assert data["allocations"][0]["amount"] == 1200.0
