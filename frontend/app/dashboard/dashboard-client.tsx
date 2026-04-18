"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Bell, ArrowUpRight } from "lucide-react";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AppLayout } from "@/components/layout/app-layout";
import { Piggy } from "@/components/kash-piggy";
import { Card, CardContent } from "@/components/ui/card";

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

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppLayout onAdd={() => setSheetOpen(true)}>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          {/* Search */}
          <div className="flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions, jars, categories..."
                className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Keyboard shortcut hint */}
            <div className="hidden items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground md:flex">
              <span>⌘</span>
              <span>K</span>
            </div>

            {/* Notifications */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted">
              <Bell className="h-4 w-4" />
            </button>

            {/* User profile */}
            <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-1.5">
              <div className="text-right">
                <p className="text-sm font-medium">Fred Doe</p>
                <p className="text-xs text-muted-foreground">@freddoe12</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-pig" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-muted/30 px-8 py-6">
          {/* Greeting section */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Overview
              </p>
              <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
                {greeting}, Fred
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here is what moved today.
              </p>
            </div>

            {/* New transaction button (desktop) */}
            <button
              onClick={() => setSheetOpen(true)}
              className="hidden rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90 md:flex"
            >
              + New transaction
            </button>
          </div>

          {/* Hero cards grid */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Total savings card */}
            <Card className="relative overflow-hidden rounded-3xl border-0" style={{ background: "linear-gradient(135deg, var(--pig) 0%, #E8B89A 100%)" }}>
              <CardContent className="p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--pig-shadow)" }}>
                  Total savings · USD
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-medium tracking-tight">$12,847</span>
                  <span className="font-display text-3xl font-medium" style={{ color: "var(--pig-shadow)" }}>.30</span>
                </div>

                {/* Delta badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    <ArrowUpRight className="h-3 w-3" />
                    $1,240 this month
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--pig-shadow)" }}>+4.2%</span>
                </div>

                {/* Piggy illustration */}
                <div className="absolute right-4 bottom-0">
                  <Piggy size={140} mood="happy" fill={0.72} coin />
                </div>
              </CardContent>
            </Card>

            {/* Saver level card */}
            <Card className="rounded-3xl border-border bg-card">
              <CardContent className="p-6">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Saver Level
                  </p>
                  <span className="text-xs text-muted-foreground">Next: Champion</span>
                </div>

                {/* Level info */}
                <div className="mb-4 flex items-center gap-4">
                  {/* Level badge */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-semibold"
                    style={{
                      background: "var(--coin)",
                      color: "var(--foreground)",
                      boxShadow: "inset 0 -3px 0 var(--gold-soft)",
                    }}
                  >
                    7
                  </div>
                  <div>
                    <p className="font-display text-lg font-medium">Thrifty Saver</p>
                    <p className="font-mono text-xs text-muted-foreground">820 / 1000 XP</p>
                  </div>
                </div>

                {/* XP progress bar */}
                <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "82%",
                      background: "linear-gradient(90deg, var(--coin), var(--pig-deep))",
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-muted p-3 text-center">
                    <p className="font-display text-xl font-medium">12</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Badges</p>
                  </div>
                  <div className="rounded-2xl bg-muted p-3 text-center">
                    <p className="font-display text-xl font-medium">28</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Streak</p>
                  </div>
                  <div className="rounded-2xl bg-muted p-3 text-center">
                    <p className="font-display text-xl font-medium">94%</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Goal Hit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cashflow chart */}
          <Card className="rounded-3xl border-border bg-card">
            <CardContent className="p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-medium">Cashflow</h2>
                  <p className="text-sm text-muted-foreground">Income vs. expenses · last 12 weeks</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-pig" />
                    <span className="text-sm text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </div>

              {/* Chart placeholder - simplified bar chart */}
              <div className="flex h-48 items-end justify-between gap-2">
                {[
                  { w: "W05", income: 60, expense: 40 },
                  { w: "W07", income: 75, expense: 50 },
                  { w: "W09", income: 55, expense: 45 },
                  { w: "W11", income: 80, expense: 35 },
                  { w: "W13", income: 65, expense: 55 },
                  { w: "W15", income: 90, expense: 40 },
                  { w: "W17", income: 70, expense: 50 },
                  { w: "W19", income: 85, expense: 60 },
                  { w: "W21", income: 75, expense: 45 },
                  { w: "W23", income: 95, expense: 55 },
                  { w: "W25", income: 80, expense: 50 },
                ].map((week, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full gap-1">
                      <div
                        className="flex-1 rounded-t-md bg-success transition-all"
                        style={{ height: `${week.income * 1.5}px` }}
                      />
                      <div
                        className="flex-1 rounded-t-md bg-pig transition-all"
                        style={{ height: `${week.expense * 1.5}px` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{week.w}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <div className="mt-6">
            <h2 className="mb-4 font-display text-lg font-medium">Recent transactions</h2>
            <TransactionList refreshKey={refreshKey} />
          </div>
        </main>
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTransactionCreated={() => setRefreshKey((k) => k + 1)}
      />
    </AppLayout>
  );
}
