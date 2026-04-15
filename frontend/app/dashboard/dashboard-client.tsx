"use client";

import { useState } from "react";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";

export function DashboardClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <h1 className="mb-6 font-display text-2xl font-semibold">Mes transactions</h1>
      <TransactionList refreshKey={refreshKey} />
      <TransactionSheet onTransactionCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
