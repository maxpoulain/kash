"use client";

import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  onAdd?: () => void;
}

export function AppLayout({ children, onAdd }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onAdd={onAdd} />
      <main className="flex min-h-screen flex-1 flex-col min-w-0">
        {children}
      </main>
      <BottomNav onAdd={onAdd} />
    </div>
  );
}
