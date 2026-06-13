"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CircleDollarSign, Globe, Landmark, Menu, Plus, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface BottomNavProps {
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const handleAdd = onAdd ?? (() => router.push("/dashboard?add=1"));

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: CircleDollarSign },
    { href: "/goals", label: t("goals"), icon: Target },
    null, // FAB
    { href: "/assets", label: t("assets"), icon: Landmark },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around rounded-full bg-foreground px-3 py-2.5 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.3)] lg:hidden">
      {navItems.map((item) => {
        if (!item) {
          return (
            <button
              key="add"
              onClick={handleAdd}
              aria-label={t("addTransaction")}
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

      {/* "More" menu: secondary destinations + language */}
      <Sheet>
        <SheetTrigger
          aria-label={t("more")}
          className={cn(
            "flex flex-col items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            pathname.startsWith("/analyse")
              ? "bg-background text-foreground"
              : "text-background/55 hover:text-background/80"
          )}
        >
          <Menu className="h-[18px] w-[18px]" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display text-lg">{t("more")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href="/analyse"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  <BarChart3 className="h-5 w-5 shrink-0 text-muted-foreground" />
                  {t("analyse")}
                </Link>
              }
            />
            <div className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium">
              <span className="flex items-center gap-3">
                <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                {t("language")}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
