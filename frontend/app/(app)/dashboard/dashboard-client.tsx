"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import { BottomNav } from "@/components/nav/bottom-nav";

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
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-24 pt-6 md:pb-6">
      <h1 className="mb-6 font-display text-2xl font-semibold">Mes transactions</h1>
      <TransactionList refreshKey={refreshKey} />
      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTransactionCreated={() => setRefreshKey((k) => k + 1)}
      />
      <BottomNav onAdd={() => setSheetOpen(true)} />
    </div>
  );
}
