"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, Check, Filter, MoreVertical, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { getTransactions, getCategories, getTransfers, getAccounts, getSavingsAccounts, deleteTransaction, deleteTransfer } from "@/lib/api";
import { CATEGORY_ICON_BY_KEY, CATEGORY_ICONS } from "@/lib/category-icons";
import { mergeCategories } from "@/lib/suggested-categories";
import { currentMonth } from "@/lib/month";
import type { Category, Transaction, Transfer } from "@/types/api";
import type { EditingTarget } from "./transaction-form";

// A list row is either a transaction or a transfer (rendered distinctly).
type Row =
  | { id: string; date: string; kind: "txn"; txn: Transaction }
  | { id: string; date: string; kind: "transfer"; transfer: Transfer };

function formatDateLabel(dateStr: string, locale: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dateStr === today) return "today";
  if (dateStr === yesterday) return "yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function groupRowsByDate(rows: Row[], locale: string): { date: string; label: string; items: Row[] }[] {
  const map: Record<string, Row[]> = {};
  for (const r of rows) {
    (map[r.date] ??= []).push(r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, label: formatDateLabel(date, locale), items }));
}

type FilterType = "all" | "expense" | "income";

/** A row queued for deletion, with display data precomputed by the list. */
interface PendingDelete {
  row: Row;
  label: string;
  amount: string;
}

