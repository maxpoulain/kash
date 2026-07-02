"""Tests for categories and transactions endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
CATEGORY_ID = "00000000-0000-0000-0000-000000000003"
TX_ID = "00000000-0000-0000-0000-000000000004"
OTHER_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000099"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_CATEGORY = {
    "id": CATEGORY_ID,
    "household_id": HOUSEHOLD_ID,
    "name": "Loyer",
    "icon": "🏠",
    "type": "expense",
}

FAKE_TRANSACTION = {
    "id": TX_ID,
    "household_id": HOUSEHOLD_ID,
    "created_by": USER_ID,
    "category_id": CATEGORY_ID,
    "amount": 100.0,
    "type": "expense",
    "date": "2026-04-01",
    "note": None,
    "created_at": "2026-04-01T10:00:00+00:00",
    "updated_at": "2026-04-01T10:00:00+00:00",
}


def _mock_auth(mock_jwks):
    """Configure mock JWKS to return fake claims."""
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


def _mock_supabase_household(mock_supabase):
    """Make _get_household_id return HOUSEHOLD_ID."""
    household_result = MagicMock()
    household_result.data = {"household_id": HOUSEHOLD_ID}
    (
        mock_supabase.return_value.table.return_value
        .select.return_value
        .eq.return_value
        .single.return_value
        .execute.return_value
    ) = household_result


# --- /api/categories ---


@pytest.mark.asyncio
async def test_list_categories_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/categories")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_categories_returns_only_household_categories():
    """GET /api/categories returns only the household's categories (no suggestions merge)."""
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        categories_result = MagicMock()
        categories_result.data = [FAKE_CATEGORY]
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = categories_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/categories", headers={"Authorization": "Bearer valid.token"}
            )

    assert response.status_code == 200
    data = response.json()
    # Only household categories are returned (suggestions are merged on the frontend)
    assert len(data) == 1
    assert data[0]["name"] == "Loyer"
    names = {c["name"] for c in data}
    assert "Courses" not in names


