"use client";

import { Landmark, PiggyBank, TrendingUp, Home, Package } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "Livret A" | "LEP" | "CEL" | "PEL" | "Fonds euros" | "Autre";

interface SavingsAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS: SavingsAccount[] = [
  { id: "1", name: "Livret A", type: "Livret A", balance: 22950, institution: "Caisse d'Épargne" },
  { id: "2", name: "LEP", type: "LEP", balance: 10000, institution: "La Banque Postale" },
  { id: "3", name: "Assurance vie", type: "Fonds euros", balance: 15230, institution: "Boursorama" },
  { id: "4", name: "PEL", type: "PEL", balance: 8200, institution: "BNP Paribas" },
];

const MOCK_DELTA = 3420;
const MOCK_DELTA_PCT = 6.3;

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AccountType, React.ElementType> = {
  "Livret A": PiggyBank,
  "LEP": Landmark,
  "CEL": Home,
  "PEL": Home,
  "Fonds euros": TrendingUp,
  "Autre": Package,
};

const TYPE_CARD_BG: Record<AccountType, string> = {
  "Livret A": "bg-pig/15",
  "LEP": "bg-accent-soft",
  "CEL": "bg-muted",
  "PEL": "bg-muted",
  "Fonds euros": "bg-gold-soft",
  "Autre": "bg-muted",
};

const TYPE_ICON_BG: Record<AccountType, string> = {
  "Livret A": "var(--pig)",
  "LEP": "var(--accent)",
  "CEL": "var(--muted-foreground)",
  "PEL": "var(--muted-foreground)",
  "Fonds euros": "var(--coin)",
  "Autre": "var(--muted-foreground)",
};

const TYPE_BAR: Record<AccountType, string> = {
  "Livret A": "var(--pig)",
  "LEP": "var(--accent)",
  "CEL": "var(--muted-foreground)",
  "PEL": "var(--muted-foreground)",
  "Fonds euros": "var(--coin)",
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
  const byType = accounts.reduce<Record<string, number>>((acc, a) => {
    if (a.balance <= 0) return acc;
    acc[a.type] = (acc[a.type] ?? 0) + a.balance;
    return acc;
  }, {});
  return Object.entries(byType).map(([type, amount]) => ({
    type: type as AccountType,
    pct: Math.round((amount / total) * 100),
    amount,
  }));
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

function AccountCardMobile({ account }: { account: SavingsAccount }) {
  const Icon = TYPE_ICON[account.type];
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border p-3", TYPE_CARD_BG[account.type])}>
      <div className="flex items-start justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: TYPE_ICON_BG[account.type] }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div>
        <div
          className={cn(
            "font-display text-lg font-medium leading-tight tracking-tight",
            account.balance < 0 ? "text-destructive" : ""
          )}
        >
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

function AccountRowDesktop({ account, last }: { account: SavingsAccount; last: boolean }) {
  const Icon = TYPE_ICON[account.type];
  return (
    <div
      className={cn(
        "grid items-center gap-4 px-4 py-3.5",
        !last && "border-b border-border"
      )}
      style={{ gridTemplateColumns: "44px 1fr 120px" }}
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
      <div
        className={cn(
          "text-right font-mono text-sm font-semibold",
          account.balance < 0 ? "text-destructive" : ""
        )}
      >
        {fmtFull(account.balance)}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetsClient() {
  const accounts = MOCK_ACCOUNTS;
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const allocation = computeAllocation(accounts);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">

        {/* ── Mobile header ── */}
        <div className="lg:hidden">
          <h1 className="font-display text-2xl font-medium tracking-tight">Net worth</h1>
          <div className="font-display text-4xl font-medium tracking-tight leading-tight mt-1">
            {fmt(total)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-ink">
              +{fmt(MOCK_DELTA)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              30j · +{MOCK_DELTA_PCT}%
            </span>
          </div>
        </div>

        {/* ── Desktop header ── */}
        <div className="hidden lg:block">
          <h1 className="font-display text-2xl font-medium tracking-tight">Patrimoine</h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {accounts.length} compte{accounts.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Mobile sparkline ── */}
        <div className="rounded-2xl border border-border bg-card p-4 lg:hidden">
          <Sparkline className="h-20 w-full" />
        </div>

        {/* ── Desktop hero + allocation ── */}
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-5">
          {/* Hero */}
          <div
            className="relative overflow-hidden rounded-2xl border border-border p-5"
            style={{ background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--pig) 200%)", minHeight: 200 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent-ink/70">
              Net worth · EUR
            </p>
            <div className="mt-2 font-display text-5xl font-medium leading-none tracking-tight">
              {fmt(total)}
            </div>
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

          {/* Allocation */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Répartition
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {allocation.map(({ type, pct }) => (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{type}</span>
                    <span className="font-mono font-semibold">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: TYPE_BAR[type] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mobile account grid ── */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {accounts.map((a) => (
            <AccountCardMobile key={a.id} account={a} />
          ))}
        </div>

        {/* ── Desktop accounts table ── */}
        <div className="hidden lg:block">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-medium tracking-tight">Comptes</h2>
            <span className="text-xs text-muted-foreground">
              {accounts.length} poste{accounts.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {accounts.map((a, i) => (
              <AccountRowDesktop key={a.id} account={a} last={i === accounts.length - 1} />
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
