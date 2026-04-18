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
    <div className="flex flex-col gap-4">
      {/* Month navigation - Design System: icon buttons (square variant) */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth(prevMonth)}
          aria-label="Mois précédent"
          className="rounded-[10px] border-border bg-card"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <span className="font-display text-lg font-medium capitalize">{formatMonth(month)}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth(nextMonth)}
          disabled={isCurrentMonth}
          aria-label="Mois suivant"
          className="rounded-[10px] border-border bg-card"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Monthly summary - Design System: metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Dépenses
            </p>
            <p className="mt-1 font-display text-xl font-medium tracking-tight text-warning">
              -{totalExpense.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Revenus
            </p>
            <p className="mt-1 font-display text-xl font-medium tracking-tight text-success">
              +{totalIncome.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list - Design System: list cards */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : transactions.length === 0 ? (
        /* Empty state - Design System: piggy companion */
        <Card className="rounded-2xl border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 rounded-2xl bg-muted p-4">
              <Piggy size={110} mood="sleep" fill={0} />
            </div>
            <p className="font-display text-lg font-medium">Votre tirelire dort…</p>
            <p className="mt-1 max-w-[260px] text-sm text-muted-foreground">
              Aucune transaction ce mois-ci. Ajoutez-en une pour commencer à suivre vos dépenses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border">
          <CardContent className="p-0">
            <ul className="flex flex-col">
              {transactions.map((t, index) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    index !== transactions.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const { name, Icon } = getCategoryInfo(t.category_id);
                      return (
                        <>
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                              t.type === "expense"
                                ? "bg-primary/15 text-primary"
                                : "bg-success/10 text-success"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
                      "font-mono text-sm font-semibold tabular-nums",
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
