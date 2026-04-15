"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TransactionForm } from "./transaction-form";

interface TransactionSheetProps {
  onTransactionCreated?: () => void;
}

export function TransactionSheet({ onTransactionCreated }: TransactionSheetProps = {}) {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    toast.success("Transaction enregistrée !");
    onTransactionCreated?.();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        aria-label="Ajouter une transaction"
      >
        <PlusIcon className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvelle transaction</SheetTitle>
          </SheetHeader>
          <TransactionForm onSuccess={handleSuccess} />
        </SheetContent>
      </Sheet>
    </>
  );
}
