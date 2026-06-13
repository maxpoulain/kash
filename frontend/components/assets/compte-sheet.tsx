"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { Wallet, PiggyBank, Coins, Trash2, Archive } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Account, AccountCreate, AccountUpdate } from "@/types/api";

const KINDS = ["checking", "savings", "cash"] as const;
type Kind = (typeof KINDS)[number];

const KIND_ICON: Record<Kind, React.ElementType> = {
  checking: Wallet,
  savings: PiggyBank,
  cash: Coins,
};

export interface ComptesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onCreate: (data: AccountCreate) => void;
  onUpdate: (id: string, data: AccountUpdate) => void;
  onDelete: (id: string) => void;
}

function ComptesForm({ account, onCreate, onUpdate, onDelete, onClose }: {
  account?: Account;
  onCreate: (data: AccountCreate) => void;
  onUpdate: (id: string, data: AccountUpdate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("comptes.sheet");
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<Kind>((account?.type as Kind) ?? "checking");
  const [initialBalance, setInitialBalance] = useState(
    account ? String(account.initial_balance) : "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const initial = parseFloat(initialBalance) || 0;
    if (account) {
      onUpdate(account.id, { name, type, initial_balance: initial });
    } else {
      onCreate({ name, type, initial_balance: initial });
    }
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-background p-5">
      <h2 className="font-display text-lg font-medium tracking-tight">
        {account ? t("editTitle") : t("newTitle")}
      </h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="compte-name">{t("name")}</Label>
        <Input
          id="compte-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          autoFocus
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("type")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => {
            const Icon = KIND_ICON[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-colors",
                  type === k ? "border-foreground bg-muted" : "border-border hover:bg-muted/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`kind.${k}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="compte-initial">{t("initialBalance")}</Label>
        <Input
          id="compte-initial"
          type="number"
          step="0.01"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-[11px] text-muted-foreground">{t("initialBalanceHint")}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" className="flex-1">
          {account ? t("save") : t("create")}
        </Button>
        {account && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("archive")}
              onClick={() => {
                onUpdate(account.id, { archived: true });
                onClose();
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("delete")}
              onClick={() => {
                onDelete(account.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

export function ComptesSheet({ open, onOpenChange, account, onCreate, onUpdate, onDelete }: ComptesSheetProps) {
  const t = useTranslations("comptes.sheet");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const formProps = { account, onCreate, onUpdate, onDelete, onClose: () => onOpenChange(false) };

  return isMobile ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-0">
        <SheetTitle className="sr-only">{account ? t("editTitle") : t("newTitle")}</SheetTitle>
        <ComptesForm {...formProps} />
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-card shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
          <Dialog.Title className="sr-only">{account ? t("editTitle") : t("newTitle")}</Dialog.Title>
          <ComptesForm {...formProps} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
