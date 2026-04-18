"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AppLayout } from "@/components/layout/app-layout";
import { KashLogo } from "@/components/kash-logo";

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

  const today = new Date();
  const greeting = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <AppLayout onAdd={() => setSheetOpen(true)}>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {greeting}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-medium tracking-tight">
              My finances
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-card lg:hidden">
            <KashLogo size="xs" />
          </div>
        </div>

        {/* Hero summary card */}
        <div className="relative overflow-hidden rounded-[20px] p-5" style={{ background: 'linear-gradient(135deg, var(--pig) 0%, var(--coin) 160%)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--pig-shadow)' }}>
                Total savings
              </p>
              <div className="mt-1.5 font-display text-[44px] font-medium leading-none tracking-tight">
                —
              </div>
              <span className="mt-2 inline-block rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
                Track below
              </span>
            </div>
            {/* Piggy mascot */}
            <div className="shrink-0 -mb-1">
              <KashLogo size="xl" variant="default" />
            </div>
          </div>
        </div>

        {/* Transaction list */}
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
