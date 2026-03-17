"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileProvider } from "@/providers/ProfileProvider";
import AppHeader from "./AppHeader";
import BottomTab from "./BottomTab";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const BARE_ROUTES = ["/login", "/onboarding", "/signup", "/auth/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));
  const userIdRef = useRef<string | null>(null);

  // bfcache guard: 로그아웃 후 뒤로가기로 복원되면 새로고침
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  // 뒤로가기/앞으로가기 시 세션 유효성 검증
  // → 로그아웃 후 뒤로가기 or 다른 계정 전환 시 이전 계정 페이지 노출 차단
  useEffect(() => {
    if (isBare) return;

    const supabase = createClient();

    // 현재 유저 ID 기록
    supabase.auth.getSession().then(({ data: { session } }) => {
      userIdRef.current = session?.user?.id ?? null;
    });

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 세션 없음 → 로그아웃 상태에서 뒤로가기
        window.location.replace("/login");
        return;
      }
      if (userIdRef.current && session.user.id !== userIdRef.current) {
        // 다른 계정으로 전환됨 → 새로고침으로 데이터 갱신
        window.location.reload();
        return;
      }
      userIdRef.current = session.user.id;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    window.addEventListener("popstate", checkSession);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("popstate", checkSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isBare]);

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
