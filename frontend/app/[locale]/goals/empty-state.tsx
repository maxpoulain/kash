"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Target } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface EmptyStateProps {
  month: string;
  onAddGoal?: () => void;
}

function formatMonthName(month: string, locale: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString(locale, { month: "long" });
}

export function EmptyState({ month, onAddGoal }: EmptyStateProps) {
  const t = useTranslations("goals.empty");
  const locale = useLocale();
  const monthName = formatMonthName(month, locale);

  return (
    <Card variant="dashed" className="items-center justify-center gap-6 bg-card/50 p-8 py-12">
      {/* Target icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Target className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold">
          {t("title", { month: monthName })}
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Button className="gap-2" onClick={onAddGoal}>
        <Plus className="h-4 w-4" />
        {t("cta")}
      </Button>
    </Card>
  );
}
