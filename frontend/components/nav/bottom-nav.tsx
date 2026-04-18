"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PiggyBank, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/budget", label: "Budget", icon: PiggyBank },
    null, // FAB
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around rounded-full bg-foreground px-3 py-2.5 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.3)] lg:hidden">
      {navItems.map((item) => {
        if (!item) {
          return (
            <button
              key="add"
              onClick={handleAdd}
              aria-label="Ajouter une transaction"
              className="-mt-7 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-primary text-foreground shadow-[inset_0_-3px_0_var(--pig-shadow),0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          );
        }
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]) && !item.href.includes("#"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-background text-foreground"
                : "text-background/55 hover:text-background/80"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </Link>
        );
      })}
    </nav>
  );
}
