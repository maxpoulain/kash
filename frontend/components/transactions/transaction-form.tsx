"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, type Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  ArrowLeftRight,
  CalendarIcon,
  ChevronRight,
  Minus,
  Package,
  Plus,
  Repeat,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PiggyMark } from "@/components/kash-piggy";
import { getCategories, createTransaction, updateTransaction, createRecurringTransaction, getAccounts, getSavingsAccounts } from "@/lib/api";
import type { Account, Category, SavingsAccountAPI, Transaction, TransactionType, Transfer } from "@/types/api";
import { TransferForm } from "./transfer-form";

type Mode = "txn" | "transfer";

const DATE_FNS_LOCALES: Record<string, Locale> = {
  en: enUS,
  fr,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Package;
  return <Icon className={className} />;
}

function PiggyPreview({ amount, isIncome }: { amount: number | undefined; isIncome: boolean }) {
  const t = useTranslations("transactions.form");
  const val = amount && !isNaN(amount) && amount > 0 ? amount : 0;
  return (
    <div
      className="relative rounded-[18px] p-[18px] overflow-hidden"
      style={{
        background: isIncome
          ? "linear-gradient(135deg, var(--accent-soft), var(--pig) 220%)"
          : "var(--pig)",
      }}
    >
      <div className="relative z-10 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
          style={{ background: "var(--ink)", color: "var(--pig)", boxShadow: "var(--shadow-sm)" }}
        >
          <PiggyMark size={28} />
        </div>
        <div>
          <div
            className="text-[10px] font-mono tracking-[0.12em] uppercase"
            style={{ color: "var(--pig-shadow)" }}
          >
            {isIncome ? t("piggyGains") : t("piggySpends")}
          </div>
          <div
            className="font-display text-[26px] font-semibold tracking-[-0.02em] leading-tight"
            style={{ color: "var(--ink)" }}
          >
            {isIncome ? "+" : "−"}€{val > 0 ? val.toFixed(2) : "0.00"}
          </div>
        </div>
      </div>
      {/* decorative coins */}
      <div className="absolute -bottom-1.5 -right-1.5 flex gap-1 opacity-55">
        <div className="w-[22px] h-[7px] rounded-[3px]" style={{ background: "var(--gold)" }} />
        <div className="w-[22px] h-[7px] rounded-[3px]" style={{ background: "var(--gold-soft)" }} />
      </div>
      <div className="absolute bottom-1.5 right-8 flex gap-1 opacity-70">
        <div className="w-[18px] h-[6px] rounded-[3px]" style={{ background: "var(--gold)" }} />
      </div>
    </div>
  );
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("amountPositive"),
  category_id: z.string().uuid("selectCategory"),
  account_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
  note: z.string().max(200).optional(),
  repeat: z.enum(["once", "weekly", "monthly"]).optional(),
});

type FormValues = z.infer<typeof schema>;

/** When set, the form edits an existing entry instead of creating one. */
export type EditingTarget =
  | { kind: "txn"; txn: Transaction }
  | { kind: "transfer"; transfer: Transfer };

