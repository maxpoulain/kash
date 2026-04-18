"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PiggyBank, Coins, BarChart3, Flame, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { KashLogo } from "@/components/kash-logo";

interface SidebarProps {
  onAdd?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/budget#stats", label: "Insights", icon: BarChart3 },
];

export function Sidebar({ onAdd }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-1.5 border-r border-border bg-muted p-5 lg:flex">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]">
          <KashLogo size="xs" />
        </div>
        <span className="font-display text-[22px] font-semibold tracking-tight">Kash</span>
      </div>

      {/* Main nav */}
      <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Main
      </p>
      {mainNav.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (pathname.startsWith(href.split("#")[0]) && !href.includes("#") && href !== "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-[13px] font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}

      {/* Add transaction button */}
      <button
        onClick={handleAdd}
        className="mt-2 flex items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-[13px] font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <Plus className="h-4 w-4 shrink-0" />
        Add transaction
      </button>

      {/* Streak card */}
      <div className="relative mt-auto overflow-hidden rounded-2xl bg-primary p-3">
        <p className="font-display text-sm font-semibold leading-tight">Streak on fire</p>
        <p className="mt-0.5 text-[11px] text-primary-foreground/60">Keep saving every day.</p>
        <Flame className="absolute -bottom-1 -right-1 h-10 w-10 opacity-30" strokeWidth={1.5} />
      </div>
    </aside>
  );
}
