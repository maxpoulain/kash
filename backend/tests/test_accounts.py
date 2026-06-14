"""Tests for the accounts helper (visibility seam) and transaction account defaulting.

T1 socle of 00058-comptes-multiples. The helper is a no-op today (all accounts
shared) and is the single point T4 will flip to enforce private accounts.
"""

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.accounts import visible_account_ids
from app.main import app
from app.routers.accounts import account_networth_events

USER_ID = "00000000-0000-0000-0000-000000000001"
HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002"
ACCOUNT_ID = "00000000-0000-0000-0000-0000000000a1"
OTHER_ACCOUNT_ID = "00000000-0000-0000-0000-0000000000a2"
TX_ID = "00000000-0000-0000-0000-000000000004"

FAKE_CLAIMS = {"sub": USER_ID, "email": "test@example.com"}

FAKE_TRANSACTION = {
    "id": TX_ID,
    "household_id": HOUSEHOLD_ID,
    "created_by": USER_ID,
    "category_id": None,
    "account_id": ACCOUNT_ID,
    "amount": 100.0,
    "type": "expense",
    "date": "2026-06-01",
    "note": None,
    "created_at": "2026-06-01T10:00:00+00:00",
    "updated_at": "2026-06-01T10:00:00+00:00",
}


def _mock_auth(mock_jwks):
    mock_signing_key = MagicMock()
    mock_jwks.return_value.get_signing_key_from_jwt.return_value = mock_signing_key


# --- visible_account_ids helper ---


