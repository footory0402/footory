"use client";

import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/providers/ProfileProvider";
import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const BARE_ROUTES = ["/login", "/onboarding", "/signup", "/auth/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <ProfileProvider>
      <AppHeader />
      <main className="pb-[calc(54px+env(safe-area-inset-bottom)+20px)]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomTab />
    </ProfileProvider>
  );
}
