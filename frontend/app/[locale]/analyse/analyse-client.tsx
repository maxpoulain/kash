"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SankeyFlow } from "@/components/analyse/sankey-flow";
import { CategoryBreakdown, type BreakdownItem } from "@/components/analyse/category-breakdown";
import { getSummary, getAccounts } from "@/lib/api";
import {
  expenseColor,
  incomeColor,
  INCOME_FLOW_COLOR,
  PRIOR_BALANCE_COLOR,
  SAVINGS_COLOR,
  TRANSFER_COLOR,
} from "@/lib/analyse-colors";
import { buildFlowNodes } from "@/lib/analyse-flow";
import { currentMonth } from "@/lib/month";
import type { Account, CategoryAmount, Summary } from "@/types/api";

const ALL_ACCOUNTS = "all";

export function AnalyseClient() {
  const t = useTranslations("analyse");
  const locale = useLocale();
  const [month, setMonth] = useState(currentMonth);
  const [accountId, setAccountId] = useState(ALL_ACCOUNTS);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getSummary(month, accountId === ALL_ACCOUNTS ? undefined : accountId));
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [month, accountId]);

  useEffect(() => {
    // load() flips a loading flag synchronously to show the skeleton during
    // fetch — the cascading render is intentional and cheap here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    // Account options for the scope selector; visible accounts only (the API
    // already excludes archived ones).
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => amount.toLocaleString(locale, { style: "currency", currency: "EUR" }),
    [locale]
  );

  const toItems = useCallback(
    (cats: CategoryAmount[], colorFn: (i: number) => string): BreakdownItem[] =>
      [...cats]
        .sort((a, b) => b.amount - a.amount)
        .map((c, i) => ({
          id: c.category_id ?? "uncategorized",
          label: c.name ?? t("uncategorized"),
          amount: c.amount,
          color: colorFn(i),
        })),
    [t]
  );

  const incomeItems = useMemo(
    () => (summary ? toItems(summary.income_by_category, incomeColor) : []),
    [summary, toItems]
  );
  const expenseItems = useMemo(
    () => (summary ? toItems(summary.expense_by_category, expenseColor) : []),
    [summary, toItems]
  );

  const flow = useMemo(
    () =>
      summary
        ? buildFlowNodes(
            summary,
            {
              incomeFlow: INCOME_FLOW_COLOR,
              savings: SAVINGS_COLOR,
              priorBalance: PRIOR_BALANCE_COLOR,
              transfer: TRANSFER_COLOR,
            },
            {
              income: t("flowIncome"),
              savings: t("flowSavings"),
              remainedLiquid: t("flowRemainedLiquid"),
              priorBalance: t("flowPriorBalance"),
              transferFrom: (name) => t("flowTransferFrom", { name: name ?? t("flowTransferUnknown") }),
              transferTo: (name) => t("flowTransferTo", { name: name ?? t("flowTransferUnknown") }),
            }
          )
        : { income: [], savings: [] },
    [summary, t]
  );

  const hasData = summary && (summary.total_income > 0 || summary.total_expense > 0);

  const savingsRateLabel =
    summary && summary.savings_rate !== null
      ? `${Math.round(summary.savings_rate * 100)}%`
      : t("savingsRateNa");

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">{t("title")}</h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSwitcher value={month} onChange={setMonth} />
            {accounts.length > 0 && (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger size="sm" aria-label={t("accountFilter")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ACCOUNTS}>{t("allAccounts")}</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {loading && !summary ? (
          <Card className="h-64 animate-pulse bg-muted/40" />
        ) : !hasData ? (
          <Card variant="dashed" className="items-center gap-2 bg-card/50 p-8 py-12 text-center">
            <h3 className="text-lg font-semibold">{t("empty.title", { month })}</h3>
            <p className="max-w-sm text-sm text-muted-foreground">{t("empty.description")}</p>
          </Card>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label={t("kpiIncome")} value={formatCurrency(summary!.total_income)} accent="income" />
              <Kpi label={t("kpiExpense")} value={formatCurrency(summary!.total_expense)} accent="expense" />
              <Kpi label={t("kpiNet")} value={formatCurrency(summary!.net)} accent="savings" />
              <Kpi label={t("savingsRate")} value={savingsRateLabel} accent="savings" />
            </div>

            {/* Breakdowns */}
            <div className="grid gap-4 lg:grid-cols-2">
              <CategoryBreakdown
                title={t("expenseByCategory")}
                items={expenseItems}
                total={summary!.total_expense}
                emptyLabel={t("noExpense")}
                formatCurrency={formatCurrency}
              />
              <CategoryBreakdown
                title={t("incomeByCategory")}
                items={incomeItems}
                total={summary!.total_income}
                emptyLabel={t("noIncome")}
                formatCurrency={formatCurrency}
              />
            </div>

            {/* Money flow (Sankey) — desktop only; cramped on mobile */}
            <Card className="hidden gap-4 p-5 lg:flex">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-lg font-semibold">{t("flowTitle")}</div>
              </div>
              <SankeyFlow
                income={flow.income}
                expense={expenseItems}
                savings={flow.savings}
                formatCurrency={formatCurrency}
              />
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "income" | "expense" | "savings";
}) {
  const color =
    accent === "income"
      ? "text-accent"
      : accent === "expense"
        ? "text-destructive"
        : accent === "savings"
          ? "text-coin"
          : "text-foreground";
  return (
    <Card className="gap-1 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`font-display text-xl font-semibold ${color}`}>{value}</div>
    </Card>
  );
}
