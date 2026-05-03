from supabase import create_client, Client
from app.core.config import get_settings
from functools import lru_cache

settings = get_settings()


@lru_cache
def get_supabase() -> Client:
    """Returns a Supabase client using the anon key (respects RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache
def get_supabase_admin() -> Client:
    """Returns a Supabase client using the service role key (bypasses RLS).
    Use only for admin operations and server-side trusted logic."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
