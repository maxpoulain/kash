"use client";

import { useState } from "react";
import { Landmark, PiggyBank, TrendingUp, Home, Package, Zap, Sprout, Plus, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountSheet } from "@/components/assets/account-sheet";
import type { SavingsAccount, AccountType } from "@/components/assets/account-form";

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_ACCOUNTS: SavingsAccount[] = [
  { id: "1", name: "Livret A", type: "Livret A", balance: 22950, institution: "Caisse d'Épargne" },
  { id: "2", name: "LEP", type: "LEP", balance: 10000, institution: "La Banque Postale" },
  { id: "3", name: "Assurance vie", type: "Assurance vie", balance: 15230, institution: "Boursorama" },
  { id: "4", name: "PEL", type: "PEL", balance: 8200, institution: "BNP Paribas" },
];

const MOCK_DELTA = 3420;
const MOCK_DELTA_PCT = 6.3;

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

function fmt(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function fmtFull(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
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

function generateId() {
  return Math.random().toString(36).slice(2);
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 80" className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,62 C25,58 45,44 75,46 C105,48 125,32 155,26 C185,20 215,34 245,22 C265,14 285,18 300,10 L300,80 L0,80 Z"
        fill="url(#spark-fill)"
      />
      <path
        d="M0,62 C25,58 45,44 75,46 C105,48 125,32 155,26 C185,20 215,34 245,22 C265,14 285,18 300,10"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="300" cy="10" r="3.5" fill="var(--accent)" />
      <circle cx="300" cy="10" r="7" fill="var(--accent)" opacity="0.2" />
    </svg>
  );
}

// ─── Mobile account card ──────────────────────────────────────────────────────

function AccountCardMobile({ account, onEdit }: { account: SavingsAccount; onEdit: () => void }) {
  const Icon = TYPE_ICON[account.type];
  return (
    <div
      className={cn("flex flex-col gap-3 rounded-2xl border border-border p-3 cursor-pointer", TYPE_CARD_BG[account.type])}
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
          {fmt(account.balance)}
        </div>
        <div className="text-xs font-semibold">{account.name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {account.institution ? `${account.type} · ${account.institution}` : account.type}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop accounts table row ───────────────────────────────────────────────

function AccountRowDesktop({ account, last, onEdit }: { account: SavingsAccount; last: boolean; onEdit: () => void }) {
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
        {fmtFull(account.balance)}
      </div>
      <div className="flex justify-end">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetsClient() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>(INITIAL_ACCOUNTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsAccount | undefined>(undefined);

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const allocation = computeAllocation(accounts);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(account: SavingsAccount) {
    setEditing(account);
    setSheetOpen(true);
  }

  function handleSave(data: Omit<SavingsAccount, "id">) {
    if (editing) {
      setAccounts((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...data } : a));
    } else {
      setAccounts((prev) => [...prev, { id: generateId(), ...data }]);
    }
  }

  function handleDelete() {
    if (editing) {
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
              <h1 className="font-display text-2xl font-medium tracking-tight">Net worth</h1>
              <div className="font-display text-4xl font-medium tracking-tight leading-tight mt-1">
                {fmt(total)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-ink">
                  +{fmt(MOCK_DELTA)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">30j · +{MOCK_DELTA_PCT}%</span>
              </div>
            </div>
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={openAdd} aria-label="Ajouter un compte">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Desktop header ── */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Patrimoine</h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {accounts.length} compte{accounts.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-full" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Ajouter un compte
          </Button>
        </div>

        {/* ── Mobile sparkline ── */}
        <div className="rounded-2xl border border-border bg-card p-4 lg:hidden">
          <Sparkline className="h-20 w-full" />
        </div>

        {/* ── Desktop hero + allocation ── */}
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-5">
          <div
            className="relative overflow-hidden rounded-2xl border border-border p-5"
            style={{ background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--pig) 200%)", minHeight: 200 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent-ink/70">Net worth · EUR</p>
            <div className="mt-2 font-display text-5xl font-medium leading-none tracking-tight">{fmt(total)}</div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-foreground px-2.5 py-1 font-mono text-[11px] font-semibold text-background">
                ↑ {fmt(MOCK_DELTA)} / 30j
              </span>
              <span className="rounded-full bg-card px-2.5 py-1 font-mono text-[11px] font-semibold">
                +{MOCK_DELTA_PCT}%
              </span>
            </div>
            <Sparkline className="absolute bottom-4 right-4 h-14 w-64 opacity-60" />
          </div>

          {allocation.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Répartition</p>
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
            </div>
          )}
        </div>

        {/* ── Mobile account grid ── */}
        {accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground lg:hidden">Aucun compte. Ajoutez-en un !</p>
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
            <h2 className="font-display text-lg font-medium tracking-tight">Comptes</h2>
            <span className="text-xs text-muted-foreground">{accounts.length} poste{accounts.length > 1 ? "s" : ""}</span>
          </div>
          {accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun compte. Cliquez sur &ldquo;Ajouter un compte&rdquo;.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {accounts.map((a, i) => (
                <AccountRowDesktop key={a.id} account={a} last={i === accounts.length - 1} onEdit={() => openEdit(a)} />
              ))}
            </div>
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
