"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { KashLogo } from "@/components/kash-logo";

const navItems = [
  { href: "/dashboard", label: "Transactions", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: PiggyBank },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className={cn("flex items-center p-4 mb-4", expanded ? "justify-between" : "justify-center")}>
        {expanded && <KashLogo variant="minimal" size="sm" showText />}
        {!expanded && <KashLogo variant="minimal" size="sm" />}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            aria-label="Réduire la sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mx-auto mb-4 p-1 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          aria-label="Agrandir la sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={!expanded ? label : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
              pathname === href
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              !expanded && "justify-center"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {expanded && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
