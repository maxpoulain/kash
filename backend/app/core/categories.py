"""Category constants and helpers."""

from uuid import UUID

from app.core.supabase import get_supabase
from app.schemas.transactions import TransactionType


class SuggestedCategory:
    def __init__(self, id: str, name: str, icon: str, type: TransactionType):
        self.id = UUID(id)
        self.name = name
        self.icon = icon
        self.type = type


SUGGESTED_CATEGORIES: list[SuggestedCategory] = [
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9b",
        "Loyer",
        "🏠",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9c",
        "Courses",
        "🛒",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9d",
        "Transport",
        "🚗",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9e",
        "Restaurants",
        "🍽️",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9f",
        "Santé",
        "💊",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa0",
        "Loisirs",
        "🎬",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa1",
        "Abonnements",
        "📱",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa2",
        "Salaire",
        "💰",
        TransactionType.income,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa3",
        "Autre",
        "📦",
        TransactionType.expense,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa4",
        "Investissement",
        "📈",
        TransactionType.income,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa5",
        "Cadeau reçu",
        "🎁",
        TransactionType.income,
    ),
    SuggestedCategory(
        "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa6",
        "Autre revenu",
        "✨",
        TransactionType.income,
    ),
]

# Mapping for fast lookup
SUGGESTED_BY_ID: dict[UUID, SuggestedCategory] = {c.id: c for c in SUGGESTED_CATEGORIES}
SUGGESTED_BY_NAME: dict[str, SuggestedCategory] = {c.name: c for c in SUGGESTED_CATEGORIES}


def find_duplicate_category(household_id: str, name: str) -> bool:
    """Return True if a category with the same (trimmed, case-insensitive) name
    already exists for the household. Comparison is case-insensitive because the
    DB unique constraint on (household_id, name) is case-sensitive in Postgres.
    """
    cleaned = name.strip()
    if not cleaned:
        return False
    supabase = get_supabase()
    result = (
        supabase.table("categories")
        .select("id")
        .eq("household_id", household_id)
        .ilike("name", cleaned)
        .limit(1)
        .execute()
    )
    rows = result.data if isinstance(result.data, list) else []
    return len(rows) > 0


def _ensure_category_exists(household_id: str, category_id: str | None) -> str | None:
    """If category_id is a suggested category not yet created for the household, create it."""
    if category_id is None:
        return None
    try:
        category_uuid = UUID(category_id)
    except Exception:
        return category_id
    suggested = SUGGESTED_BY_ID.get(category_uuid)
    if suggested is None:
        # Not a suggested ID; assume it already exists in DB (or will fail FK)
        return category_id
    supabase = get_supabase()
    existing = (
        supabase.table("categories")
        .select("id")
        .eq("household_id", household_id)
        .eq("id", category_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return category_id
    # Create it lazily
    supabase.table("categories").insert(
        {
            "id": category_id,
            "household_id": household_id,
            "name": suggested.name,
            "icon": suggested.icon,
            "type": suggested.type.value,
        }
    ).execute()
    return category_id
