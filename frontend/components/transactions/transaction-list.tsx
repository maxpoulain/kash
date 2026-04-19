"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Download, Filter, Package } from "lucide-react";
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

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterday) return "Hier";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function groupByDate(txns: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const map: Record<string, Transaction[]> = {};
  for (const t of txns) {
    (map[t.date] ??= []).push(t);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, label: formatDateLabel(date), items }));
}

type FilterType = "all" | "expense" | "income";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "expense", label: "Dépenses" },
  { key: "income", label: "Revenus" },
];

interface TransactionListProps {
  refreshKey?: number;
}

export function TransactionList({ refreshKey = 0 }: TransactionListProps) {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

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

  function getCategoryInfo(categoryId: string | null) {
    if (!categoryId) return { name: "Sans catégorie", Icon: Package };
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return { name: "Sans catégorie", Icon: Package };
    return { name: cat.name, Icon: CATEGORY_ICONS[cat.name] ?? Package };
  }

  const isCurrentMonth = month === currentMonth();
  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const groups = groupByDate(filtered);

  function formatAmount(t: Transaction) {
    const sign = t.type === "expense" ? "−" : "+";
    return sign + t.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Mobile: month nav ──────────────────────────────── */}
      <div className="flex items-center justify-between lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMonth(prevMonth)} aria-label="Mois précédent">
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

      {/* ── Mobile: summary cards ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dépenses</p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight text-warning">
            −{totalExpense.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Revenus</p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight text-success">
            +{totalIncome.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>

      {/* ── Filter row (both) ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === key
                ? "bg-foreground text-background"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          disabled
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
        >
          <Filter className="h-3 w-3" /> Filtres
        </button>
        <button
          disabled
          className="hidden lg:flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
        >
          <Download className="h-3 w-3" /> Export
        </button>
      </div>

      {/* ── Loading / empty ────────────────────────────────── */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune transaction ce mois-ci</p>
      ) : (
        <>
          {/* ── Desktop: table ─────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="grid gap-3.5 px-3.5 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              style={{ gridTemplateColumns: "130px 1fr 160px 110px" }}>
              <span>Date</span>
              <span>Description</span>
              <span>Catégorie</span>
              <span className="text-right">Montant</span>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {filtered.map((t, i) => {
                const { name, Icon } = getCategoryInfo(t.category_id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "grid items-center gap-3.5 px-3.5 py-3.5",
                      i < filtered.length - 1 && "border-b border-border"
                    )}
                    style={{ gridTemplateColumns: "130px 1fr 160px 110px" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium">{formatDateShort(t.date)}</p>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                        t.type === "expense" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-[13px] font-medium">
                        {t.note ?? name}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground">{name}</div>
                    <div className={cn(
                      "text-right font-mono text-[13px] font-semibold",
                      t.type === "expense" ? "text-foreground" : "text-success"
                    )}>
                      {formatAmount(t)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Mobile: grouped list ───────────────────────── */}
          <div className="flex flex-col gap-4 lg:hidden">
            {groups.map(({ date, label, items }) => (
              <div key={date}>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1">
                  {label}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {items.map((t) => {
                    const { name, Icon } = getCategoryInfo(t.category_id);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center",
                            t.type === "expense" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate text-sm font-medium">{t.note ?? name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {name}
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          "ml-3 shrink-0 font-mono text-sm font-semibold",
                          t.type === "expense" ? "text-foreground" : "text-success"
                        )}>
                          {formatAmount(t)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