/** Per-row ⋮ menu: Edit + Delete. Delete defers to the list-level confirm dialog. */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const t = useTranslations("transactions.list");
  const [open, setOpen] = useState(false);

  const itemClass = "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={t("actions")}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1.5">
        <button className={itemClass} onClick={() => { setOpen(false); onEdit(); }}>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {t("edit")}
        </button>
        <button className={cn(itemClass, "text-warning hover:bg-warn-soft")} onClick={() => { setOpen(false); onDelete(); }}>
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          {t("delete")}
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** DS-style centered confirmation modal for a destructive delete. */
function DeleteConfirmDialog({
  pending,
  onOpenChange,
  onConfirm,
}: {
  pending: PendingDelete | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations("transactions.list");
  const [deleting, setDeleting] = useState(false);
  const isTransfer = pending?.row.kind === "transfer";

  async function confirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog.Root open={!!pending} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-background shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
          {/* header — mirrors the add-transaction modal */}
          <div className="flex items-center justify-between border-b px-[22px] py-3.5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </div>
              <Dialog.Title className="font-display text-[20px] font-medium leading-tight tracking-[-0.02em]">
                {isTransfer ? t("deleteTransferTitle") : t("deleteTransactionTitle")}
              </Dialog.Title>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:text-foreground"
              style={{ background: "var(--bg-sunk)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* body */}
          <div className="space-y-3 px-[22px] py-[18px]">
            <p className="text-[13px] text-muted-foreground">{t("deleteDescription")}</p>
            {pending && (
              <div
                className="flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-3"
                style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}
              >
                <span className="truncate text-[13px] font-medium">{pending.label}</span>
                <span className="ml-3 shrink-0 font-mono text-[13px] font-semibold">{pending.amount}</span>
              </div>
            )}
          </div>

          {/* footer — mirrors the add-transaction modal */}
          <div
            className="flex items-center justify-end gap-2 border-t px-[22px] py-3"
            style={{ background: "var(--bg-elev)" }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={deleting}
              className="w-28 rounded-[10px] py-2.5 text-center text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              style={{ background: "var(--bg-sunk)" }}
            >
              {t("deleteCancel")}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={deleting}
              className="flex w-40 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "var(--warn)", color: "var(--bg)" }}
            >
              {deleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                t("delete")
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface TransactionListProps {
  refreshKey?: number;
  onAdd?: () => void;
  onEdit?: (target: EditingTarget) => void;
  /** Called after a row is deleted, so the parent can refresh sibling views. */
  onChanged?: () => void;
}

export function TransactionList({ refreshKey = 0, onAdd, onEdit, onChanged }: TransactionListProps) {
  const t = useTranslations("transactions.list");
  const td = useTranslations("dashboard");
  const locale = useLocale();
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, cats, trs, accs, sav] = await Promise.all([
        getTransactions(month), getCategories(), getTransfers(), getAccounts(), getSavingsAccounts(),
      ]);
      setTransactions(txs);
      setCategories(mergeCategories(cats));
      setTransfers(trs);
      const names: Record<string, string> = {};
      for (const a of accs) names[a.id] = a.name;
      for (const s of sav) names[s.id] = s.name;
      setAccountNames(names);
    } catch {
      setTransactions([]);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [month, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // load() flips a loading flag synchronously to show the skeleton during
    // fetch — the cascading render is intentional and cheap here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function getCategoryInfo(categoryId: string | null) {
    if (!categoryId) return { name: t("uncategorized"), Icon: Package };
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return { name: t("uncategorized"), Icon: Package };
    const Icon = (cat.icon && CATEGORY_ICON_BY_KEY[cat.icon])
      ? CATEGORY_ICON_BY_KEY[cat.icon]
      : CATEGORY_ICONS[cat.name] ?? Package;
    return { name: cat.name, Icon };
  }

  const uncategorizedCount = transactions.filter((t) => !t.category_id).length;

  const filtered = transactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => !categoryFilter || t.category_id === categoryFilter);

  const monthTransfers = transfers.filter((tr) => tr.date.startsWith(month));
  // Transfers are neither income nor expense → only shown under "all", no category filter.
  const showTransfers = typeFilter === "all" && !categoryFilter;
  const rows: Row[] = [
    ...filtered.map((txn) => ({ id: txn.id, date: txn.date, kind: "txn" as const, txn })),
    ...(showTransfers ? monthTransfers.map((tr) => ({ id: tr.id, date: tr.date, kind: "transfer" as const, transfer: tr })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const rowGroups = groupRowsByDate(rows, locale);

  function formatAmount(t: Transaction) {
    const sign = t.type === "expense" ? "−" : "+";
    return sign + t.amount.toLocaleString(locale, { style: "currency", currency: "EUR" });
  }

  function transferLabel(tr: Transfer) {
    return `${accountNames[tr.from_id] ?? "—"} → ${accountNames[tr.to_id] ?? "—"}`;
  }

  function fmtCurrency(amount: number) {
    return amount.toLocaleString(locale, { style: "currency", currency: "EUR" });
  }

  function handleEdit(row: Row) {
    onEdit?.(
      row.kind === "txn"
        ? { kind: "txn", txn: row.txn }
        : { kind: "transfer", transfer: row.transfer },
    );
  }

  function requestDelete(row: Row) {
    const summary: PendingDelete =
      row.kind === "txn"
        ? { row, label: getCategoryInfo(row.txn.category_id).name, amount: formatAmount(row.txn) }
        : { row, label: transferLabel(row.transfer), amount: fmtCurrency(row.transfer.amount) };
    setPendingDelete(summary);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { row } = pendingDelete;
    if (row.kind === "transfer") await deleteTransfer(row.id);
    else await deleteTransaction(row.id);
    setPendingDelete(null);
    toast.success(t("deleteSuccess"));
    await load();
    onChanged?.();
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

  const typeFilters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "expense", label: t("expenses") },
    { key: "income", label: t("income") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header: title + month nav ────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">{td("title")}</h1>
            {!loading && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {td("thisMonth", { count: transactions.length })}
                {uncategorizedCount > 0 && ` · ${td("uncategorized", { count: uncategorizedCount })}`}
              </p>
            )}
          </div>
          {/* Add button (mobile only; desktop add sits in the month switcher endSlot) */}
          <Button
            size="icon"
            onClick={onAdd}
            className="h-10 w-10 shrink-0 rounded-xl lg:hidden"
            aria-label={td("addAria")}
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
              {td("add")}
            </Button>
          }
        />
      </div>

      {/* ── Filter row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {typeFilters.map(({ key, label }) => (
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
              {activeCategoryName ?? t("filters")}
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
              {t("allCategories")}
            </button>
            {visibleCategories.map((cat) => {
              const isActive = categoryFilter === cat.id;
              const Icon = (cat.icon && CATEGORY_ICON_BY_KEY[cat.icon])
                ? CATEGORY_ICON_BY_KEY[cat.icon]
                : CATEGORY_ICONS[cat.name] ?? Package;
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
        <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          {/* ── Desktop: table ─────────────────────────────── */}
          <div className="hidden lg:block">
            <div
              className="grid gap-3.5 px-3.5 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              style={{ gridTemplateColumns: "130px 1fr 110px 36px" }}
            >
              <span>{t("date")}</span>
              <span>{t("category")}</span>
              <span className="text-right">{t("amount")}</span>
              <span />
            </div>
            <Card className="gap-0 py-0">
              {rows.map((row, i) => {
                const border = i < rows.length - 1 && "border-b border-border";
                if (row.kind === "transfer") {
                  const tr = row.transfer;
                  return (
                    <div
                      key={tr.id}
                      className={cn("grid items-center gap-3.5 px-3.5 py-3.5", border)}
                      style={{ gridTemplateColumns: "130px 1fr 110px 36px" }}
                    >
                      <p className="text-[13px] font-medium">{formatDateShort(tr.date, locale)}</p>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </div>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-[13px] font-medium">{t("transfer")}</span>
                          <span className="truncate font-mono text-[11px] text-muted-foreground">{transferLabel(tr)}</span>
                        </span>
                      </div>
                      <div className="text-right font-mono text-[13px] font-semibold text-muted-foreground">
                        {fmtCurrency(tr.amount)}
                      </div>
                      <div className="flex justify-end">
                        <RowActions onEdit={() => handleEdit(row)} onDelete={() => requestDelete(row)} />
                      </div>
                    </div>
                  );
                }
                const tx = row.txn;
                const { name, Icon } = getCategoryInfo(tx.category_id);
                return (
                  <div
                    key={tx.id}
                    className={cn("grid items-center gap-3.5 px-3.5 py-3.5", border)}
                    style={{ gridTemplateColumns: "130px 1fr 110px 36px" }}
                  >
                    <p className="text-[13px] font-medium">{formatDateShort(tx.date, locale)}</p>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                        tx.type === "expense" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-[13px] font-medium">{name}</span>
                    </div>
                    <div className={cn(
                      "text-right font-mono text-[13px] font-semibold",
                      tx.type === "expense" ? "text-foreground" : "text-success"
                    )}>
                      {formatAmount(tx)}
                    </div>
                    <div className="flex justify-end">
                      <RowActions onEdit={() => handleEdit(row)} onDelete={() => requestDelete(row)} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* ── Mobile: grouped list ───────────────────────── */}
          <div className="flex flex-col gap-4 lg:hidden">
            {rowGroups.map(({ date, label, items }) => (
              <div key={date}>
                <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {items.map((row) => {
                    if (row.kind === "transfer") {
                      const tr = row.transfer;
                      return (
                        <li key={tr.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                          <div className="flex flex-1 items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
                              <ArrowLeftRight className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="truncate text-sm font-medium">{t("transfer")}</span>
                              <span className="truncate font-mono text-[11px] text-muted-foreground">{transferLabel(tr)}</span>
                            </div>
                          </div>
                          <span className="ml-3 shrink-0 font-mono text-sm font-semibold text-muted-foreground">
                            {fmtCurrency(tr.amount)}
                          </span>
                          <div className="ml-1 shrink-0">
                            <RowActions onEdit={() => handleEdit(row)} onDelete={() => requestDelete(row)} />
                          </div>
                        </li>
                      );
                    }
                    const tx = row.txn;
                    const { name, Icon } = getCategoryInfo(tx.category_id);
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center",
                            tx.type === "expense" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate text-sm font-medium">{name}</span>
                          </div>
                        </div>
                        <span className={cn(
                          "ml-3 shrink-0 font-mono text-sm font-semibold",
                          tx.type === "expense" ? "text-foreground" : "text-success"
                        )}>
                          {formatAmount(tx)}
                        </span>
                        <div className="ml-1 shrink-0">
                          <RowActions onEdit={() => handleEdit(row)} onDelete={() => requestDelete(row)} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <DeleteConfirmDialog
        pending={pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
