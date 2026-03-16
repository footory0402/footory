"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/providers/ProfileProvider";
import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const BARE_ROUTES = ["/login", "/onboarding", "/signup", "/auth/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  // bfcache guard: 로그아웃 후 뒤로가기로 복원되면 새로고침
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <ProfileProvider>
      <AppHeader />
      <main className="pb-[calc(60px+env(safe-area-inset-bottom))]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomTab />
    </ProfileProvider>
  );
}