@pytest.mark.asyncio
async def test_create_category_returns_201():
    """POST /api/categories creates a category and returns it as JSON body."""
    created = {
        **FAKE_CATEGORY,
        "name": "Courses Bio",
        "icon": "ShoppingCart",
        "type": "expense",
    }
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.core.categories.get_supabase") as mock_core_supabase,
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        insert_result = MagicMock()
        insert_result.data = [created]
        (
            supabase_instance.table.return_value
            .insert.return_value
            .execute.return_value
        ) = insert_result

        # Duplicate check: no existing category found
        dup_result = MagicMock()
        dup_result.data = []
        core_instance = MagicMock()
        mock_core_supabase.return_value = core_instance
        (
            core_instance.table.return_value
            .select.return_value
            .eq.return_value
            .ilike.return_value
            .limit.return_value
            .execute.return_value
        ) = dup_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={"name": "Courses Bio", "icon": "ShoppingCart", "type": "expense"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    assert response.json()["name"] == "Courses Bio"


@pytest.mark.asyncio
async def test_create_category_rejects_case_insensitive_duplicate():
    """'courses bio' is rejected when 'Courses Bio' exists (trimmed, case-insensitive)."""
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase"),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.core.categories.get_supabase") as mock_core_supabase,
    ):
        _mock_auth(mock_jwks)

        # Duplicate found by ilike
        dup_result = MagicMock()
        dup_result.data = [{"id": CATEGORY_ID}]
        core_instance = MagicMock()
        mock_core_supabase.return_value = core_instance
        (
            core_instance.table.return_value
            .select.return_value
            .eq.return_value
            .ilike.return_value
            .limit.return_value
            .execute.return_value
        ) = dup_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={"name": "courses bio", "icon": "ShoppingCart", "type": "expense"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 409
    assert response.json()["detail"] == "duplicate"


@pytest.mark.asyncio
async def test_create_category_isolated_per_household():
    """A category created by household A is not visible to household B (RLS)."""
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.routers.transactions._get_household_id", return_value=OTHER_HOUSEHOLD_ID),
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.core.categories.get_supabase") as mock_core_supabase,
    ):
        _mock_auth(mock_jwks)

        # No duplicate in household B
        dup_result = MagicMock()
        dup_result.data = []
        core_instance = MagicMock()
        mock_core_supabase.return_value = core_instance
        (
            core_instance.table.return_value
            .select.return_value
            .eq.return_value
            .ilike.return_value
            .limit.return_value
            .execute.return_value
        ) = dup_result

        created = {**FAKE_CATEGORY, "household_id": OTHER_HOUSEHOLD_ID, "name": "Courses Bio"}
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        insert_result = MagicMock()
        insert_result.data = [created]
        (
            supabase_instance.table.return_value
            .insert.return_value
            .execute.return_value
        ) = insert_result

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={"name": "Courses Bio", "icon": "ShoppingCart", "type": "expense"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    assert response.json()["household_id"] == OTHER_HOUSEHOLD_ID


# --- /api/transactions ---


@pytest.mark.asyncio
async def test_list_transactions_without_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/transactions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_transaction_returns_201():
    created_result = MagicMock()
    created_result.data = [FAKE_TRANSACTION]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
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
                "/api/transactions",
                json={"amount": 100.0, "type": "expense", "date": "2026-04-01"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 100.0
    assert data["type"] == "expense"


@pytest.mark.asyncio
async def test_list_transactions_invalid_month_returns_422():
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)
        _mock_supabase_household(mock_supabase)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/transactions?month=bad-format",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_transaction_from_other_household_returns_403():
    other_household_result = MagicMock()
    other_household_result.data = {"household_id": OTHER_HOUSEHOLD_ID}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        household_result = MagicMock()
        household_result.data = {"household_id": HOUSEHOLD_ID}

        # First call: _get_household_id → returns user's household
        # Second call: ownership check → returns other household
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute
        ).side_effect = [household_result, other_household_result]

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                "/api/transactions/tx-999",
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_transaction_from_other_household_returns_403():
    other_household_result = MagicMock()
    other_household_result.data = {"household_id": OTHER_HOUSEHOLD_ID}

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        household_result = MagicMock()
        household_result.data = {"household_id": HOUSEHOLD_ID}

        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute
        ).side_effect = [household_result, other_household_result]

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                "/api/transactions/tx-999",
                json={"amount": 200.0},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_transaction_changes_account():
    NEW_ACCOUNT = "00000000-0000-0000-0000-0000000000a9"
    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)
        instance = MagicMock()
        mock_supabase.return_value = instance

        existing = MagicMock()
        existing.data = {"household_id": HOUSEHOLD_ID}
        (
            instance.table.return_value
            .select.return_value
            .eq.return_value
            .single.return_value
            .execute.return_value
        ) = existing

        updated = MagicMock()
        updated.data = [{**FAKE_TRANSACTION, "account_id": NEW_ACCOUNT}]
        (
            instance.table.return_value
            .update.return_value
            .eq.return_value
            .execute.return_value
        ) = updated

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(
                f"/api/transactions/{TX_ID}",
                json={"account_id": NEW_ACCOUNT},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 200
    assert response.json()["account_id"] == NEW_ACCOUNT
    # account_id is forwarded to the DB update as a plain string.
    sent = instance.table.return_value.update.call_args[0][0]
    assert sent["account_id"] == NEW_ACCOUNT


@pytest.mark.asyncio
async def test_create_transaction_with_unknown_suggested_category_creates_it():
    """Using a suggested category ID not yet in the household creates it lazily."""
    from uuid import UUID
    from app.core.categories import SUGGESTED_BY_ID

    suggested = SUGGESTED_BY_ID[
        UUID("0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9c")
    ]  # Courses
    SUGGESTED_CATEGORY_ID = str(suggested.id)

    created_category = {
        "id": SUGGESTED_CATEGORY_ID,
        "household_id": HOUSEHOLD_ID,
        "name": suggested.name,
        "icon": suggested.icon,
        "type": suggested.type.value,
    }
    created_transaction = {
        **FAKE_TRANSACTION,
        "category_id": SUGGESTED_CATEGORY_ID,
    }

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.categories.get_supabase") as mock_core_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)

        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        mock_core_supabase.return_value = supabase_instance

        # First call: categories SELECT for _ensure_category_exists → not found
        not_found = MagicMock()
        not_found.data = {}

        # Second call: categories INSERT for lazy creation
        insert_result = MagicMock()
        insert_result.data = [created_category]

        # Third call: transaction insert
        created_result = MagicMock()
        created_result.data = [created_transaction]

        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .limit.return_value
            .execute
        ).side_effect = [not_found]

        supabase_instance.table.return_value.insert.return_value.execute.side_effect = [
            insert_result,
            created_result,
        ]

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transactions",
                json={
                    "amount": 100.0,
                    "type": "expense",
                    "category_id": SUGGESTED_CATEGORY_ID,
                    "date": "2026-04-01",
                },
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["category_id"] == SUGGESTED_CATEGORY_ID
