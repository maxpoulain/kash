"""Supabase client configuration."""

from supabase import Client, create_client

from app.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client with service role key.

    The service role key bypasses RLS - use with caution.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_client
