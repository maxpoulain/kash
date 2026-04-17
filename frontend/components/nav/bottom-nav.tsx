"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  const navItems = [
    { href: "/dashboard", label: "Transactions", icon: LayoutDashboard, side: "left" as const },
    { href: "/budget", label: "Budget", icon: PiggyBank, side: "right" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around p-2">
        {navItems.filter((i) => i.side === "left").map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all",
              pathname === href ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}

        <button
          onClick={handleAdd}
          aria-label="Ajouter une transaction"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>

        {navItems.filter((i) => i.side === "right").map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all",
              pathname === href ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