export interface TransactionFormProps {
  onSuccess: (kind?: "transaction" | "transfer") => void;
  onClose?: () => void;
  variant?: "mobile" | "desktop";
  editing?: EditingTarget;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const SHORT_LABEL: Record<string, string> = {
  "Investissement": "Invest.",
  "Abonnements": "Abonn.",
  "Restaurants": "Restau.",
};

function shortLabel(name: string) {
  return SHORT_LABEL[name] ?? name;
}

export function TransactionForm({ onSuccess, onClose, variant = "mobile", editing }: TransactionFormProps) {
  const t = useTranslations("transactions.form");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? enUS;
  const editingTxn = editing?.kind === "txn" ? editing.txn : undefined;
  const editingTransfer = editing?.kind === "transfer" ? editing.transfer : undefined;
  const isEditTxn = !!editingTxn;
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [epargnes, setEpargnes] = useState<SavingsAccountAPI[]>([]);
  const [mode, setMode] = useState<Mode>(editingTransfer ? "transfer" : "txn");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editingTxn
      ? {
          type: editingTxn.type,
          amount: editingTxn.amount,
          category_id: editingTxn.category_id ?? undefined,
          date: editingTxn.date,
          note: editingTxn.note ?? undefined,
          repeat: "once",
        }
      : { type: "expense", date: today(), repeat: "once" },
  });

  const selectedType = watch("type") as TransactionType;
  const selectedCategoryId = watch("category_id");
  const selectedDate = watch("date");
  const amount = watch("amount");
  const isIncome = selectedType === "income";
  const repeat = watch("repeat") ?? "once";
  const isRecurring = repeat !== "once";


  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getAccounts()
      .then((rows) => {
        setAccounts(rows);
        // Edit: keep the txn's account; create: pre-fill the principal (oldest).
        const preselect = editingTxn?.account_id ?? rows[0]?.id;
        if (preselect) setValue("account_id", preselect);
      })
      .catch(() => setAccounts([]));
    getSavingsAccounts()
      .then(setEpargnes)
      .catch(() => setEpargnes([]));
  }, [setValue, editingTxn]);

  const selectedAccountId = watch("account_id");

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      if (editingTxn) {
        await updateTransaction(editingTxn.id, {
          amount: values.amount,
          type: values.type,
          category_id: values.category_id,
          account_id: values.account_id,
          date: values.date,
          note: values.note,
        });
        onSuccess();
        return;
      }
      if (values.repeat && values.repeat !== "once") {
        await createRecurringTransaction({
          amount: values.amount,
          type: values.type,
          category_id: values.category_id,
          note: values.note?.trim() || null,
          frequency: values.repeat,
          start_date: values.date,
        });
      } else {
        await createTransaction({
          amount: values.amount,
          type: values.type,
          category_id: values.category_id,
          account_id: values.account_id,
          date: values.date,
          note: values.note,
        });
      }
      onSuccess();
    } catch {
      setSubmitError(t("submitError"));
    }
  }

  const typeToggle = (
    <div className={cn("grid gap-1.5 p-1 bg-muted rounded-[12px]", isEditTxn ? "grid-cols-2" : "grid-cols-3")}>
      {(["expense", "income"] as TransactionType[]).map((txType) => {
        const active = mode === "txn" && selectedType === txType;
        return (
          <button
            key={txType}
            type="button"
            onClick={() => { setMode("txn"); setValue("type", txType); }}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[8px] py-2.5 text-[13px] font-semibold transition-all",
              active ? "text-white" : "text-muted-foreground hover:text-foreground/70"
            )}
            style={active ? { background: txType === "expense" ? "var(--ink)" : "var(--accent)" } : {}}
          >
            {txType === "expense" ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {txType === "expense" ? t("expense") : t("income")}
          </button>
        );
      })}
      {!isEditTxn && (
        <button
          type="button"
          onClick={() => setMode("transfer")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-[8px] py-2.5 text-[13px] font-semibold transition-all",
            mode === "transfer" ? "text-white" : "text-muted-foreground hover:text-foreground/70"
          )}
          style={mode === "transfer" ? { background: "var(--ink)" } : {}}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {t("transfer")}
        </button>
      )}
    </div>
  );

  const datePickerContent = (
    <>
      <Calendar
        mode="single"
        selected={selectedDate ? parseISO(selectedDate) : undefined}
        onSelect={(d) => d && setValue("date", format(d, "yyyy-MM-dd"))}
        disabled={isRecurring ? undefined : { after: new Date() }}
        endMonth={isRecurring ? undefined : new Date()}
        locale={dateFnsLocale}
      />
      <div className="border-t p-2">
        <button
          type="button"
          className="w-full text-sm text-center py-1.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setValue("date", today())}
        >
          {t("today")}
        </button>
      </div>
    </>
  );

  const repeatSegment = (
    <div className="grid grid-cols-3 gap-1.5 rounded-[12px] bg-muted p-1">
      {(["once", "weekly", "monthly"] as const).map((opt) => {
        const active = repeat === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setValue("repeat", opt)}
            className={cn(
              "rounded-[8px] py-2.5 text-[13px] font-semibold transition-all",
              active ? "text-background" : "text-muted-foreground hover:text-foreground/70"
            )}
            style={active ? { background: "var(--ink)" } : {}}
          >
            {t(opt)}
          </button>
        );
      })}
    </div>
  );

  // Desktop: label above the segment (matches the amount/date/note fields).
  const recurringSection = (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("repeat")}</div>
      {repeatSegment}
    </div>
  );

  // Mobile: icon on the left, label + segment stacked to its right (matches the date/note rows).
  const recurringRowMobile = (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-[11px]" style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}>
      <div className="flex h-7 w-7 items-center justify-center rounded-[7px] shrink-0" style={{ background: "var(--bg-sunk)" }}>
        <Repeat className="h-[13px] w-[13px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t("repeat")}</div>
        <div className="mt-1.5">{repeatSegment}</div>
      </div>
    </div>
  );

  // Account selector — only shown when the household has more than one account
  // (with a single account the backend defaults to the principal).
  const accountSegment = (
    <div className="flex flex-wrap gap-1.5">
      {accounts.map((a) => {
        const active = selectedAccountId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => setValue("account_id", a.id)}
            className={cn(
              "rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-colors border",
              active ? "border-foreground bg-muted" : "border-transparent bg-[var(--bg-sunk)] text-muted-foreground hover:text-foreground",
            )}
          >
            {a.name}
          </button>
        );
      })}
    </div>
  );

  const accountSection = (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("account")}</div>
      {accountSegment}
    </div>
  );

  const accountRowMobile = (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-[11px]" style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}>
      <div className="flex h-7 w-7 items-center justify-center rounded-[7px] shrink-0" style={{ background: "var(--bg-sunk)" }}>
        <Wallet className="h-[13px] w-[13px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t("account")}</div>
        <div className="mt-1.5">{accountSegment}</div>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // TRANSFER — dedicated body, shares the 3-way toggle and modal chrome.
  // -------------------------------------------------------------------------
  if (mode === "transfer") {
    return (
      <TransferForm
        variant={variant}
        toggle={editingTransfer ? undefined : typeToggle}
        comptes={accounts}
        epargnes={epargnes}
        initial={editingTransfer}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );
  }

  // -------------------------------------------------------------------------
  // DESKTOP
  // -------------------------------------------------------------------------
  if (variant === "desktop") {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
        className="bg-background"
      >
        {/* header */}
        <div className="px-[22px] py-3.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: "var(--ink)", color: "var(--pig)" }}
            >
              <PiggyMark size={22} />
            </div>
            <div>
              <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">
                {isEditTxn ? t("desktopEditTitle") : t("desktopTitle")}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "var(--bg-sunk)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* body — 2 columns */}
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* left */}
          <div className="px-[22px] py-[18px] border-r space-y-[18px]">
            {typeToggle}

            {/* amount */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
                {t("amount")}
              </div>
              <div
                className="flex items-baseline gap-2 rounded-[14px] px-4 py-3.5"
                style={{ background: "var(--bg-elev)", border: "1.5px solid var(--ink)" }}
              >
                <span className="font-display text-[22px] text-muted-foreground">€</span>
                <input
                  {...register("amount", { valueAsNumber: true })}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  step="0.01"
                  min="0.01"
                  className="flex-1 bg-transparent border-none outline-none font-display text-[38px] font-medium tracking-[-0.03em] text-foreground min-w-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-mono text-[11px] text-muted-foreground tracking-[0.1em]">EUR</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue("amount", v)}
                    className="px-2.5 py-1 text-[11px] border rounded-full text-muted-foreground font-mono hover:border-foreground hover:text-foreground transition-colors"
                    style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
                  >
                    €{v}
                  </button>
                ))}
              </div>
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">{t(errors.amount.message as string)}</p>
              )}
            </div>

            {/* date */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
                {t("date")}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-[10px] border hover:border-foreground transition-colors"
                    style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
                  >
                    <span>
                      {selectedDate
                        ? format(parseISO(selectedDate), "PPP", { locale: dateFnsLocale })
                        : t("today")}
                    </span>
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  {datePickerContent}
                </PopoverContent>
              </Popover>
            </div>

            {accounts.length > 1 && accountSection}
            {!isEditTxn && recurringSection}

            {/* note */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
                {t("note")}
              </div>
              <textarea
                {...register("note")}
                rows={2}
                placeholder={t("notePlaceholder")}
                className="w-full px-3 py-2.5 border rounded-[10px] text-[13px] resize-none outline-none focus:border-foreground transition-colors font-sans"
                style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
              />
            </div>
          </div>

          {/* right */}
          <div
            className="px-[22px] py-[18px] flex flex-col gap-[18px]"
            style={{ background: "var(--bg-sunk)" }}
          >
            <PiggyPreview amount={amount} isIncome={isIncome} />

            <div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
                {t("category")}
              </div>
              {errors.category_id && (
                <p className="text-destructive text-xs mb-2">{t(errors.category_id.message as string)}</p>
              )}
              <div className="grid grid-cols-4 gap-1.5">
                {filteredCategories.map((c) => {
                  const active = c.id === selectedCategoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setValue("category_id", c.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-[10px] text-[10px] border transition-all cursor-pointer leading-tight text-center",
                        active
                          ? "text-background border-foreground"
                          : "text-muted-foreground border-border hover:border-foreground/40"
                      )}
                      style={active ? { background: "var(--ink)" } : { background: "var(--bg-elev)" }}
                    >
                      <CategoryIcon name={c.name} className="w-4 h-4" />
                      <span>{shortLabel(c.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          className="px-[22px] py-3 border-t flex items-center justify-between"
          style={{ background: "var(--bg-elev)" }}
        >
          <div />
          <div className="flex items-center gap-2">
            {submitError && (
              <p role="alert" className="text-destructive text-xs mr-2">{submitError}</p>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-28 py-2.5 rounded-[10px] text-muted-foreground font-medium text-[13px] hover:text-foreground transition-colors text-center"
                style={{ background: "var(--bg-sunk)" }}
              >
                {t("cancel")}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-40 py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
              style={{
                background: isIncome ? "var(--accent)" : "var(--ink)",
                color: isIncome ? "var(--accent-foreground)" : "var(--bg)",
              }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditTxn ? (
                t("saveChanges")
              ) : (
                <>{isRecurring ? t("addRecurring") : isIncome ? t("addIncome") : t("addExpense")}</>
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------------------
  // MOBILE (default)
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-background">
      {/* grabber */}
      <div className="flex justify-center pt-3.5 mb-1.5">
        <div className="w-11 h-[5px] rounded-full bg-border" />
      </div>

      <div className="px-5 pb-7 space-y-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="font-display text-[22px] font-medium tracking-[-0.02em]">
            {isEditTxn ? t("mobileEditTitle") : t("mobileTitle")}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground shrink-0"
              style={{ background: "var(--bg-sunk)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {typeToggle}

        {/* large amount display */}
        <div className="text-center pt-3 pb-1">
          <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-1.5">
            {t("amount")} · EUR
          </div>
          <div className="flex items-end justify-center">
            <span
              className="font-display font-medium text-muted-foreground"
              style={{ fontSize: 30, lineHeight: 1, marginBottom: 8, marginRight: 2 }}
            >
              €
            </span>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              inputMode="decimal"
              placeholder="0"
              step="0.01"
              min="0.01"
              className="font-display font-medium tracking-[-0.035em] bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ fontSize: 64, lineHeight: 1, width: 180, color: "var(--ink)" }}
            />
          </div>
          {errors.amount && (
            <p className="text-destructive text-xs mt-1">{t(errors.amount.message as string)}</p>
          )}
        </div>

        {/* piggy preview */}
        <PiggyPreview amount={amount} isIncome={isIncome} />

        {/* category chips */}
        <div>
          <div className="mb-2">
            <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase">
              {t("category")}
            </div>
          </div>
          {errors.category_id && (
            <p className="text-destructive text-xs mb-1">{t(errors.category_id.message as string)}</p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {filteredCategories.map((c) => {
              const active = c.id === selectedCategoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue("category_id", c.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium whitespace-nowrap shrink-0 transition-all",
                    active
                      ? "border-[1.5px] border-foreground"
                      : "border border-border hover:border-foreground/40"
                  )}
                  style={{
                    background: active ? "var(--pig)" : "var(--bg-elev)",
                    color: "var(--ink)",
                  }}
                >
                  <CategoryIcon name={c.name} className="w-3.5 h-3.5" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* date + note rows */}
        <div className="space-y-1.5">
          {/* date row */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-[11px] rounded-xl border text-left"
                style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
              >
                <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-sunk)" }}
                >
                  <CalendarIcon className="w-[13px] h-[13px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.1em]">
                    {t("date")}
                  </div>
                  <div className="text-[13px] font-medium">
                    {selectedDate
                      ? format(parseISO(selectedDate), "PPP", { locale: dateFnsLocale })
                      : t("today")}
                  </div>
                </div>
                <ChevronRight className="w-[13px] h-[13px] text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
              {datePickerContent}
            </PopoverContent>
          </Popover>

          {accounts.length > 1 && accountRowMobile}
          {!isEditTxn && recurringRowMobile}

          {/* note row */}
          <div
            className="flex items-center gap-3 px-3 py-[11px] rounded-xl border"
            style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
          >
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-sunk)" }}
            >
              <Sparkles className="w-[13px] h-[13px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.1em]">
                {t("note")}
              </div>
              <input
                {...register("note")}
                type="text"
                placeholder={t("mobileNotePlaceholder")}
                maxLength={200}
                className="w-full bg-transparent border-none outline-none text-[13px] font-medium placeholder:text-muted-foreground"
              />
            </div>
            <ChevronRight className="w-[13px] h-[13px] text-muted-foreground shrink-0" />
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-destructive text-sm">{submitError}</p>
        )}

        {/* submit */}
        <div className="flex gap-2 pt-0.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-[15px] rounded-[14px] font-semibold text-[14px] text-muted-foreground"
              style={{ background: "var(--bg-sunk)" }}
            >
              {t("cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex-[2] py-[15px] rounded-[14px] font-semibold text-[14px] flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60",
              !onClose && "flex-1"
            )}
            style={{
              background: isIncome ? "var(--accent)" : "var(--ink)",
              color: isIncome ? "var(--accent-foreground)" : "var(--bg)",
            }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isEditTxn ? (
              t("saveChanges")
            ) : (
              <>{isIncome ? t("addIncome") : t("addExpense")}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
