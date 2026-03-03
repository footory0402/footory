"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";

const BARE_ROUTES = ["/login", "/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  if (isBare) {
    return <>{children}</>;
  }

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
