import { PiggyBank } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <PiggyBank className="size-6" />
        </div>
        <span className="font-display text-2xl font-semibold">Kash</span>
      </Link>
      {children}
    </div>
  );
}
