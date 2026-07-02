import {
  Briefcase,
  Car,
  Clapperboard,
  Coins,
  Gift,
  Heart,
  Home,
  Package,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Utensils,
  Plane,
  Dumbbell,
  GraduationCap,
  PiggyBank,
  Baby,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

/**
 * Name → icon, for the suggested categories (whose DB icon is an emoji string
 * that the frontend does not use directly).
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Loyer: Home,
  Courses: ShoppingCart,
  Transport: Car,
  Restaurants: Utensils,
  Santé: Heart,
  Loisirs: Clapperboard,
  Abonnements: Smartphone,
  Salaire: Briefcase,
  Autre: Package,
  Investissement: Coins,
  "Cadeau reçu": Gift,
  "Autre revenu": Sparkles,
};

export interface AllowedCategoryIcon {
  key: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Icons the user can pick when creating a custom category. The `key` is stored
 * as the category's `icon` in the DB; `CATEGORY_ICON_BY_KEY` maps it back to a
 * Lucide component via static lookup during render.
 */
export const ALLOWED_CATEGORY_ICONS: AllowedCategoryIcon[] = [
  { key: "Home", label: "Logement", icon: Home },
  { key: "ShoppingCart", label: "Courses", icon: ShoppingCart },
  { key: "Car", label: "Transport", icon: Car },
  { key: "Utensils", label: "Restaurants", icon: Utensils },
  { key: "Heart", label: "Santé", icon: Heart },
  { key: "Clapperboard", label: "Loisirs", icon: Clapperboard },
  { key: "Smartphone", label: "Abonnements", icon: Smartphone },
  { key: "Briefcase", label: "Salaire", icon: Briefcase },
  { key: "Package", label: "Autre", icon: Package },
  { key: "Coins", label: "Investissement", icon: Coins },
  { key: "Gift", label: "Cadeau", icon: Gift },
  { key: "Sparkles", label: "Autre revenu", icon: Sparkles },
  { key: "Plane", label: "Voyages", icon: Plane },
  { key: "Dumbbell", label: "Sport", icon: Dumbbell },
  { key: "GraduationCap", label: "Éducation", icon: GraduationCap },
  { key: "PiggyBank", label: "Épargne", icon: PiggyBank },
  { key: "Baby", label: "Enfants", icon: Baby },
  { key: "PawPrint", label: "Animaux", icon: PawPrint },
];

/**
 * Lucide component for each ALLOWED_CATEGORY_ICONS key — used to resolve a
 * custom category's `icon` (stored as the key) to a component via static
 * lookup (a function call returning a component would trip the
 * `react-hooks/static-components` lint rule during render).
 */
export const CATEGORY_ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(
  ALLOWED_CATEGORY_ICONS.map((item) => [item.key, item.icon]),
);

/**
 * Resolve a category's Lucide component during render via static lookup.
 *
 *   const Icon = category.icon && CATEGORY_ICON_BY_KEY[category.icon]
 *     ? CATEGORY_ICON_BY_KEY[category.icon]
 *     : CATEGORY_ICONS[category.name] ?? Package;
 *
 * Suggested categories store an emoji as `icon` (resolved by name), custom
 * categories store an ALLOWED_CATEGORY_ICONS key (e.g. "ShoppingCart"). A
 * function call returning a component would trip the
 * `react-hooks/static-components` lint rule, so callers inline the lookup.
 */
