"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AppLayout } from "@/components/layout/app-layout";
import { KashLogo } from "@/components/kash-logo";
import { Piggy } from "@/components/kash-piggy";

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
          {/* Mobile logo — KashLogo for brand mark */}
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-card lg:hidden">
            <KashLogo size="xs" />
          </div>
        </div>

        {/* Hero card — pig-to-gold gradient per design spec */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(135deg, var(--pig) 0%, var(--gold) 160%)" }}
        >
          {/* Sparkles */}
          <svg
            className="absolute right-24 top-4 opacity-60"
            width="80" height="60" viewBox="0 0 80 60" fill="none"
            aria-hidden
          >
            <path d="M40 10 L42 16 L48 18 L42 20 L40 26 L38 20 L32 18 L38 16 Z" fill="white" opacity="0.7" />
            <path d="M60 30 L61 33 L64 34 L61 35 L60 38 L59 35 L56 34 L59 33 Z" fill="white" opacity="0.5" />
            <circle cx="20" cy="25" r="2" fill="white" opacity="0.5" />
          </svg>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 pb-1">
              <p
                className="font-mono text-[11px] uppercase tracking-widest"
                style={{ color: "var(--pig-shadow)" }}
              >
                Piggy total
              </p>
              <div className="mt-1 font-display text-[42px] font-medium leading-none tracking-tight">
                —
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-background">
                  Track below
                </span>
              </div>
            </div>
            {/* Piggy mascot — exact design spec */}
            <div className="-mb-2 shrink-0">
              <Piggy size={110} mood="happy" fill={0.72} coin />
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
