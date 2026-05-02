"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm } from "./transaction-form";

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionCreated?: () => void;
}

export function TransactionSheet({ open, onOpenChange, onTransactionCreated }: TransactionSheetProps) {
  const t = useTranslations("transactions.sheet");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSuccess() {
    onOpenChange(false);
    toast.success(t("success"));
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
