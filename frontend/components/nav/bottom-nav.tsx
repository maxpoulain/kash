"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const leftItems = [
  { href: "/dashboard", label: "Transactions", icon: LayoutDashboard },
];

const rightItems = [
  { href: "/budget", label: "Budget", icon: PiggyBank },
];

interface BottomNavProps {
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const pathname = usePathname();

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex max-w-lg items-center justify-around p-2">
        {leftItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {onAdd && (
          <button
            onClick={onAdd}
            aria-label="Ajouter une transaction"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {rightItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
