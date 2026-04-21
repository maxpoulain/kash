"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home, PiggyBank, Coins, BarChart3, User, Plus, Minus,
  Search, Bell, Check, Flame, Trophy, Zap, Globe, Lock,
  Gift, Sparkles, Wallet, ShoppingCart, UtensilsCrossed,
  Car, ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Piggy as PiggyMascot, PiggyMark } from "@/components/kash-piggy";
import { Button as DsButton } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { currentMonth, prevMonth } from "@/lib/month";

// ─── Layout helpers ───────────────────────────────────────────────────────────
function Section({ num, title, desc, children }: {
  num: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <section className="border-b border-dashed border-border py-12">
      <div className="grid grid-cols-[280px_1fr] gap-12 items-start">
        <div className="sticky top-20">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{num}</p>
          <h2 className="mt-1 font-display text-2xl font-medium tracking-tight">{title}</h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/60">{desc}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Card({ label, dark, children }: { label: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-2xl border border-border p-6",
      dark ? "bg-foreground text-background border-foreground/20" : "bg-card"
    )}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3 min-h-10">{children}</div>
    </div>
  );
}

function Spec({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

// Re-export shared mascot as local alias to keep JSX unchanged below
const Piggy = PiggyMascot;

// ─── 01 Buttons ───────────────────────────────────────────────────────────────
function SectionButtons() {
  const base = "inline-flex items-center gap-2 font-semibold cursor-pointer border-0 transition-all active:translate-y-px";
  return (
    <Section num="01" title="Buttons" desc="Four variants × three sizes. Primary is ink. Piggy for money-moving actions. Outline for secondary paths. Ghost for cancel/low-priority.">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Primary · ink">
          <button className={`${base} rounded-full bg-foreground text-background px-6 py-3.5 text-[15px]`}>Add savings <ArrowUpRight className="h-4 w-4" /></button>
          <button className={`${base} rounded-full bg-foreground text-background px-5 py-2.5 text-sm`}>Save</button>
          <button className={`${base} rounded-full bg-foreground text-background px-3.5 py-1.5 text-xs`}>Confirm</button>
        </Card>

        <Card label="Piggy · money actions">
          <button className={`${base} rounded-full px-6 py-3.5 text-[15px] shadow-[inset_0_-3px_0_var(--pig-shadow)]`} style={{ background: "var(--pig)", color: "var(--foreground)" }}>
            <Coins className="h-4 w-4" /> Feed piggy
          </button>
          <button className={`${base} rounded-full px-5 py-2.5 text-sm shadow-[inset_0_-2px_0_var(--pig-shadow)]`} style={{ background: "var(--pig)", color: "var(--foreground)" }}>Top up</button>
          <button className={`${base} rounded-full px-3.5 py-1.5 text-xs`} style={{ background: "var(--pig)", color: "var(--foreground)" }}>+$5</button>
        </Card>

        <Card label="Outline · secondary">
          <button className={`${base} rounded-full border-[1.5px] border-foreground bg-transparent text-foreground px-6 py-3.5 text-[15px]`}>View report</button>
          <button className={`${base} rounded-full border-[1.5px] border-foreground bg-transparent text-foreground px-5 py-2.5 text-sm`}>Export</button>
          <button className={`${base} rounded-full border border-foreground bg-transparent text-foreground px-3.5 py-1.5 text-xs`}>Edit</button>
        </Card>

        <Card label="Ghost · tertiary">
          <button className={`${base} rounded-full bg-muted text-foreground px-5 py-2.5 text-sm`}>Cancel</button>
          <button className={`${base} rounded-full bg-transparent text-muted-foreground px-5 py-2.5 text-sm`}>Learn more</button>
          <button className={`${base} rounded-full bg-transparent px-5 py-2.5 text-sm`} style={{ color: "var(--warning)" }}>Delete jar</button>
        </Card>

        <Card label="Icon · square radius">
          <button className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card text-foreground cursor-pointer"><Plus className="h-4 w-4" /></button>
          <button className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-foreground text-background cursor-pointer"><Search className="h-4 w-4" /></button>
          <button className="flex h-10 w-10 items-center justify-center rounded-[10px] cursor-pointer" style={{ background: "var(--pig)", color: "var(--foreground)" }}><Bell className="h-4 w-4" /></button>
          <button className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-success text-success-foreground cursor-pointer"><Check className="h-4 w-4" /></button>
        </Card>

        <Card label="States">
          <button className={`${base} rounded-full bg-foreground text-background px-5 py-2.5 text-sm`}>Default</button>
          <button className={`${base} rounded-full bg-foreground/90 text-background px-5 py-2.5 text-sm translate-y-px`}>Pressed</button>
          <button className={`${base} rounded-full bg-muted text-muted-foreground px-5 py-2.5 text-sm cursor-not-allowed`}>Disabled</button>
          <button className={`${base} rounded-full bg-foreground text-background px-5 py-2.5 text-sm`}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</button>
        </Card>
      </div>
      <div className="mt-3"><Spec>radius 999 · inset-shadow 2–3px · font-weight 600</Spec></div>
    </Section>
  );
}

// ─── 02 Inputs ────────────────────────────────────────────────────────────────
function SectionInputs() {
  const field = "w-full rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:border-foreground focus:ring-[3px] focus:ring-foreground/10 placeholder:text-muted-foreground";
  return (
    <Section num="02" title="Form inputs" desc="Text, number, date, and the money field. The money field always uses mono + a prefixed currency glyph. Focus ring is ink, not blue.">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Text · default / focus / error">
          <div className="w-full space-y-3">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Jar name</p>
              <input className={field} placeholder="e.g. Tokyo trip" />
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Focused</p>
              <input className={`${field} border-foreground ring-[3px] ring-foreground/10`} defaultValue="Emergency fund" />
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-warning">Error · required</p>
              <input className="w-full rounded-[10px] border border-warning bg-warn-soft px-3.5 py-3 text-sm outline-none" />
              <p className="mt-1 text-[11px] text-warning">Give your jar a name.</p>
            </div>
          </div>
        </Card>

        <Card label="Money field · mono">
          <div className="w-full space-y-3">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</p>
              <div className="flex items-center gap-0 rounded-[10px] border border-border bg-background px-3.5 py-0.5">
                <span className="font-mono text-lg text-muted-foreground pr-1.5">$</span>
                <input className="flex-1 border-0 bg-transparent py-3 font-mono text-lg font-semibold text-foreground outline-none tabular-nums" defaultValue="1,240.00" />
                <span className="font-mono text-[11px] text-muted-foreground">USD</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {["+$5", "+$20", "+$100", "+$500"].map(x => (
                <button key={x} className="rounded-lg bg-muted py-2 font-mono text-xs font-semibold text-foreground cursor-pointer hover:bg-muted/80">{x}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card label="Select · dropdown">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between rounded-[10px] border border-border bg-background px-3.5 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-md text-background" style={{ background: "var(--warning)" }}><UtensilsCrossed className="h-3 w-3" /></div>
                Restaurants
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
            </div>
            <div className="rounded-[10px] border border-border bg-card p-1.5 shadow-lg">
              {["Groceries", "Restaurants", "Coffee"].map((c, i) => (
                <div key={c} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", i === 1 ? "bg-muted" : "")}>
                  <div className="h-4 w-4 rounded bg-primary" />
                  {c}
                  {i === 1 && <Check className="ml-auto h-3.5 w-3.5" />}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card label="Toggle · checkbox · radio">
          <div className="w-full space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-save on payday</span>
              <div className="flex h-5.5 w-10 items-center justify-end rounded-full p-0.5" style={{ background: "var(--success)" }}>
                <div className="h-4.5 w-4.5 rounded-full bg-card" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Round-ups</span>
              <div className="flex h-5.5 w-10 items-center justify-start rounded-full bg-muted p-0.5">
                <div className="h-4.5 w-4.5 rounded-full bg-card shadow-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-foreground text-background"><Check className="h-3 w-3" strokeWidth={2.5} /></div>
              Weekly digest email
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="h-4.5 w-4.5 rounded-md border-[1.5px] border-border bg-background" />
              Push reminders
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ─── 03 Cards ─────────────────────────────────────────────────────────────────
function SectionCards() {
  return (
    <Section num="03" title="Cards" desc="Four templates: balance hero, metric, list, and transaction row. All share 16–24px radius, single border, subtle elevation.">
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        {/* Balance hero */}
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg, var(--pig) 0%, var(--coin) 160%)", minHeight: 180 }}>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--pig-shadow)" }}>Total savings</p>
          <p className="mt-1.5 font-display text-5xl font-medium tracking-tight leading-none">
            $12,847<span className="text-2xl" style={{ color: "var(--pig-shadow)" }}>.30</span>
          </p>
          <span className="mt-3 inline-block rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">↑ +4.2%</span>
          <div className="absolute right-2 bottom-0">
            <Piggy size={110} mood="happy" fill={0.7} />
          </div>
        </div>

        {/* Metric */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Saved this month</p>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 font-display text-4xl font-medium tracking-tight">$1,240</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">of $2,000 goal · 62%</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] rounded-full bg-success" />
          </div>
        </div>

        {/* List card */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-medium">Recent activity</h3>
            <span className="text-xs text-muted-foreground">Apr 15 – 18</span>
          </div>
          {[
            { n: "Trader Joe's", c: "Groceries", a: -64.22, icon: ShoppingCart, col: "var(--pig-deep)" },
            { n: "Payroll · Acme", c: "Salary", a: 3800, icon: Wallet, col: "var(--success)" },
            { n: "Auto-save → Tokyo", c: "Savings", a: -200, icon: Coins, col: "var(--coin)" },
          ].map((r, i) => (
            <div key={i} className={cn("flex items-center gap-3 py-2.5", i > 0 && "border-t border-border")}>
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-background" style={{ background: r.col }}>
                <r.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">{r.n}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{r.c}</p>
              </div>
              <span className="font-mono text-[13px] font-semibold" style={{ color: r.a > 0 ? "var(--success)" : "var(--foreground)" }}>
                {r.a > 0 ? "+" : ""}${Math.abs(r.a).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── 04 Jars ──────────────────────────────────────────────────────────────────
function SectionJars() {
  const jars = [
    { name: "Tokyo trip", pct: 0.62, icon: Globe, c: "var(--pig)", streak: 12 },
    { name: "Emergency", pct: 0.38, icon: Lock, c: "var(--accent-soft)", streak: 4 },
    { name: "New iMac", pct: 0.14, icon: Zap, c: "var(--gold-soft)", streak: 2 },
    { name: "Mom's gift", pct: 0.92, icon: Gift, c: "var(--warn-soft)", streak: 22 },
  ];
  return (
    <Section num="04" title="Jars" desc="The savings container. Three sizes — micro row, standard grid card, and hero detail. Fill level is always literal, never abstract.">
      {/* Hero jar */}
      <div className="mb-4 grid grid-cols-[160px_1fr] gap-7 rounded-2xl border border-border bg-card p-6">
        <div className="relative mx-auto h-[170px] w-[140px] overflow-hidden rounded-[12px_12px_22px_22px] border-[3px] border-foreground bg-muted">
          <div className="absolute -top-2 -left-2 -right-2 h-3.5 rounded bg-foreground" />
          <div className="absolute bottom-0 left-0 right-0 h-[62%]" style={{ background: "linear-gradient(180deg, var(--pig-deep), var(--pig))" }} />
          <p className="absolute top-5 left-0 right-0 text-center font-display text-2xl font-semibold">62%</p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <Globe className="h-4.5 w-4.5" />
            <h3 className="font-display text-2xl font-medium tracking-tight">Tokyo trip</h3>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--warn-soft)", color: "var(--warning)" }}>
              <Flame className="h-3 w-3" /> 12d
            </span>
          </div>
          <div className="mt-4 flex gap-5">
            {[{ l: "Saved", v: "$1,488" }, { l: "Goal", v: "$2,400" }, { l: "ETA", v: "Oct '26" }].map(s => (
              <div key={s.l}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
                <p className="mt-0.5 font-display text-2xl font-medium">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] rounded-full" style={{ background: "linear-gradient(90deg, var(--coin), var(--pig-deep))" }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        {jars.map((j, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-border bg-card p-3.5">
            <div className="mb-9 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: j.c }}>
                <j.icon className="h-3.5 w-3.5" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{Math.round(j.pct * 100)}%</span>
            </div>
            <p className="font-display text-[14px] font-medium">{j.name}</p>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold" style={{ color: "var(--warning)" }}>
              <Flame className="h-2.5 w-2.5" /> {j.streak}d
            </span>
            <div className="absolute bottom-0 left-0 right-0 border-t border-pig-deep/40 opacity-35" style={{ height: `${j.pct * 50}%`, background: j.c }} />
          </div>
        ))}
      </div>

      {/* Row */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {jars.slice(0, 3).map((j, i) => (
          <div key={i} className={cn("flex items-center gap-3.5 p-3.5", i > 0 && "border-t border-border")}>
            <div className="relative h-9 w-7 overflow-hidden rounded-[3px_3px_6px_6px] border-[1.5px] border-foreground bg-muted">
              <div className="absolute -top-0.5 -left-0.5 -right-0.5 h-1.5 bg-foreground rounded-sm" />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: `${j.pct * 100}%`, background: j.c }} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">{j.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{Math.round(j.pct * 100)}% · streak {j.streak}d</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── 05 Piggy companion ───────────────────────────────────────────────────────
function SectionPiggy() {
  return (
    <Section num="05" title="Piggy companion" desc="The mascot reacts to context: happy when on track, neutral when watching, sleepy when idle. Never static.">
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { m: "happy", fill: 0.85, coin: true, label: "On track", sub: "goal ≥ 80%" },
          { m: "neutral", fill: 0.5, label: "Watching", sub: "goal 40–79%" },
          { m: "sleep", fill: 0.2, label: "Idle", sub: "7+ days quiet" },
        ].map((p, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="mb-3 flex items-center justify-center rounded-xl bg-muted py-4">
              <Piggy size={110} mood={p.m as "happy" | "neutral" | "sleep"} fill={p.fill} coin={!!p.coin} />
            </div>
            <p className="font-display text-base font-medium">{p.label}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3.5 rounded-2xl p-4" style={{ background: "var(--pig)" }}>
          <Piggy size={70} mood="happy" coin fill={0.9} />
          <div>
            <p className="font-display text-base font-medium">Nice one!</p>
            <p className="text-xs" style={{ color: "var(--pig-shadow)" }}>You just saved $200 to Tokyo trip.</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl p-4" style={{ background: "var(--warn-soft)" }}>
          <Piggy size={70} mood="neutral" fill={0.3} />
          <div>
            <p className="font-display text-base font-medium">Careful…</p>
            <p className="text-xs" style={{ color: "var(--warning)" }}>{"You're"} at 83% of Restaurants budget.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 06 Gamification ──────────────────────────────────────────────────────────
function SectionGamification() {
  return (
    <Section num="06" title="Gamification" desc="XP bars, level badges, streak counters, achievement tiles. Always secondary to financial data — XP never replaces a dollar amount.">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card label="Level · XP bar">
          <div className="flex w-full items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] font-display text-3xl font-semibold shadow-[inset_0_-3px_0_var(--gold-soft)]" style={{ background: "var(--coin)", color: "var(--foreground)" }}>7</div>
            <div className="flex-1">
              <div className="flex justify-between text-[13px]">
                <span className="font-medium">Thrifty Saver</span>
                <span className="font-mono text-[11px] text-muted-foreground">820 / 1000</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[82%] rounded-full" style={{ background: "linear-gradient(90deg, var(--coin), var(--pig-deep))" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card label="Streak counter">
          <div className="flex w-full items-center gap-2.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--warn-soft)", color: "var(--warning)" }}>
              <Flame className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <p className="font-display text-3xl font-medium leading-none tracking-tight">28 days</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Personal best</p>
            </div>
          </div>
          <div className="flex w-full gap-0.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="h-4.5 flex-1 rounded-[2px]" style={{ background: i < 27 ? "var(--warning)" : "var(--pig)", opacity: i < 20 ? 0.35 + i * 0.03 : 1 }} />
            ))}
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Achievements · 12 of 28</p>
        <div className="grid grid-cols-7 gap-2.5">
          {[
            { n: "First coin", icon: Coins, got: true },
            { n: "7-day", icon: Flame, got: true },
            { n: "Budget", icon: Trophy, got: true },
            { n: "Jar filled", icon: PiggyBank, got: true },
            { n: "Big saver", icon: Zap, got: false },
            { n: "World trip", icon: Globe, got: false },
            { n: "???", icon: Lock, got: false },
          ].map((a, i) => (
            <div key={i} className={cn("flex aspect-square flex-col items-center justify-between rounded-2xl p-2.5 text-center", a.got ? "border-[1.5px] border-dashed border-coin" : "border-[1.5px] border-dashed border-border opacity-55")} style={{ background: a.got ? "var(--gold-soft)" : "var(--muted)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card" style={{ color: a.got ? "var(--coin)" : "var(--muted-foreground)" }}>
                <a.icon className="h-4 w-4" />
              </div>
              <p className="font-mono text-[9px] font-semibold leading-tight">{a.n}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── 07 Navigation ────────────────────────────────────────────────────────────
function SectionNav() {
  return (
    <Section num="07" title="Navigation" desc="Bottom tab pill for mobile, sidebar for web. The centre piggy-FAB replaces a boring plus.">
      <div className="grid grid-cols-[1fr_1.3fr] gap-4">
        {/* Mobile pill demo */}
        <div className="flex items-end justify-center rounded-2xl bg-muted px-5 py-8" style={{ minHeight: 140 }}>
          <div className="relative flex w-full max-w-[300px] items-center justify-around rounded-full bg-foreground px-3.5 py-2.5 shadow-2xl">
            <div className="flex items-center justify-center rounded-full bg-background p-2"><Home className="h-[18px] w-[18px]" /></div>
            <div className="flex items-center justify-center p-2 opacity-55 text-background"><PiggyBank className="h-[18px] w-[18px]" /></div>
            <div className="-mt-7 flex h-11 w-11 items-center justify-center rounded-full border-2 border-background shadow-[inset_0_-3px_0_var(--pig-shadow)]" style={{ background: "var(--pig)", color: "var(--foreground)" }}>
              <Plus className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex items-center justify-center p-2 opacity-55 text-background"><BarChart3 className="h-[18px] w-[18px]" /></div>
            <div className="flex items-center justify-center p-2 opacity-55 text-background"><User className="h-[18px] w-[18px]" /></div>
          </div>
        </div>

        {/* Sidebar demo */}
        <div className="flex flex-col gap-1 rounded-2xl bg-muted p-4">
          <div className="mb-3.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: "var(--pig)", boxShadow: "inset 0 -2px 0 var(--pig-shadow)" }}>
              <PiggyMark size={20} />
            </div>
            <span className="font-display text-[22px] font-semibold leading-none tracking-tight">Kash</span>
          </div>
          {[
            { icon: Home, l: "Dashboard", active: true },
            { icon: PiggyBank, l: "Jars" },
            { icon: Coins, l: "Transactions" },
            { icon: BarChart3, l: "Insights" },
            { icon: Trophy, l: "Achievements", badge: 3 },
          ].map((item, i) => (
            <div key={i} className={cn("flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium", item.active ? "bg-foreground text-background" : "text-foreground/60")}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.l}
              {item.badge && <span className="ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold text-background" style={{ background: "var(--warning)" }}>{item.badge}</span>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── 08 Feedback ──────────────────────────────────────────────────────────────
function SectionFeedback() {
  return (
    <Section num="08" title="Feedback" desc="Toasts, alerts, empty states. Kash's microcopy is warm, never cute.">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-3 rounded-2xl bg-foreground p-3.5 shadow-lg">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success"><Check className="h-4 w-4 text-success-foreground" /></div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-background">Saved $200 to Tokyo trip</p>
            <p className="text-[11px] text-background/60">+25 XP · streak now 29 days</p>
          </div>
          <Sparkles className="h-4 w-4 text-background/40" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border p-3.5" style={{ background: "var(--warn-soft)", borderColor: "var(--warning)", color: "var(--warning)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--warning)", color: "white" }}><Flame className="h-4 w-4" /></div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold">Restaurants at 83%</p>
            <p className="text-[11px] opacity-80">$34 left until Friday.</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success"><Sparkles className="h-4 w-4 text-success-foreground" /></div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold">Payday detected — auto-save ran</p>
            <p className="text-[11px] opacity-80">We moved $400 across your 4 jars. Tap to review.</p>
          </div>
          <button className="rounded-full px-3 py-1.5 text-xs font-semibold text-background cursor-pointer" style={{ background: "var(--success)" }}>Review</button>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-10 px-5 text-center">
        <Piggy size={110} mood="sleep" fill={0} />
        <h3 className="mt-2 font-display text-xl font-medium tracking-tight">Your piggy is hungry.</h3>
        <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">{"Create your first jar and drop a coin in. Small amounts count — that's the whole point."}</p>
        <button className="mt-5 rounded-full px-5 py-3 font-semibold text-sm cursor-pointer shadow-[inset_0_-3px_0_var(--pig-shadow)]" style={{ background: "var(--pig)", color: "var(--foreground)" }}>
          Create your first jar
        </button>
      </div>
    </Section>
  );
}

// ─── 09 Modals ────────────────────────────────────────────────────────────────
function SectionModals() {
  return (
    <Section num="09" title="Modal · Sheet" desc="Bottom sheet on mobile, centered dialog on desktop. Inputs sit above actions. Primary action = ink.">
      <div className="grid grid-cols-[1fr_1.3fr] gap-4">
        {/* Bottom sheet */}
        <div className="flex items-end rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.4)", minHeight: 380 }}>
          <div className="w-full rounded-[22px_22px_8px_8px] bg-background p-5">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h3 className="font-display text-xl font-medium tracking-tight">New jar</h3>
            <p className="mb-3.5 text-xs text-muted-foreground">Name it, set a goal, pick an icon.</p>
            <input className="mb-2 w-full rounded-[10px] border border-border bg-muted px-3.5 py-3 text-sm outline-none" placeholder="e.g. Tokyo trip" />
            <div className="mb-3.5 grid grid-cols-6 gap-1.5">
              {[Globe, Lock, Zap, Gift, Home, Car].map((Icon, i) => (
                <div key={i} className="flex aspect-square items-center justify-center rounded-[10px] border border-border" style={{ background: i === 0 ? "var(--pig)" : "var(--muted)" }}>
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
            <button className="w-full rounded-xl bg-foreground py-3.5 font-semibold text-background cursor-pointer">Create jar</button>
          </div>
        </div>

        {/* Desktop dialog */}
        <div className="grid place-items-center rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.3)", minHeight: 380 }}>
          <div className="w-full max-w-sm rounded-[18px] bg-background p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-xl font-medium tracking-tight">Confirm transfer</h3>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-sm cursor-pointer">×</button>
            </div>
            <p className="mb-4 text-[13px] text-muted-foreground">{"You're"} moving money between jars.</p>
            <div className="mb-4 flex items-center justify-between rounded-xl bg-muted p-3.5">
              <div><p className="font-mono text-[10px] text-muted-foreground">FROM</p><p className="text-[13px] font-medium">Emergency</p></div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              <div><p className="font-mono text-[10px] text-muted-foreground">TO</p><p className="text-[13px] font-medium">Tokyo trip</p></div>
              <p className="font-display text-xl font-medium tabular-nums">$250</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-[10px] bg-muted py-3 font-medium text-sm cursor-pointer">Cancel</button>
              <button className="flex-1 rounded-[10px] bg-foreground py-3 font-semibold text-sm text-background cursor-pointer">Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 10 Chips & Badges ────────────────────────────────────────────────────────
function SectionChips() {
  return (
    <Section num="10" title="Chips & badges" desc="Tonal chips for metadata, pill badges for deltas, glyph badges for XP and streaks. Always paired with a number.">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Delta pills">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>↑ +4.2%</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--warn-soft)", color: "var(--warning)" }}>↓ -$86</span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/60">= flat</span>
          <span className="inline-flex items-center rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">+$1,240</span>
        </Card>

        <Card label="Game badges">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--gold-soft)", color: "#6B4A0D" }}><Sparkles className="h-3 w-3" /> +120 XP</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--pig)", color: "var(--foreground)" }}><Flame className="h-3 w-3" /> 28d</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background"><Trophy className="h-3 w-3" /> LVL 7</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}><Check className="h-3 w-3" /> Goal hit</span>
        </Card>

        <Card label="Category tags">
          {[
            { label: "Groceries", dot: "var(--pig-deep)" },
            { label: "Rent", dot: "var(--success)" },
            { label: "Dining", dot: "var(--warning)" },
            { label: "Transport", dot: "var(--coin)" },
          ].map(t => (
            <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/60">
              <span className="h-2 w-2 rounded-full" style={{ background: t.dot }} />
              {t.label}
            </span>
          ))}
        </Card>

        <Card label="Notification dots & counts">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[10px] bg-muted">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -right-1 -top-1 rounded-full px-1.5 font-mono text-[10px] font-bold text-background" style={{ background: "var(--warning)" }}>3</span>
          </div>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[10px] bg-muted">
            <Trophy className="h-4.5 w-4.5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-[1.5px] border-muted" style={{ background: "var(--pig)" }} />
          </div>
          <span className="rounded-full bg-foreground px-2.5 py-1 font-mono text-[11px] font-bold text-background">NEW</span>
          <span className="rounded-full px-2.5 py-1 font-mono text-[11px] font-bold" style={{ background: "var(--pig)", color: "var(--foreground)" }}>BETA</span>
        </Card>
      </div>
    </Section>
  );
}

// ─── 11 Month switcher ────────────────────────────────────────────────────────
function SectionMonthSwitcher() {
  const [enrichedMonth, setEnrichedMonth] = useState(currentMonth);
  const [compactMonth, setCompactMonth] = useState(() => prevMonth(currentMonth()));
  return (
    <Section
      num="11"
      title="Month switcher"
      desc="Monthly navigation shared by goals and transactions. Future months are disabled. Default variant carries a day counter and optional action slot; compact variant fits inline headers."
    >
      <div className="flex flex-col gap-3">
        <Card label="Default · enriched (goals, transactions)">
          <div className="w-full">
            <MonthSwitcher
              value={enrichedMonth}
              onChange={setEnrichedMonth}
              showDayCounter
              showTodayButton
              endSlot={
                <DsButton size="sm" className="gap-1.5 rounded-full">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </DsButton>
              }
            />
          </div>
        </Card>

        <Card label="Compact · inline">
          <MonthSwitcher value={compactMonth} onChange={setCompactMonth} size="compact" />
        </Card>
      </div>
    </Section>
  );
}

// ─── Color palette ─────────────────────────────────────────────────────────────
function SectionColors() {
  const swatches = [
    { label: "Pig", sub: "#F4A7B9", style: { background: "var(--pig)" } },
    { label: "Pig Deep", sub: "#D47B90", style: { background: "var(--pig-deep)" } },
    { label: "Pig Shadow", sub: "#B85F77", style: { background: "var(--pig-shadow)" } },
    { label: "Accent", sub: "#2D7D6E", style: { background: "var(--success)" } },
    { label: "Accent Soft", sub: "#CFE4DB", style: { background: "var(--accent-soft)" } },
    { label: "Gold", sub: "#D4A246", style: { background: "var(--coin)" } },
    { label: "Gold Soft", sub: "#F3E3B8", style: { background: "var(--gold-soft)" } },
    { label: "Warn", sub: "#E07B3C", style: { background: "var(--warning)" } },
    { label: "Warn Soft", sub: "#FAE1CE", style: { background: "var(--warn-soft)" } },
    { label: "Ink", sub: "#1F1912", style: { background: "var(--foreground)" } },
    { label: "Ink 2", sub: "#514738", style: { background: "var(--muted-foreground)" } },
    { label: "Background", sub: "#FAF6F1", style: { background: "var(--background)", border: "1px solid var(--border)" } },
  ];
  return (
    <Section num="00" title="Color tokens" desc="Balanced direction — 3 tonal ramps: pig (brand), accent/moss (success), gold (rewards). Warn for expenses. All backgrounds are warm cream.">
      <div className="grid grid-cols-6 gap-3">
        {swatches.map(s => (
          <div key={s.label}>
            <div className="mb-2 h-16 rounded-xl" style={s.style} />
            <p className="text-[12px] font-medium">{s.label}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────
function SectionType() {
  return (
    <Section num="T" title="Typography" desc="Fraunces for display (warm humanist serif). DM Sans for body (clean, readable). JetBrains Mono for all financial figures.">
      <div className="space-y-6">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Display — Fraunces</p>
          <p className="font-display text-5xl font-medium leading-tight tracking-tight">$12,847.30</p>
          <p className="mt-1 font-display text-3xl font-medium tracking-tight">{"Save like it's a game."}</p>
          <p className="mt-1 font-display text-xl font-medium">Thrifty Saver · Level 7</p>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Body — DM Sans</p>
          <p className="text-base leading-relaxed text-foreground">Track your spending, build savings habits, and reach your financial goals. Every coin counts.</p>
          <p className="mt-1 text-sm text-muted-foreground">{"Small amounts add up — that's the whole point of Kash."}</p>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mono — JetBrains Mono</p>
          <p className="font-mono text-xl tabular-nums">$1,488.00 · +4.2% · 820/1000 XP</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">APR 17 · TOKYO TRIP · STREAK 12D</p>
        </div>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 px-8 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] shadow-[inset_0_-2px_0_var(--pig-shadow)]" style={{ background: "var(--pig)" }}>
            <PiggyBank className="h-4 w-4" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Kash · Design System</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background">Open App</Link>
          <span className="font-mono text-[11px] text-muted-foreground">v0.2 · Apr 2026</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-8 py-8">
        <SectionColors />
        <SectionType />
        <SectionButtons />
        <SectionInputs />
        <SectionCards />
        <SectionJars />
        <SectionPiggy />
        <SectionGamification />
        <SectionNav />
        <SectionFeedback />
        <SectionModals />
        <SectionChips />
        <SectionMonthSwitcher />
      </main>

      <footer className="border-t border-border px-8 py-8 mt-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-3">
            <Piggy size={60} mood="happy" fill={0.7} />
            <div>
              <p className="font-display text-lg font-medium">Kash</p>
              <p className="text-xs text-muted-foreground">{"Save like it's a game. Spend like a grown-up."}</p>
            </div>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">DS · v0.2 · Fraunces · DM Sans · JetBrains Mono</p>
        </div>
      </footer>
    </div>
  );
}
