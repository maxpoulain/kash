"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AccountForm } from "./account-form";
import type { SavingsAccount, AccountFormData } from "./account-form";

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: SavingsAccount;
  onSave: (data: AccountFormData) => void;
  onDelete?: () => void;
  /** Show "Compte courant" as the first type (unified add modal). */
  allowCourant?: boolean;
}

export function AccountSheet({ open, onOpenChange, account, onSave, onDelete, allowCourant }: AccountSheetProps) {
  const t = useTranslations("assets.sheet");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSave(data: AccountFormData) {
    onSave(data);
    onOpenChange(false);
  }

  function handleDelete() {
    onDelete?.();
    onOpenChange(false);
  }

  function handleClose() {
    onOpenChange(false);
  }

  const formProps = {
    account,
    onSave: handleSave,
    onDelete: account ? handleDelete : undefined,
    onClose: handleClose,
    allowCourant,
  };

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-0">
            <SheetTitle className="sr-only">{account ? t("editTitle") : t("newTitle")}</SheetTitle>
            <AccountForm {...formProps} variant="mobile" />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-card shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
              <Dialog.Title className="sr-only">{account ? t("editTitle") : t("newTitle")}</Dialog.Title>
              <AccountForm {...formProps} variant="desktop" />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
