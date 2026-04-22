"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Target } from "lucide-react";

interface EmptyStateProps {
  month: string;
  onAddGoal?: () => void;
}

function formatMonthName(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString("fr-FR", { month: "long" });
}

export function EmptyState({ month, onAddGoal }: EmptyStateProps) {
  const monthName = formatMonthName(month);

  return (
    <Card variant="dashed" className="items-center justify-center gap-6 bg-card/50 p-8 py-12">
      {/* Target icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Target className="h-10 w-10 text-muted-foreground" />
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

      <Button className="gap-2" onClick={onAddGoal}>
        <Plus className="h-4 w-4" />
        Créer un objectif
      </Button>
    </Card>
  );
}
