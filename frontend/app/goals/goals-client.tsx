"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";
import { getSpendingGoals } from "@/lib/api";
import type { SpendingGoalsResponse } from "@/types/api";
import { GoalCard } from "./goal-card";
import { EmptyState } from "./empty-state";

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function GoalsClient() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<SpendingGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const goals = await getSpendingGoals(month);
      setData(goals);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const isCurrentMonth = month === currentMonth();
  const hasGoals = data && data.goals.length > 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight">Objectifs</h1>
              {!loading && data && (
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {formatCurrency(data.total_spent)} sur {formatCurrency(data.total_goal)} budgeté
                </p>
              )}
            </div>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
          </div>

          {/* Month selector */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonth(prevMonth)}
              aria-label="Mois précédent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium capitalize">
              {formatMonth(month)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonth(nextMonth)}
              disabled={isCurrentMonth}
              aria-label="Mois suivant"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : !hasGoals ? (
          <EmptyState month={month} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data!.goals.map((goal) => (
              <GoalCard key={goal.category_id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
