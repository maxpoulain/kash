"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { AppLayout } from "@/components/layout/app-layout";
import { getSpendingGoals } from "@/lib/api";
import { currentMonth } from "@/lib/month";
import type { SpendingGoalsResponse } from "@/types/api";
import { GoalCard } from "./goal-card";
import { EmptyState } from "./empty-state";
import { CreateGoalModal } from "./create-goal-modal";

export function GoalsClient() {
  const t = useTranslations("goals.list");
  const locale = useLocale();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<SpendingGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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

  const usedCategoryIds = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.goals.map((g) => g.category_id));
  }, [data]);

  const hasGoals = data && data.goals.length > 0;

  function formatCurrency(amount: number): string {
    return amount.toLocaleString(locale, { style: "currency", currency: "EUR" });
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">{t("title")}</h1>
            {!loading && data && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {t("budgetSummary", { spent: formatCurrency(data.total_spent), goal: formatCurrency(data.total_goal) })}
              </p>
            )}
          </div>
          {/* Add button (mobile only; desktop add sits in the month switcher endSlot) */}
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl lg:hidden" aria-label={t("addAria")} onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <MonthSwitcher
          value={month}
          onChange={setMonth}
          showDayCounter
          showTodayButton
          endSlot={
            <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          }
        />

        {/* Content */}
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : !hasGoals ? (
          <EmptyState month={month} onAddGoal={() => setModalOpen(true)} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data!.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <CreateGoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        month={month}
        usedCategoryIds={usedCategoryIds}
        onGoalCreated={load}
      />
    </AppLayout>
  );
}
