"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(prevMonth)}
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <span className="font-medium capitalize">{formatMonth(month)}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(nextMonth)}
          disabled={isCurrentMonth}
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dépenses</p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight text-warning">
            -{totalExpense.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Revenus</p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight text-success">
            +{totalIncome.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune transaction ce mois-ci
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const { name, Icon } = getCategoryInfo(t.category_id);
                  return (
                    <>
                      <div className={cn(
                        "h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center",
                        t.type === "expense" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"
                      )}>
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
                  "font-mono text-sm font-semibold",
                  t.type === "expense" ? "text-foreground" : "text-success"
                )}
              >
                {t.type === "expense" ? "-" : "+"}
                {t.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
