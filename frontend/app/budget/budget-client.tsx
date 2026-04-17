"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCategories, getBudgetSummary, saveBudget, copyBudgetFrom } from "@/lib/api";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { BottomNav } from "@/components/nav/bottom-nav";
import type { BudgetSummary, Category } from "@/types/api";

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

export function BudgetClient() {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState("0");
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const userMadeChange = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    userMadeChange.current = false;
    try {
      const cats = await getCategories().catch((e) => {
        throw new Error(`Catégories: ${e.message}`);
      });
      const sum = await getBudgetSummary(month).catch((e) => {
        throw new Error(`Résumé budget: ${e.message}`);
      });
      setCategories(cats);
      setSummary(sum);
      setIncome(String(sum.income));
      const allocs: Record<string, string> = {};
      for (const cat of sum.categories) {
        if (cat.category_id && cat.allocated > 0) {
          allocs[cat.category_id] = String(cat.allocated);
        }
      }
      setAllocations(allocs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[BudgetClient] load error:", err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-save with 800ms debounce, only when user explicitly changed something
  useEffect(() => {
    if (!userMadeChange.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const incomeNum = parseFloat(income) || 0;
      const allocationList = Object.entries(allocations)
        .map(([category_id, amount]) => ({ category_id, amount: parseFloat(amount) || 0 }))
        .filter((a) => a.amount > 0);

      setSaving(true);
      try {
        await saveBudget(month, { income: incomeNum, allocations: allocationList });
        const updated = await getBudgetSummary(month);
        setSummary(updated);
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [income, allocations, month]);

  const handleIncomeChange = (value: string) => {
    userMadeChange.current = true;
    setIncome(value);
  };

  const handleAllocationChange = (categoryId: string, value: string) => {
    userMadeChange.current = true;
    setAllocations((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleCopyFromPrev = async () => {
    const prev = prevMonth(month);
    try {
      await copyBudgetFrom(month, prev);
      toast.success("Budget copié depuis le mois précédent");
      load();
    } catch {
      toast.error("Aucun budget à copier depuis le mois précédent");
    }
  };

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const incomeNum = parseFloat(income) || 0;
  const remaining = incomeNum - totalAllocated;
  const overBudget = incomeNum > 0 && totalAllocated > incomeNum;
  const isCurrentMonth = month === currentMonth();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-24 pt-6">
      <h1 className="mb-6 font-display text-2xl font-semibold">Budget</h1>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
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

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" onClick={load}>Réessayer</Button>
        </div>
      ) : (
        <>
          {/* Income input */}
          <div className="mb-4 rounded-xl bg-card p-4 ring-1 ring-border/50">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Revenu mensuel du foyer
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={income}
                onChange={(e) => handleIncomeChange(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground">€</span>
            </div>
          </div>

          {/* Remaining balance */}
          <div
            className={cn(
              "mb-4 rounded-xl p-4 text-center",
              overBudget ? "bg-destructive/10" : "bg-success/10"
            )}
          >
            <p className="mb-1 text-xs text-muted-foreground">Restant à allouer</p>
            <p
              className={cn(
                "text-2xl font-bold",
                overBudget ? "text-destructive" : "text-success"
              )}
            >
              {remaining.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
            {overBudget && (
              <p className="mt-1 text-xs text-destructive">
                Dépassement de{" "}
                {Math.abs(remaining).toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            )}
          </div>

          {/* Copy from previous month (shown when no allocations yet) */}
          {totalAllocated === 0 && (
            <Button
              variant="outline"
              className="mb-4 w-full gap-2"
              onClick={handleCopyFromPrev}
            >
              <CopyIcon className="h-4 w-4" />
              Copier le mois précédent
            </Button>
          )}

          {/* Category allocations */}
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name] ?? Package;
              const catSummary = summary?.categories.find((c) => c.category_id === cat.id);
              const allocated = parseFloat(allocations[cat.id] ?? "0") || 0;
              const spent = catSummary?.spent ?? 0;
              const isOverSpent = allocated > 0 && spent > allocated;
              const isUnallocated = allocated === 0 && spent > 0;
              const progress = allocated > 0 ? Math.min(spent / allocated, 1) : (isUnallocated ? 1 : 0);

              return (
                <div
                  key={cat.id}
                  className="rounded-xl bg-card p-3 ring-1 ring-border/50"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={allocations[cat.id] ?? ""}
                        placeholder="0"
                        onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                        className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">€</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOverSpent ? "bg-destructive" : isUnallocated ? "bg-warning" : "bg-primary"
                        )}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        isOverSpent ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {spent.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} dépensé
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {saving && (
            <p className="mt-3 text-center text-xs text-muted-foreground">Enregistrement…</p>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
