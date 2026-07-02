import type { Category, TransactionType } from "@/types/api";

/**
 * Frontend mirror of the backend `SUGGESTED_CATEGORIES` (app/core/categories.py).
 *
 * The IDs MUST match the backend fixed UUIDs: when a transaction references a
 * suggested category, the backend lazily creates a row with that exact id, so
 * the merge below de-duplicates on id.
 */
export const SUGGESTED_CATEGORIES: Category[] = [
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9b", household_id: null, name: "Loyer", icon: "🏠", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9c", household_id: null, name: "Courses", icon: "🛒", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9d", household_id: null, name: "Transport", icon: "🚗", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9e", household_id: null, name: "Restaurants", icon: "🍽️", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8a9f", household_id: null, name: "Santé", icon: "💊", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa0", household_id: null, name: "Loisirs", icon: "🎬", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa1", household_id: null, name: "Abonnements", icon: "📱", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa2", household_id: null, name: "Salaire", icon: "💰", type: "income" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa3", household_id: null, name: "Autre", icon: "📦", type: "expense" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa4", household_id: null, name: "Investissement", icon: "📈", type: "income" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa5", household_id: null, name: "Cadeau reçu", icon: "🎁", type: "income" },
  { id: "0192a8c4-7b3d-7f2a-9e1b-4c5d6e7f8aa6", household_id: null, name: "Autre revenu", icon: "✨", type: "income" },
];

/**
 * Merge household categories with suggestions. A suggestion whose id already
 * exists as a household category (lazy-created on first use) is dropped, so it
 * appears only once and with the household's real icon.
 */
export function mergeCategories(household: Category[]): Category[] {
  const byId = new Map<string, Category>();
  for (const suggestion of SUGGESTED_CATEGORIES) {
    byId.set(suggestion.id, suggestion);
  }
  for (const category of household) {
    byId.set(category.id, category);
  }
  return Array.from(byId.values());
}

export function suggestedCategoryByType(type: TransactionType): Category[] {
  return SUGGESTED_CATEGORIES.filter((c) => c.type === type);
}