def test_visible_account_ids_returns_household_accounts():
    """No-op today: returns every account in the household (all shared)."""
    with patch("app.core.accounts.get_supabase") as mock_supabase:
        result = MagicMock()
        result.data = [{"id": ACCOUNT_ID}, {"id": OTHER_ACCOUNT_ID}]
        (
            mock_supabase.return_value.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = result

        ids = visible_account_ids(HOUSEHOLD_ID, USER_ID)

    assert ids == [ACCOUNT_ID, OTHER_ACCOUNT_ID]


def test_visible_account_ids_empty_when_no_accounts():
    with patch("app.core.accounts.get_supabase") as mock_supabase:
        result = MagicMock()
        result.data = []
        (
            mock_supabase.return_value.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value
        ) = result

        ids = visible_account_ids(HOUSEHOLD_ID, USER_ID)

    assert ids == []


# --- account_networth_events helper (net worth history inputs, T5b) ---


def _query(rows):
    """Query mock whose builder methods chain back to itself, ending in
    ``.execute().data == rows`` whatever the chain shape."""
    q = MagicMock()
    q.execute.return_value.data = rows
    for method in ("select", "eq", "in_", "or_", "order", "limit"):
        getattr(q, method).return_value = q
    return q


def _events_supabase(mock_supabase, *, accounts, transactions, transfers):
    instance = MagicMock()
    mock_supabase.return_value = instance
    tables = {
        "accounts": _query(accounts),
        "transactions": _query(transactions),
        "transfers": _query(transfers),
    }
    instance.table.side_effect = lambda name: tables[name]


def test_account_networth_events_base_and_dated_deltas():
    with patch("app.routers.accounts.get_supabase") as mock_supabase:
        _events_supabase(
            mock_supabase,
            accounts=[{"initial_balance": 1000.0}, {"initial_balance": 0.0}],
            transactions=[
                {"amount": 500.0, "type": "income", "date": "2026-04-01"},
                {"amount": 200.0, "type": "expense", "date": "2026-04-10"},
            ],
            transfers=[],
        )
        base, events = account_networth_events([ACCOUNT_ID, OTHER_ACCOUNT_ID])

    assert base == 1000.0
    assert (date(2026, 4, 1), 500.0) in events
    assert (date(2026, 4, 10), -200.0) in events


def test_account_networth_events_internal_transfer_nets_zero():
    """A courant→courant transfer between two visible accounts emits ±amount → net 0."""
    with patch("app.routers.accounts.get_supabase") as mock_supabase:
        _events_supabase(
            mock_supabase,
            accounts=[{"initial_balance": 0.0}, {"initial_balance": 0.0}],
            transactions=[],
            transfers=[
                {
                    "from_kind": "courant", "from_id": ACCOUNT_ID,
                    "to_kind": "courant", "to_id": OTHER_ACCOUNT_ID,
                    "amount": 100.0, "date": "2026-05-01",
                }
            ],
        )
        base, events = account_networth_events([ACCOUNT_ID, OTHER_ACCOUNT_ID])

    assert base == 0.0
    assert (date(2026, 5, 1), -100.0) in events
    assert (date(2026, 5, 1), 100.0) in events
    assert sum(delta for _, delta in events) == 0.0


def test_account_networth_events_to_epargne_only_debits_courant():
    """A courant→epargne contribution debits the cash account; the epargne leg has no event."""
    with patch("app.routers.accounts.get_supabase") as mock_supabase:
        _events_supabase(
            mock_supabase,
            accounts=[{"initial_balance": 0.0}],
            transactions=[],
            transfers=[
                {
                    "from_kind": "courant", "from_id": ACCOUNT_ID,
                    "to_kind": "epargne", "to_id": "00000000-0000-0000-0000-0000000000e1",
                    "amount": 500.0, "date": "2026-05-02",
                }
            ],
        )
        _, events = account_networth_events([ACCOUNT_ID])

    assert events == [(date(2026, 5, 2), -500.0)]


def test_account_networth_events_empty_for_no_accounts():
    base, events = account_networth_events([])
    assert base == 0.0
    assert events == []


# --- POST /transactions account defaulting ---


@pytest.mark.asyncio
async def test_create_transaction_defaults_to_principal_account():
    """Omitting account_id attaches the txn to the household's principal (oldest) account."""
    default_lookup = MagicMock()
    default_lookup.data = [{"id": ACCOUNT_ID}]
    created = MagicMock()
    created.data = [FAKE_TRANSACTION]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance

        # Default-account lookup: accounts select → order → limit → execute
        (
            supabase_instance.table.return_value
            .select.return_value
            .eq.return_value
            .order.return_value
            .limit.return_value
            .execute.return_value
        ) = default_lookup
        supabase_instance.table.return_value.insert.return_value.execute.return_value = created

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transactions",
                json={"amount": 100.0, "type": "expense", "date": "2026-06-01"},
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    # The insert payload carried the resolved principal account_id.
    insert_payload = supabase_instance.table.return_value.insert.call_args[0][0]
    assert insert_payload["account_id"] == ACCOUNT_ID
    assert response.json()["account_id"] == ACCOUNT_ID


@pytest.mark.asyncio
async def test_create_transaction_uses_explicit_account_id():
    """An explicit account_id is used as-is, without the default lookup."""
    created = MagicMock()
    created.data = [{**FAKE_TRANSACTION, "account_id": OTHER_ACCOUNT_ID}]

    with (
        patch("app.core.auth.get_jwks_client") as mock_jwks,
        patch("app.routers.transactions.get_supabase") as mock_supabase,
        patch("app.core.auth.jwt.decode", return_value=FAKE_CLAIMS),
        patch("app.routers.transactions._get_household_id", return_value=HOUSEHOLD_ID),
        patch("app.routers.transactions._get_default_account_id") as mock_default,
    ):
        _mock_auth(mock_jwks)
        supabase_instance = MagicMock()
        mock_supabase.return_value = supabase_instance
        supabase_instance.table.return_value.insert.return_value.execute.return_value = created

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/transactions",
                json={
                    "amount": 100.0,
                    "type": "expense",
                    "date": "2026-06-01",
                    "account_id": OTHER_ACCOUNT_ID,
                },
                headers={"Authorization": "Bearer valid.token"},
            )

    assert response.status_code == 201
    mock_default.assert_not_called()
    insert_payload = supabase_instance.table.return_value.insert.call_args[0][0]
    assert insert_payload["account_id"] == OTHER_ACCOUNT_ID
