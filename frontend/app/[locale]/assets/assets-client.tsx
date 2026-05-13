"use client";

import { useEffect, useState } from "react";
import { Landmark, PiggyBank, TrendingUp, Home, Package, Zap, Sprout, Plus, Pencil } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountSheet } from "@/components/assets/account-sheet";
import { getSavingsAccounts, createSavingsAccount, updateSavingsAccount, deleteSavingsAccount, getNetWorthHistory } from "@/lib/api";
import type { SavingsAccount, AccountType } from "@/components/assets/account-form";
import type { NetWorthHistoryPoint } from "@/types/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AccountType, React.ElementType> = {
  "Livret A": PiggyBank,
  "LEP": PiggyBank,
  "LDDS": PiggyBank,
  "Livret Jeune": PiggyBank,
  "PEL": Home,
  "CEL": Home,
  "PER": Landmark,
  "Assurance vie": TrendingUp,
  "PEA": TrendingUp,
  "Compte titres": TrendingUp,
  "Crypto": Zap,
  "Diversification": Sprout,
  "Autre": Package,
};

const TYPE_CARD_BG: Record<AccountType, string> = {
  "Livret A": "bg-pig/15",
  "LEP": "bg-pig/15",
  "LDDS": "bg-pig/15",
  "Livret Jeune": "bg-pig/15",
  "PEL": "bg-muted",
  "CEL": "bg-muted",
  "PER": "bg-accent-soft",
  "Assurance vie": "bg-gold-soft",
  "PEA": "bg-accent-soft",
  "Compte titres": "bg-muted",
  "Crypto": "bg-warn-soft",
  "Diversification": "bg-accent-soft",
  "Autre": "bg-muted",
};

const TYPE_ICON_BG: Record<AccountType, string> = {
  "Livret A": "var(--pig)",
  "LEP": "var(--pig)",
  "LDDS": "var(--pig)",
  "Livret Jeune": "var(--pig)",
  "PEL": "var(--muted-foreground)",
  "CEL": "var(--muted-foreground)",
  "PER": "var(--accent)",
  "Assurance vie": "var(--coin)",
  "PEA": "var(--accent)",
  "Compte titres": "var(--muted-foreground)",
  "Crypto": "var(--warning)",
  "Diversification": "var(--accent)",
  "Autre": "var(--muted-foreground)",
};

