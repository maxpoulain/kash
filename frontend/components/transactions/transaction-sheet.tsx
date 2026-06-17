"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm, type EditingTarget } from "./transaction-form";

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionCreated?: () => void;
  /** When set, the sheet edits this entry instead of creating a new one. */
  editing?: EditingTarget;
}

export function TransactionSheet({ open, onOpenChange, onTransactionCreated, editing }: TransactionSheetProps) {
  const t = useTranslations("transactions.sheet");
  const [isMobile, setIsMobile] = useState(true);
  const isEdit = !!editing;
  // Remount the form when the edit target changes so defaultValues re-seed.
  const formKey = editing ? `${editing.kind}-${editing.kind === "txn" ? editing.txn.id : editing.transfer.id}` : "new";

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSuccess(kind: "transaction" | "transfer" = "transaction") {
    onOpenChange(false);
    const isTransfer = kind === "transfer";
    toast.success(
      isEdit
        ? isTransfer ? t("transferUpdateSuccess") : t("updateSuccess")
        : isTransfer ? t("transferSuccess") : t("success"),
    );
    onTransactionCreated?.();
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-t-2xl p-0">
            <SheetTitle className="sr-only">{t("title")}</SheetTitle>
            <TransactionForm
              key={formKey}
              editing={editing}
              onSuccess={handleSuccess}
              onClose={handleClose}
              variant="mobile"
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] overflow-hidden shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
              <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
              <TransactionForm
                key={formKey}
                editing={editing}
                onSuccess={handleSuccess}
                onClose={handleClose}
                variant="desktop"
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
