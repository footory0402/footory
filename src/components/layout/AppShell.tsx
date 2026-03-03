"use client";

import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="pb-[calc(54px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTab />
    </>
  );
}
