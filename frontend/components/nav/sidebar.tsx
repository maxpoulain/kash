"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PiggyBank,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PiggyMark } from "@/components/kash-piggy";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jars", label: "Jars", icon: PiggyBank },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/assets", label: "Assets", icon: TrendingUp },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

const playNav = [
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Zap, badge: 3 },
];

interface SidebarProps {
  onAdd?: () => void;
}

export function Sidebar({ onAdd }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-background lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: "var(--pig)",
            boxShadow: "inset 0 -2px 0 var(--pig-shadow)",
          }}
        >
          <PiggyMark size={22} />
        </div>
        <span className="font-display text-2xl font-semibold tracking-tight">
          Kash
        </span>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-6 px-3 py-2">
        {/* Main section */}
        <div className="flex flex-col gap-1">
          <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Main
          </p>
          {mainNav.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (pathname.startsWith(href) &&
                href !== "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Play section */}
        <div className="flex flex-col gap-1">
          <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Play
          </p>
          {playNav.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold text-background"
                    style={{ background: "var(--pig)" }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Add transaction button at bottom */}
      {onAdd && (
        <div className="p-4">
          <button
            onClick={onAdd}
            className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90"
          >
            + New transaction
          </button>
        </div>
      )}
    </aside>
  );
}
