"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import type { EditingTarget } from "@/components/transactions/transaction-form";
import { AppLayout } from "@/components/layout/app-layout";

export function DashboardClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(() => searchParams.get("add") === "1");
  const [editing, setEditing] = useState<EditingTarget | undefined>(undefined);
  const didCleanUrl = useRef(false);

  function openAdd() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(target: EditingTarget) {
    setEditing(target);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditing(undefined);
  }

  useEffect(() => {
    if (!didCleanUrl.current && searchParams.get("add") === "1") {
      didCleanUrl.current = true;
      router.replace("/dashboard");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppLayout onAdd={openAdd}>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        <TransactionList
          refreshKey={refreshKey}
          onAdd={openAdd}
          onEdit={openEdit}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        editing={editing}
        onTransactionCreated={() => setRefreshKey((k) => k + 1)}
      />
    </AppLayout>
  );
}
