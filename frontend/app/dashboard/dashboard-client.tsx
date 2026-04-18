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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted to-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Piggy Total
              </p>
              <div className="mt-1 font-display text-4xl font-medium leading-none tracking-tight">
                —
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Track your transactions below
              </p>
            </div>
            {/* Piggy bank icon */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <KashLogo size="lg" variant="default" />
            </div>
          </div>

          {/* Decorative sparkle */}
          <svg
            className="absolute right-24 top-4 opacity-40"
            width="40" height="30" viewBox="0 0 40 30" fill="none"
          >
            <path d="M20 5 L21.8 10.2 L27 12 L21.8 13.8 L20 19 L18.2 13.8 L13 12 L18.2 10.2 Z" fill="currentColor" className="text-primary" />
            <path d="M32 15 L32.9 17.5 L35.5 18.5 L32.9 19.5 L32 22 L31.1 19.5 L28.5 18.5 L31.1 17.5 Z" fill="currentColor" className="text-primary/60" />
          </svg>
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
