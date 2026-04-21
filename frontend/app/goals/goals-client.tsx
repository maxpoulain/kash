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

function getMonthDays(month: string): {
  currentDay: number;
  totalDays: number;
  daysLeft: number;
} {
  const [year, m] = month.split("-").map(Number);
  const totalDays = new Date(year, m, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === m;
  const currentDay = isCurrentMonth ? now.getDate() : totalDays;
  const daysLeft = Math.max(totalDays - currentDay, 0);
  return { currentDay, totalDays, daysLeft };
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
  const { currentDay, totalDays, daysLeft } = getMonthDays(month);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Objectifs</h1>
            {!loading && data && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {formatCurrency(data.total_spent)} sur {formatCurrency(data.total_goal)} budgeté
              </p>
            )}
          </div>
          {/* Add button (mobile header + desktop header) */}
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl lg:hidden" aria-label="Ajouter un objectif">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Month selector - matches mockup */}
        <div className="flex items-center gap-3 rounded-2xl bg-card p-2 ring-1 ring-border/50 lg:p-3">
          {/* Desktop: arrows grouped on the left + month label */}
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth(prevMonth)}
              aria-label="Mois précédent"
              className="h-9 w-9 rounded-full border-border bg-background"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth(nextMonth)}
              disabled={isCurrentMonth}
              aria-label="Mois suivant"
              className="h-9 w-9 rounded-full border-border bg-background"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <div className="ml-2 flex flex-col">
              <span className="text-sm font-medium capitalize">{formatMonth(month)}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Jour {currentDay} · {daysLeft} restants
              </span>
            </div>
          </div>

          {/* Mobile: prev arrow on left edge */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(prevMonth)}
            aria-label="Mois précédent"
            className="h-9 w-9 shrink-0 rounded-full border-border bg-background lg:hidden"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {/* Mobile: centered month label */}
          <div className="flex flex-1 flex-col items-center text-center lg:hidden">
            <span className="text-sm font-medium capitalize">{formatMonth(month)}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Jour {currentDay} · {daysLeft} restants
            </span>
          </div>

          {/* Mobile: next arrow on right edge */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(nextMonth)}
            disabled={isCurrentMonth}
            aria-label="Mois suivant"
            className="h-9 w-9 shrink-0 rounded-full border-border bg-background lg:hidden"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          {/* Desktop: action buttons pushed to the right */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(currentMonth())}
              disabled={isCurrentMonth}
              className="rounded-full border-border bg-background"
            >
              Ce mois
            </Button>
            <Button size="sm" className="gap-1.5 rounded-full">
              <Plus className="h-4 w-4" />
              Ajouter
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
