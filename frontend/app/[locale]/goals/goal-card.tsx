"use client";

import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { SpendingGoal } from "@/types/api";
import { CATEGORY_ICON_BY_KEY, CATEGORY_ICONS } from "@/lib/category-icons";
import { Package } from "lucide-react";

interface GoalCardProps {
  goal: SpendingGoal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const t = useTranslations("goals.card");
  const locale = useLocale();
  // Resolve via static lookups (a function returning a component would trip
  // react-hooks/static-components). Custom categories store a Lucide key as
  // `category_icon`; suggestions store an emoji, so resolve by name.
  const Icon = (goal.category_icon && CATEGORY_ICON_BY_KEY[goal.category_icon])
    ? CATEGORY_ICON_BY_KEY[goal.category_icon]
    : CATEGORY_ICONS[goal.category_name] ?? Package;
  const isOverBudget = goal.status === "over_budget";
  const isUnderPace = goal.status === "under_pace";

  const progressWidth = Math.min(goal.progress_percent, 100);

  // Progress bar color based on status
  const progressColor = isOverBudget
    ? "bg-destructive"
    : isUnderPace
      ? "bg-warning"
      : "bg-success";

  const statusTextColor = isOverBudget
    ? "text-destructive"
    : isUnderPace
      ? "text-warning"
      : "text-success";

  const statusBgColor = isOverBudget
    ? "bg-destructive/10"
    : isUnderPace
      ? "bg-warning/10"
      : "bg-success/10";

  function formatCurrency(amount: number): string {
    return amount.toLocaleString(locale, { style: "currency", currency: "EUR" });
  }

  return (
    <Card className="gap-3 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Category icon */}
          <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-muted">
            <Icon className="h-5 w-5 text-foreground" />
          </div>

          {/* Category name */}
          <span className="truncate font-medium">{goal.category_name}</span>
        </div>

        {/* Amounts */}
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-mono text-sm font-semibold">
            {formatCurrency(goal.spent_amount)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {formatCurrency(goal.goal_amount)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full transition-all", progressColor)}
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between gap-2">
          {/* Status badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusBgColor,
              statusTextColor
            )}
          >
            <span>{Math.round(goal.progress_percent)}%</span>
            {isOverBudget ? (
              <span>{t("overBy", { amount: formatCurrency(Math.abs(goal.remaining)) })}</span>
            ) : isUnderPace ? (
              <span>{t("underPace")}</span>
            ) : (
              <span>{t("onTrack")}</span>
            )}
          </div>

          {/* Remaining */}
          <span
            className={cn(
              "text-xs font-medium",
              isOverBudget ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {isOverBudget
              ? t("overByShort", { amount: formatCurrency(Math.abs(goal.remaining)) })
              : t("left", { amount: formatCurrency(goal.remaining) })}
          </span>
        </div>
      </div>
    </Card>
  );
}
