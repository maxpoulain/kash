import { PiggyBank } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]">
          <PiggyBank className="size-6" />
        </div>
        <span className="font-display text-2xl font-semibold">Kash</span>
      </Link>
      {children}
    </div>
  );
}
