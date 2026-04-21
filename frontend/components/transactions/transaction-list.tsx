"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Filter, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { getTransactions, getCategories } from "@/lib/api";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { currentMonth } from "@/lib/month";
import type { Category, Transaction } from "@/types/api";

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

const TYPE_FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "expense", label: "Dépenses" },
  { key: "income", label: "Revenus" },
];

interface TransactionListProps {
  refreshKey?: number;
  onAdd?: () => void;
}

export function TransactionList({ refreshKey = 0, onAdd }: TransactionListProps) {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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

  const uncategorizedCount = transactions.filter((t) => !t.category_id).length;

  const filtered = transactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => !categoryFilter || t.category_id === categoryFilter);

  const groups = groupByDate(filtered);

  function formatAmount(t: Transaction) {
    const sign = t.type === "expense" ? "−" : "+";
    return sign + t.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  }

  const activeCategoryName = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)?.name ?? null
    : null;

  const visibleCategoryIds = new Set(
    (typeFilter === "all" ? transactions : transactions.filter((t) => t.type === typeFilter))
      .map((t) => t.category_id)
      .filter(Boolean) as string[]
  );
  const visibleCategories = categories.filter((c) => visibleCategoryIds.has(c.id));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header: title + month nav ────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Transactions</h1>
            {!loading && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {transactions.length} ce mois
                {uncategorizedCount > 0 && ` · ${uncategorizedCount} non catégorisées`}
              </p>
            )}
          </div>
          {/* Add button (mobile only; desktop add sits in the month switcher endSlot) */}
          <Button
            size="icon"
            onClick={onAdd}
            className="h-10 w-10 shrink-0 rounded-xl lg:hidden"
            aria-label="Ajouter une transaction"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <MonthSwitcher
          value={month}
          onChange={setMonth}
          showDayCounter
          showTodayButton
          endSlot={
            <Button size="sm" onClick={onAdd} className="gap-1.5 rounded-full">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          }
        />
      </div>

      {/* ── Filter row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTypeFilter(key); setCategoryFilter(null); }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                typeFilter === key
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                categoryFilter
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Filter className="h-3 w-3" />
              {activeCategoryName ?? "Filtres"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5">
            <button
              onClick={() => setCategoryFilter(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                !categoryFilter && "font-medium"
              )}
            >
              {!categoryFilter && <Check className="h-3.5 w-3.5 shrink-0" />}
              {categoryFilter && <span className="h-3.5 w-3.5 shrink-0" />}
              Toutes les catégories
            </button>
            {visibleCategories.map((cat) => {
              const isActive = categoryFilter === cat.id;
              const Icon = CATEGORY_ICONS[cat.name] ?? Package;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(isActive ? null : cat.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                    isActive && "font-medium"
                  )}
                >
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  {cat.name}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
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
            <div
              className="grid gap-3.5 px-3.5 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              style={{ gridTemplateColumns: "130px 1fr 110px" }}
            >
              <span>Date</span>
              <span>Catégorie</span>
              <span className="text-right">Montant</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {filtered.map((t, i) => {
                const { name, Icon } = getCategoryInfo(t.category_id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "grid items-center gap-3.5 px-3.5 py-3.5",
                      i < filtered.length - 1 && "border-b border-border"
                    )}
                    style={{ gridTemplateColumns: "130px 1fr 110px" }}
                  >
                    <p className="text-[13px] font-medium">{formatDateShort(t.date)}</p>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                        t.type === "expense" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-[13px] font-medium">{name}</span>
                    </div>
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
                <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
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
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center",
                            t.type === "expense" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate text-sm font-medium">{name}</span>
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
