"""Account visibility helper — the single seam for private-account enforcement.

The backend uses the Supabase service_role key, which bypasses RLS, so visibility
cannot be enforced by a policy: it must be an application-code filter. This helper
is the one place every account-aware read scopes through.

T1 (socle): no-op — returns every account in the household (all are 'shared').
T4 will flip its body to exclude other members' private accounts; callers don't change.
"""

from typing import cast

from app.core.supabase import get_supabase


def visible_account_ids(household_id: str, user_id: str) -> list[str]:
    """Return the account ids ``user_id`` may see within ``household_id``.

    No-op today (all accounts shared). ``user_id`` is accepted now so T4 can filter
    on ``owner_id`` without changing any call site.
    """
    supabase = get_supabase()
    result = (
        supabase.table("accounts")
        .select("id")
        .eq("household_id", household_id)
        .execute()
    )
    rows = cast(list[dict], result.data if isinstance(result.data, list) else [])
    return [row["id"] for row in rows]
