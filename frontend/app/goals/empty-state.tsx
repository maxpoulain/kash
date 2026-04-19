"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  month: string;
}

function formatMonthName(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString("fr-FR", { month: "long" });
}

export function EmptyState({ month }: EmptyStateProps) {
  const monthName = formatMonthName(month);

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border bg-card/50 p-8 py-12">
      {/* Piggy icon */}
      <div className="relative">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-pink-200"
        >
          {/* Body */}
          <ellipse cx="60" cy="70" rx="40" ry="32" fill="currentColor" />
          {/* Head */}
          <circle cx="35" cy="55" r="22" fill="currentColor" />
          {/* Snout */}
          <ellipse cx="22" cy="58" rx="10" ry="8" fill="#f9a8d4" />
          {/* Nostrils */}
          <circle cx="19" cy="58" r="1.5" fill="#be185d" />
          <circle cx="25" cy="58" r="1.5" fill="#be185d" />
          {/* Eye */}
          <circle cx="32" cy="50" r="2.5" fill="#374151" />
          {/* Ear */}
          <ellipse cx="28" cy="38" rx="6" ry="8" fill="#f9a8d4" transform="rotate(-20 28 38)" />
          {/* Legs */}
          <rect x="35" y="95" width="10" height="12" rx="3" fill="#f9a8d4" />
          <rect x="55" y="95" width="10" height="12" rx="3" fill="#f9a8d4" />
          <rect x="75" y="95" width="10" height="12" rx="3" fill="#f9a8d4" />
          {/* Tail */}
          <path
            d="M95 65 Q105 60 100 55 Q95 50 98 45"
            stroke="#f9a8d4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Coin slot */}
          <rect x="52" y="48" width="16" height="3" rx="1.5" fill="#be185d" opacity="0.3" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold">
          Aucun objectif pour {monthName}
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Définissez un plafond mensuel par catégorie pour rester dans les clous.
          Vous pourrez toujours le modifier plus tard.
        </p>
      </div>

      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Créer un objectif
      </Button>
    </div>
  );
}
