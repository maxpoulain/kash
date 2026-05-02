"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, PiggyBank, Plus, Target, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";

interface SidebarProps {
  onAdd?: () => void;
}

export function Sidebar({ onAdd }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  const mainNav = [
    { href: "/dashboard", label: t("dashboard"), icon: CircleDollarSign },
    { href: "/goals", label: t("goals"), icon: Target },
    { href: "/assets", label: t("assets"), icon: TrendingUp },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col self-start overflow-y-auto border-r border-border bg-muted p-5 pb-14 lg:flex">
      <div className="flex flex-1 flex-col gap-1">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]">
            <PiggyBank className="h-5 w-5" />
          </div>
          <span className="font-display text-[22px] font-semibold leading-none tracking-tight">Kash</span>
        </div>

        {/* Main nav */}
        <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("main")}
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
          {t("addTransaction")}
        </button>
      </div>

      {/* Language switcher */}
      <div className="pt-4">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