const TYPE_BAR: Record<AccountType, string> = {
  "Livret A": "var(--pig)",
  "LEP": "var(--pig)",
  "LDDS": "var(--pig)",
  "Livret Jeune": "var(--pig)",
  "PEL": "var(--muted-foreground)",
  "CEL": "var(--muted-foreground)",
  "PER": "var(--accent)",
  "Assurance vie": "var(--coin)",
  "PEA": "var(--accent)",
  "Compte titres": "var(--muted-foreground)",
  "Crypto": "var(--warning)",
  "Diversification": "var(--accent)",
  "Autre": "var(--muted-foreground)",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(amount: number, locale: string): string {
  return amount.toLocaleString(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function fmtFull(amount: number, locale: string): string {
  return amount.toLocaleString(locale, { style: "currency", currency: "EUR" });
}

function computeDelta(history: NetWorthHistoryPoint[]) {
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const thirtyDaysAgo = new Date(latest.date);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ref = history.reduce((best, p) => {
    const d = Math.abs(new Date(p.date).getTime() - thirtyDaysAgo.getTime());
    const bestD = Math.abs(new Date(best.date).getTime() - thirtyDaysAgo.getTime());
    return d < bestD ? p : best;
  });

  if (ref.date === latest.date) return null;

  const delta = latest.total - ref.total;
  const pct = (delta / ref.total) * 100;
  const days = Math.round((new Date(latest.date).getTime() - new Date(ref.date).getTime()) / 86400000);
  const label = days >= 300 ? `${Math.round(days / 365)}a` : days >= 25 ? `${Math.round(days / 30)}m` : `${days}j`;

  return { delta, pct, label };
}

function computeAllocation(accounts: SavingsAccount[]) {
  const total = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  if (total === 0) return [];
  const byType = accounts.reduce<Record<string, number>>((acc, a) => {
    if (a.balance <= 0) return acc;
    acc[a.type] = (acc[a.type] ?? 0) + a.balance;
    return acc;
  }, {});
  return Object.entries(byType).map(([type, amount]) => ({
    type: type as AccountType,
    pct: Math.round((amount / total) * 100),
  }));
}

// ─── Mobile account card ──────────────────────────────────────────────────────

function AccountCardMobile({ account, onEdit }: { account: SavingsAccount; onEdit: () => void }) {
  const locale = useLocale();
  const Icon = TYPE_ICON[account.type];
  return (
    <Card
      className={cn("gap-3 p-3 cursor-pointer", TYPE_CARD_BG[account.type])}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: TYPE_ICON_BG[account.type] }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <div className={cn("font-display text-lg font-medium leading-tight tracking-tight", account.balance < 0 ? "text-destructive" : "")}>
          {fmt(account.balance, locale)}
        </div>
        <div className="text-xs font-semibold">{account.name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {account.institution ? `${account.type} · ${account.institution}` : account.type}
        </div>
      </div>
    </Card>
  );
}

// ─── Desktop accounts table row ───────────────────────────────────────────────

function AccountRowDesktop({ account, last, onEdit }: { account: SavingsAccount; last: boolean; onEdit: () => void }) {
  const locale = useLocale();
  const Icon = TYPE_ICON[account.type];
  return (
    <div
      className={cn(
        "grid items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/50",
        !last && "border-b border-border"
      )}
      style={{ gridTemplateColumns: "44px 1fr 120px 40px" }}
      onClick={onEdit}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: TYPE_ICON_BG[account.type] }}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-sm font-medium">{account.name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">
          {account.institution ? `${account.type} · ${account.institution}` : account.type}
        </div>
      </div>
      <div className={cn("text-right font-mono text-sm font-semibold", account.balance < 0 ? "text-destructive" : "")}>
        {fmtFull(account.balance, locale)}
      </div>
      <div className="flex justify-end">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetsClient() {
  const t = useTranslations("assets.list");
  const locale = useLocale();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [history, setHistory] = useState<NetWorthHistoryPoint[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsAccount | undefined>(undefined);

  useEffect(() => {
    getSavingsAccounts().then((rows) =>
      setAccounts(rows.map((r) => ({ ...r, institution: r.institution ?? undefined, type: r.type as AccountType })))
    ).catch(() => {});
    getNetWorthHistory().then(setHistory).catch(() => {});
  }, []);

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const allocation = computeAllocation(accounts);
  const delta = computeDelta(history);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(account: SavingsAccount) {
    setEditing(account);
    setSheetOpen(true);
  }

  async function handleSave(data: Omit<SavingsAccount, "id">) {
    if (editing) {
      const updated = await updateSavingsAccount(editing.id, data);
      setAccounts((prev) => prev.map((a) => a.id === editing.id ? { ...updated, institution: updated.institution ?? undefined, type: updated.type as AccountType } : a));
    } else {
      const created = await createSavingsAccount(data);
      setAccounts((prev) => [...prev, { ...created, institution: created.institution ?? undefined, type: created.type as AccountType }]);
    }
  }

  async function handleDelete() {
    if (editing) {
      await deleteSavingsAccount(editing.id);
      setAccounts((prev) => prev.filter((a) => a.id !== editing.id));
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">

        {/* ── Mobile header ── */}
        <div className="lg:hidden">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight">{t("mobileTitle")}</h1>
              <div className="font-display text-4xl font-medium tracking-tight leading-tight mt-1">
                {fmt(total, locale)}
              </div>
            </div>
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={openAdd} aria-label={t("addAria")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Desktop header ── */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">{t("desktopTitle")}</h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {t("accountCount", { count: accounts.length })}
            </p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-full" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        </div>

        {/* ── Desktop hero + allocation ── */}
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-5">
          <Card
            className="relative overflow-hidden p-5"
            style={{ background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--pig) 200%)", minHeight: 200 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent-ink/70">{t("netWorthLabel")}</p>
            <div className="mt-2 font-display text-5xl font-medium leading-none tracking-tight">{fmt(total, locale)}</div>
            {delta && (
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 font-mono text-[11px] font-semibold text-background">
                  {delta.delta >= 0 ? "↑" : "↓"} {fmt(Math.abs(delta.delta), locale)} / {delta.label}
                </span>
                <span className="inline-flex items-center rounded-full bg-background/60 px-2.5 py-0.5 font-mono text-[11px] font-semibold">
                  {delta.pct >= 0 ? "+" : ""}{delta.pct.toFixed(1)}%
                </span>
              </div>
            )}
          </Card>

          {allocation.length > 0 && (
            <Card className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("allocation")}</p>
              <div className="mt-4 flex flex-col gap-3">
                {allocation.map(({ type, pct }) => (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{type}</span>
                      <span className="font-mono font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TYPE_BAR[type] }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Mobile account grid ── */}
        {accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground lg:hidden">{t("emptyMobile")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {accounts.map((a) => (
              <AccountCardMobile key={a.id} account={a} onEdit={() => openEdit(a)} />
            ))}
          </div>
        )}

        {/* ── Desktop accounts table ── */}
        <div className="hidden lg:block">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-medium tracking-tight">{t("accountsTitle")}</h2>
            <span className="text-xs text-muted-foreground">{t("itemsCount", { count: accounts.length })}</span>
          </div>
          {accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("emptyDesktop")}</p>
          ) : (
            <Card className="gap-0 py-0">
              {accounts.map((a, i) => (
                <AccountRowDesktop key={a.id} account={a} last={i === accounts.length - 1} onEdit={() => openEdit(a)} />
              ))}
            </Card>
          )}
        </div>

      </div>

      {/* ── Sheet / Dialog ── */}
      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        account={editing}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </AppLayout>
  );
}
