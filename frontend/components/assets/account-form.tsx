"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ChevronRight, Landmark, PiggyBank, TrendingUp, Home, Package, Zap, Sprout, Trash2, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = [
  "Livret A",
  "LEP",
  "LDDS",
  "Livret Jeune",
  "PEL",
  "CEL",
  "PER",
  "Assurance vie",
  "PEA",
  "Compte titres",
  "Crypto",
  "Diversification",
  "Autre",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface SavingsAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
}

type FormValues = {
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const SHORT_LABEL: Partial<Record<AccountType, string>> = {
  "Livret Jeune": "Lvrt Jeune",
  "Assurance vie": "Assur. vie",
  "Compte titres": "Titres",
  "Diversification": "Diversif.",
};

function shortLabel(t: AccountType) {
  return SHORT_LABEL[t] ?? t;
}

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountFormProps {
  account?: SavingsAccount;
  onSave: (data: Omit<SavingsAccount, "id">) => void;
  onDelete?: () => void;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountForm({ account, onSave, onDelete, onClose, variant = "desktop" }: AccountFormProps) {
  const isEdit = !!account;

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "Livret A",
      institution: account?.institution ?? "",
      balance: account?.balance ?? 0,
    },
  });

  const selectedType = watch("type");
  const balance = watch("balance");
  const TypeIcon = TYPE_ICON[selectedType];

  useEffect(() => {
    if (account) {
      setValue("name", account.name);
      setValue("type", account.type);
      setValue("institution", account.institution ?? "");
      setValue("balance", account.balance);
    }
  }, [account, setValue]);

  function onSubmit(values: FormValues) {
    if (!values.name.trim()) return;
    const bal = Number(values.balance);
    if (isNaN(bal) || bal < 0) return;
    onSave({
      name: values.name.trim(),
      type: values.type,
      institution: values.institution.trim() || undefined,
      balance: bal,
    });
  }

  const typePickerDesktop = (
    <div className="grid grid-cols-4 gap-1.5">
      {ACCOUNT_TYPES.map((t) => {
        const Icon = TYPE_ICON[t];
        const active = selectedType === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setValue("type", t)}
            className={cn(
              "flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-[10px] text-[10px] border transition-all cursor-pointer leading-tight text-center",
              active
                ? "text-background border-foreground"
                : "text-muted-foreground border-border hover:border-foreground/40"
            )}
            style={active ? { background: "var(--ink)" } : { background: "var(--bg-elev)" }}
          >
            <Icon className="h-4 w-4" />
            <span>{shortLabel(t)}</span>
          </button>
        );
      })}
    </div>
  );

  // ── DESKTOP ──────────────────────────────────────────────────────────────────

  if (variant === "desktop") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} className="bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-[22px] py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
              style={{ background: "var(--ink)", color: "var(--pig)" }}
            >
              <TypeIcon className="h-[18px] w-[18px]" style={{ color: "var(--pig)" }} />
            </div>
            <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">
              {isEdit ? "Modifier le compte" : "Nouveau compte"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "var(--bg-sunk)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left */}
          <div className="space-y-[18px] border-r px-[22px] py-[18px]">
            {/* Balance */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Solde actuel</div>
              <div
                className="flex items-baseline gap-2 rounded-[14px] px-4 py-3.5"
                style={{ background: "var(--bg-elev)", border: "1.5px solid var(--ink)" }}
              >
                <span className="font-display text-[22px] text-muted-foreground">€</span>
                <input
                  {...register("balance")}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="min-w-0 flex-1 border-none bg-transparent font-display text-[38px] font-medium tracking-[-0.03em] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">EUR</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Nom</div>
              <input
                {...register("name")}
                type="text"
                placeholder="ex. Livret A principal"
                className="w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-foreground"
                style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
              />
            </div>

            {/* Institution */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Établissement <span className="normal-case opacity-50">(optionnel)</span>
              </div>
              <input
                {...register("institution")}
                type="text"
                placeholder="ex. Boursorama, BNP Paribas…"
                className="w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-foreground"
                style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
              />
            </div>
          </div>

          {/* Right */}
          <div className="px-[22px] py-[18px]" style={{ background: "var(--bg-sunk)" }}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Type</div>
            {typePickerDesktop}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-[22px] py-3" style={{ background: "var(--bg-elev)" }}>
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-28 rounded-[10px] py-2.5 text-center text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              style={{ background: "var(--bg-sunk)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-40 rounded-[10px] py-2.5 text-[13px] font-semibold text-background transition-opacity"
              style={{ background: "var(--ink)" }}
            >
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  // ── MOBILE ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-background">
      {/* Grabber */}
      <div className="mb-1.5 flex justify-center pt-3.5">
        <div className="h-[5px] w-11 rounded-full bg-border" />
      </div>

      <div className="space-y-4 px-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="font-display text-[22px] font-medium tracking-[-0.02em]">
            {isEdit ? "Modifier le compte" : "Nouveau compte"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
            style={{ background: "var(--bg-sunk)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Large balance */}
        <div className="pb-1 pt-3 text-center">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Solde · EUR
          </div>
          <div className="flex items-end justify-center">
            <span className="font-display font-medium text-muted-foreground" style={{ fontSize: 30, lineHeight: 1, marginBottom: 8, marginRight: 2 }}>€</span>
            <input
              {...register("balance")}
              type="number"
              inputMode="decimal"
              placeholder="0"
              step="0.01"
              min="0"
              className="border-none bg-transparent text-center font-display font-medium tracking-[-0.035em] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ fontSize: 64, lineHeight: 1, width: 200, color: "var(--ink)" }}
            />
          </div>
        </div>

        {/* Row fields */}
        <div className="space-y-1.5">
          {/* Name */}
          <div
            className="flex items-center gap-3 rounded-xl border px-3 py-[11px]"
            style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]" style={{ background: "var(--bg-sunk)" }}>
              <TypeIcon className="h-[13px] w-[13px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Nom</div>
              <input
                {...register("name")}
                type="text"
                placeholder="ex. Livret A principal"
                className="w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Institution */}
          <div
            className="flex items-center gap-3 rounded-xl border px-3 py-[11px]"
            style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]" style={{ background: "var(--bg-sunk)" }}>
              <Building2 className="h-[13px] w-[13px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Établissement (optionnel)</div>
              <input
                {...register("institution")}
                type="text"
                placeholder="ex. Boursorama…"
                className="w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Type picker */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Type</div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = TYPE_ICON[t];
              const active = selectedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-all",
                    active ? "border-foreground" : "border-border hover:border-foreground/40"
                  )}
                  style={{
                    background: active ? "var(--pig)" : "var(--bg-elev)",
                    color: "var(--ink)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-0.5">
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center rounded-[14px] px-4 py-[15px] text-[14px] font-semibold text-destructive transition-colors"
              style={{ background: "var(--bg-sunk)" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] py-[15px] text-[14px] font-semibold text-muted-foreground"
            style={{ background: "var(--bg-sunk)" }}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-[2] rounded-[14px] py-[15px] text-[14px] font-semibold text-background"
            style={{ background: "var(--ink)" }}
          >
            {isEdit ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </form>
  );
}
