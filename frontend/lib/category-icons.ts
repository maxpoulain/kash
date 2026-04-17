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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
