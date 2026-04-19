"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AppLayout } from "@/components/layout/app-layout";

export function DashboardClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(() => searchParams.get("add") === "1");
  const didCleanUrl = useRef(false);

  useEffect(() => {
    if (!didCleanUrl.current && searchParams.get("add") === "1") {
      didCleanUrl.current = true;
      router.replace("/dashboard");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppLayout onAdd={() => setSheetOpen(true)}>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Page header */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Ledger</p>
          <h1 className="mt-0.5 font-display text-2xl font-medium tracking-tight">Transactions</h1>
        </div>

        <TransactionList refreshKey={refreshKey} />
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTransactionCreated={() => setRefreshKey((k) => k + 1)}
      />
    </AppLayout>
  );
}
