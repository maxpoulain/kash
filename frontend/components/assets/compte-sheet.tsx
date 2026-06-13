"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { Wallet, PiggyBank, X, Building2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Account, AccountCreate, AccountUpdate } from "@/types/api";

// "cash" (Espèces) intentionally dropped — not handled yet.
const KINDS = ["checking", "savings"] as const;
type Kind = (typeof KINDS)[number];

const KIND_ICON: Record<Kind, React.ElementType> = {
  checking: Wallet,
  savings: PiggyBank,
};

export interface ComptesFormProps {
  account?: Account;
  onCreate: (data: AccountCreate) => void;
  onUpdate: (id: string, data: AccountUpdate) => void;
  onClose: () => void;
  variant?: "mobile" | "desktop";
  /** Skip the form's own title/close header (when a parent modal owns it). */
  hideHeader?: boolean;
  /** Hide the checking/savings picker (e.g. in the unified add modal). */
  hideKindSelector?: boolean;
}

export function ComptesForm({
  account,
  onCreate,
  onUpdate,
  onClose,
  variant = "desktop",
  hideHeader,
  hideKindSelector,
}: ComptesFormProps) {
  const t = useTranslations("comptes.sheet");
  const isEdit = !!account;
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<Kind>((account?.type as Kind) ?? "checking");
  const [initialBalance, setInitialBalance] = useState(
    account ? String(account.initial_balance) : "",
  );
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const TypeIcon = KIND_ICON[type];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const initial = parseFloat(initialBalance) || 0;
    const inst = institution.trim() || undefined;
    if (account) {
      onUpdate(account.id, { name: name.trim(), type, initial_balance: initial, institution: inst });
    } else {
      onCreate({ name: name.trim(), type, initial_balance: initial, institution: inst });
    }
    onClose();
  }

  // ── Shared kind picker ──────────────────────────────────────────────────────
  const kindPickerDesktop = !hideKindSelector && (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("type")}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {KINDS.map((k) => {
          const Icon = KIND_ICON[k];
          const active = type === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px] font-medium transition-all",
                active ? "text-background border-foreground" : "text-muted-foreground border-border hover:border-foreground/40",
              )}
              style={active ? { background: "var(--ink)" } : { background: "var(--bg-elev)" }}
            >
              <Icon className="h-4 w-4" />
              {t(`kind.${k}`)}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── DESKTOP ─────────────────────────────────────────────────────────────────
  if (variant === "desktop") {
    return (
      <form onSubmit={submit} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} className="bg-background">
        {!hideHeader && (
          <div className="flex items-center justify-between border-b px-[22px] py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "var(--ink)", color: "var(--pig)" }}>
                <TypeIcon className="h-[18px] w-[18px]" style={{ color: "var(--pig)" }} />
              </div>
              <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">
                {isEdit ? t("editTitle") : t("newTitle")}
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground transition-colors" style={{ background: "var(--bg-sunk)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-[18px] px-[22px] py-[18px]">
          {/* Initial balance */}
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("initialBalance")}</div>
            <div className="flex items-baseline gap-2 rounded-[14px] px-4 py-3.5" style={{ background: "var(--bg-elev)", border: "1.5px solid var(--ink)" }}>
              <span className="font-display text-[22px] text-muted-foreground">€</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent font-display text-[38px] font-medium tracking-[-0.03em] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">EUR</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("initialBalanceHint")}</p>
          </div>

          {/* Name */}
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("name")}</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              autoFocus
              className="w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-foreground"
              style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
            />
          </div>

          {/* Institution */}
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("institution")} <span className="normal-case opacity-50">({t("optional")})</span>
            </div>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={t("institutionPlaceholder")}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-foreground"
              style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}
            />
          </div>

          {kindPickerDesktop}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-[22px] py-3" style={{ background: "var(--bg-elev)" }}>
          <button type="button" onClick={onClose} className="w-28 rounded-[10px] py-2.5 text-center text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground" style={{ background: "var(--bg-sunk)" }}>
            {t("cancel")}
          </button>
          <button type="submit" className="w-40 rounded-[10px] py-2.5 text-[13px] font-semibold text-background transition-opacity" style={{ background: "var(--ink)" }}>
            {isEdit ? t("save") : t("create")}
          </button>
        </div>
      </form>
    );
  }

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="bg-background">
      {!hideHeader && (
        <>
          <div className="mb-1.5 flex justify-center pt-3.5">
            <div className="h-[5px] w-11 rounded-full bg-border" />
          </div>
          <div className="flex items-center justify-between px-5">
            <div className="font-display text-[22px] font-medium tracking-[-0.02em]">
              {isEdit ? t("editTitle") : t("newTitle")}
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground" style={{ background: "var(--bg-sunk)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <div className="space-y-4 px-5 pb-8 pt-3">
        {/* Large balance */}
        <div className="pb-1 text-center">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("initialBalance")}</div>
          <div className="flex items-end justify-center">
            <span className="font-display font-medium text-muted-foreground" style={{ fontSize: 30, lineHeight: 1, marginBottom: 8, marginRight: 2 }}>€</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="border-none bg-transparent text-center font-display font-medium tracking-[-0.035em] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ fontSize: 64, lineHeight: 1, width: 200, color: "var(--ink)" }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("initialBalanceHint")}</p>
        </div>

        {/* Name */}
        <div className="flex items-center gap-3 rounded-xl border px-3 py-[11px]" style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]" style={{ background: "var(--bg-sunk)" }}>
            <TypeIcon className="h-[13px] w-[13px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t("name")}</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Institution */}
        <div className="flex items-center gap-3 rounded-xl border px-3 py-[11px]" style={{ background: "var(--bg-elev)", borderColor: "var(--line)" }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]" style={{ background: "var(--bg-sunk)" }}>
            <Building2 className="h-[13px] w-[13px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t("institution")} ({t("optional")})</div>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={t("institutionPlaceholder")}
              className="w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Kind pills */}
        {!hideKindSelector && (
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("type")}</div>
            <div className="flex gap-2">
              {KINDS.map((k) => {
                const Icon = KIND_ICON[k];
                const active = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-all",
                      active ? "border-foreground" : "border-border hover:border-foreground/40",
                    )}
                    style={{ background: active ? "var(--pig)" : "var(--bg-elev)", color: "var(--ink)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(`kind.${k}`)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-2 pt-0.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-[14px] py-[15px] text-[14px] font-semibold text-muted-foreground" style={{ background: "var(--bg-sunk)" }}>
            {t("cancel")}
          </button>
          <button type="submit" className="flex-[2] rounded-[14px] py-[15px] text-[14px] font-semibold text-background" style={{ background: "var(--ink)" }}>
            {isEdit ? t("save") : t("create")}
          </button>
        </div>
      </div>
    </form>
  );
}

export interface ComptesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onCreate: (data: AccountCreate) => void;
  onUpdate: (id: string, data: AccountUpdate) => void;
}

export function ComptesSheet({ open, onOpenChange, account, onCreate, onUpdate }: ComptesSheetProps) {
  const t = useTranslations("comptes.sheet");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const formProps = { account, onCreate, onUpdate, onClose: () => onOpenChange(false) };

  return isMobile ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-0">
        <SheetTitle className="sr-only">{account ? t("editTitle") : t("newTitle")}</SheetTitle>
        <ComptesForm {...formProps} variant="mobile" />
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-card shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
          <Dialog.Title className="sr-only">{account ? t("editTitle") : t("newTitle")}</Dialog.Title>
          <ComptesForm {...formProps} variant="desktop" />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
