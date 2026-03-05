"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const SearchOverlay = dynamic(() => import("@/components/explore/SearchOverlay"), {
  ssr: false,
});

const BARE_ROUTES = ["/login", "/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));
  const [searchOpen, setSearchOpen] = useState(false);

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <AppHeader onSearchOpen={() => setSearchOpen(true)} />
      <main className="pb-[calc(54px+env(safe-area-inset-bottom))]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomTab />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
