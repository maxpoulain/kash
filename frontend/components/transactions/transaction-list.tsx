"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Piggy } from "@/components/kash-piggy";
import { getTransactions, getCategories } from "@/lib/api";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { Category, Transaction } from "@/types/api";

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

interface TransactionListProps {
  refreshKey?: number;
}

export function TransactionList({ refreshKey = 0 }: TransactionListProps) {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([getTransactions(month), getCategories()]);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  function getCategoryInfo(categoryId: string | null) {
    if (!categoryId) return { name: "Sans catégorie", Icon: Package };
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return { name: "Sans catégorie", Icon: Package };
    return { name: cat.name, Icon: CATEGORY_ICONS[cat.name] ?? Package };
  }

  const isCurrentMonth = month === currentMonth();

  return (
    <div className="flex flex-col gap-5">
      {/* Month navigation - Design System: icon buttons with square radius */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth(prevMonth)}
          aria-label="Mois précédent"
          className="rounded-[10px] border-border bg-card hover:bg-muted"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <span className="font-display text-xl font-medium capitalize tracking-tight">
          {formatMonth(month)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth(nextMonth)}
          disabled={isCurrentMonth}
          aria-label="Mois suivant"
          className="rounded-[10px] border-border bg-card hover:bg-muted"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Monthly summary - Design System: metric cards per spec */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Dépenses
            </p>
            <p className="mt-2 font-display text-2xl font-medium tracking-tight text-warning">
              -{totalExpense.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Revenus
            </p>
            <p className="mt-2 font-display text-2xl font-medium tracking-tight text-success">
              +{totalIncome.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list - Design System: list card pattern */}
      {loading ? (
        <Card className="rounded-2xl border-border">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Chargement…
            </div>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        /* Empty state - Design System: piggy companion in muted container */
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-10 px-5 text-center">
          <div className="mb-4 rounded-2xl bg-muted p-5">
            <Piggy size={110} mood="sleep" fill={0} />
          </div>
          <h3 className="font-display text-xl font-medium tracking-tight">
            Votre tirelire dort…
          </h3>
          <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">
            Aucune transaction ce mois-ci. Ajoutez-en une pour commencer à suivre vos dépenses.
          </p>
        </div>
      ) : (
        <Card className="rounded-2xl border-border overflow-hidden">
          <CardContent className="p-0">
            <ul className="flex flex-col">
              {transactions.map((t, index) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5",
                    index !== transactions.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {(() => {
                      const { name, Icon } = getCategoryInfo(t.category_id);
                      return (
                        <>
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                              t.type === "expense"
                                ? "bg-pig/15 text-pig-deep"
                                : "bg-accent-soft text-accent"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[14px] font-medium leading-tight">{name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                              {new Date(t.date).toLocaleDateString("fr-FR")}
                              {t.note ? ` · ${t.note}` : ""}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[14px] font-semibold tabular-nums tracking-tight",
                      t.type === "expense" ? "text-foreground" : "text-success"
                    )}
                  >
                    {t.type === "expense" ? "-" : "+"}
                    {t.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
