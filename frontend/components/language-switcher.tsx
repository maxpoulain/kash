"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const otherLocale = locale === "en" ? "fr" : "en";
  const href = `/${otherLocale}${pathname}`;

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
        className
      )}
    >
      {otherLocale}
    </a>
  );
}
