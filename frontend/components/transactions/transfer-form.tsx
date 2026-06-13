"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format, parseISO, type Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ArrowDown, CalendarIcon, PiggyBank, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PiggyMark } from "@/components/kash-piggy";
import { createTransfer } from "@/lib/api";
import type { Account, SavingsAccountAPI, TransferKind } from "@/types/api";

const DATE_FNS_LOCALES: Record<string, Locale> = { en: enUS, fr };

interface LegOption {
  id: string;
  name: string;
  kind: TransferKind;
}

const KIND_ICON: Record<TransferKind, React.ElementType> = {
  courant: Wallet,
  epargne: PiggyBank,
};

function LegPicker({ options, value, onSelect, label, exclude }: {
  options: LegOption[];
  value: string;
  onSelect: (id: string) => void;
  label: string;
  exclude?: string;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.filter((o) => o.id !== exclude).map((o) => {
          const Icon = KIND_ICON[o.kind];
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? "border-foreground bg-muted" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              style={active ? undefined : { background: "var(--bg-sunk)" }}
            >
              <Icon className="h-3.5 w-3.5" />
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export interface TransferFormProps {
  variant: "mobile" | "desktop";
  /** The shared 3-way Dépense / Revenu / Transfert toggle. */
  toggle: React.ReactNode;
  comptes: Account[];
  epargnes: SavingsAccountAPI[];
  onSuccess: () => void;
  onClose?: () => void;
}

export function TransferForm({ variant, toggle, comptes, epargnes, onSuccess, onClose }: TransferFormProps) {
  const t = useTranslations("transactions.form");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? enUS;

  // Courant first, then épargne — matches the "≥1 courant" rule reading order.
  const options: LegOption[] = [
    ...comptes.map((c) => ({ id: c.id, name: c.name, kind: "courant" as const })),
    ...epargnes.map((e) => ({ id: e.id, name: e.name, kind: "epargne" as const })),
  ];

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromOpt = options.find((o) => o.id === fromId);
  const toOpt = options.find((o) => o.id === toId);
  const amt = parseFloat(amount);
  const oneCourant = fromOpt?.kind === "courant" || toOpt?.kind === "courant";
  const distinct = !!fromId && !!toId && fromId !== toId;
  const valid = !!fromOpt && !!toOpt && distinct && oneCourant && !isNaN(amt) && amt > 0;

  async function submit() {
    if (!valid || !fromOpt || !toOpt) {
      if (fromId && toId && !distinct) setError(t("transferDifferent"));
      else if (fromOpt && toOpt && !oneCourant) setError(t("transferNeedsCourant"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createTransfer({
        from_kind: fromOpt.kind, from_id: fromId,
        to_kind: toOpt.kind, to_id: toId,
        amount: amt, date,
      });
      onSuccess();
    } catch {
      setError(t("submitError"));
      setSubmitting(false);
    }
  }

  const isMobile = variant === "mobile";

  return (
    <div className="bg-background">
      {/* Header */}
      {isMobile ? (
        <div className="mb-1.5 flex justify-center pt-3.5">
          <div className="h-[5px] w-11 rounded-full bg-border" />
        </div>
      ) : null}
      <div className={cn("flex items-center justify-between border-b", isMobile ? "px-5 py-3" : "px-[22px] py-3.5")}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]" style={{ background: "var(--ink)", color: "var(--pig)" }}>
            <PiggyMark size={22} />
          </div>
          <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">{t("transferTitle")}</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground transition-colors" style={{ background: "var(--bg-sunk)" }}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-[18px] px-5 py-[18px] lg:px-[22px]">
        {toggle}

        {/* From → To */}
        <LegPicker options={options} value={fromId} onSelect={setFromId} label={t("transferFrom")} exclude={toId} />
        <div className="flex justify-center text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
        </div>
        <LegPicker options={options} value={toId} onSelect={setToId} label={t("transferTo")} exclude={fromId} />

        {/* Amount */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("amount")}</div>
          <div className="flex items-baseline gap-2 rounded-[14px] px-4 py-3.5" style={{ background: "var(--bg-elev)", border: "1.5px solid var(--ink)" }}>
            <span className="font-display text-[22px] text-muted-foreground">€</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent font-display text-[38px] font-medium tracking-[-0.03em] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">EUR</span>
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("date")}</div>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between rounded-[10px] border px-3 py-2.5 text-[13px] transition-colors hover:border-foreground" style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}>
                <span>{format(parseISO(date), "PPP", { locale: dateFnsLocale })}</span>
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl p-0" align="start">
              <Calendar mode="single" selected={parseISO(date)} onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))} locale={dateFnsLocale} />
            </PopoverContent>
          </Popover>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-5 py-3 lg:px-[22px]" style={{ background: "var(--bg-elev)" }}>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-[10px] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground" style={{ background: "var(--bg-sunk)" }}>
            {t("cancel")}
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!valid || submitting}
          className="rounded-[10px] px-6 py-2.5 text-[13px] font-semibold text-background transition-opacity disabled:opacity-40"
          style={{ background: "var(--ink)" }}
        >
          {t("transferSubmit")}
        </button>
      </div>
    </div>
  );
}
