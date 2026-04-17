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
        <div className="rounded-xl bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Dépenses</p>
          <p className="font-semibold text-primary">
            -{totalExpense.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="rounded-xl bg-success/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Revenus</p>
          <p className="font-semibold text-success">
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
              className="flex items-center justify-between rounded-xl bg-card px-4 py-3 ring-1 ring-border/50"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const { name, Icon } = getCategoryInfo(t.category_id);
                  return (
                    <>
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        t.type === "expense" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">
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
                  "text-sm font-semibold",
                  t.type === "expense" ? "text-primary" : "text-success"
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
