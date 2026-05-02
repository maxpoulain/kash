"use client";

import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  currentMonth,
  formatMonth,
  getMonthDays,
  isCurrentMonth,
  nextMonth,
  prevMonth,
} from "@/lib/month";

interface MonthSwitcherProps {
  value: string;
  onChange: (month: string) => void;
  disableFutureMonths?: boolean;
  showDayCounter?: boolean;
  showTodayButton?: boolean;
  endSlot?: ReactNode;
  size?: "default" | "compact";
  className?: string;
}

export function MonthSwitcher({
  value,
  onChange,
  disableFutureMonths = true,
  showDayCounter = false,
  showTodayButton = false,
  endSlot,
  size = "default",
  className,
}: MonthSwitcherProps) {
  const t = useTranslations("monthSwitcher");
  const locale = useLocale();
  const atCurrent = isCurrentMonth(value);
  const nextDisabled = disableFutureMonths && atCurrent;

  const goPrev = () => onChange(prevMonth(value));
  const goNext = () => onChange(nextMonth(value));
  const goToday = () => onChange(currentMonth());

  if (size === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button variant="ghost" size="icon" onClick={goPrev} aria-label={t("prevMonthAria")}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="min-w-[100px] text-center text-sm font-medium capitalize">
          {formatMonth(value, locale)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label={t("nextMonthAria")}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const { currentDay, daysLeft } = getMonthDays(value);
  const hasRightContent = showTodayButton || Boolean(endSlot);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-card p-2 ring-1 ring-border/50 lg:p-3",
        className,
      )}
    >
      {/* Desktop: arrows grouped on the left + label */}
      <div className="hidden items-center gap-3 lg:flex">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          aria-label={t("prevMonthAria")}
          className="h-9 w-9 rounded-full border-border bg-background"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label={t("nextMonthAria")}
          className="h-9 w-9 rounded-full border-border bg-background"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <div className="ml-2 flex flex-col">
          <span className="text-sm font-medium capitalize">{formatMonth(value, locale)}</span>
          {showDayCounter && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("dayCounter", { currentDay, daysLeft })}
            </span>
          )}
        </div>
      </div>

      {/* Mobile: prev arrow on left edge */}
      <Button
        variant="outline"
        size="icon"
        onClick={goPrev}
        aria-label={t("prevMonthAria")}
        className="h-9 w-9 shrink-0 rounded-full border-border bg-background lg:hidden"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Mobile: centered label (+ day counter) */}
      <div className="flex flex-1 flex-col items-center text-center lg:hidden">
        <span className="text-sm font-medium capitalize">{formatMonth(value, locale)}</span>
        {showDayCounter && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("dayCounter", { currentDay, daysLeft })}
          </span>
        )}
      </div>

      {/* Mobile: next arrow on right edge */}
      <Button
        variant="outline"
        size="icon"
        onClick={goNext}
        disabled={nextDisabled}
        aria-label={t("nextMonthAria")}
        className="h-9 w-9 shrink-0 rounded-full border-border bg-background lg:hidden"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>

      {/* Desktop: action area on the right */}
      {hasRightContent && (
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {showTodayButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              disabled={atCurrent}
              className="rounded-full border-border bg-background"
            >
              {t("thisMonth")}
            </Button>
          )}
          {endSlot}
        </div>
      )}
    </div>
  );
}
