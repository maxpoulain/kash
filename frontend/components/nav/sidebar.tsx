"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, PiggyBank, Plus, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PiggyMark } from "@/components/kash-piggy";

interface SidebarProps {
  onAdd?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Transactions", icon: CircleDollarSign },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/goals", label: "Objectifs", icon: Target },
  { href: "/assets", label: "Patrimoine", icon: TrendingUp },
];

export function Sidebar({ onAdd }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-1 border-r border-border bg-muted p-5 lg:flex">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ background: "var(--pig)", boxShadow: "inset 0 -2px 0 var(--pig-shadow)" }}
        >
          <PiggyMark size={20} />
        </div>
        <span className="font-display text-[22px] font-semibold leading-none tracking-tight">Kash</span>
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

      {/* Add transaction */}
      <button
        onClick={handleAdd}
        className="mt-1 flex items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-[13px] font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <Plus className="h-4 w-4 shrink-0" />
        Add transaction
      </button>

    </aside>
  );
}
