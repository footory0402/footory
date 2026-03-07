"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useUnreadDmCount } from "@/hooks/useDm";
import { usePermissions } from "@/hooks/usePermissions";
import { NOTIFICATION_POLL_MS } from "@/lib/constants";

interface AppHeaderProps {
  onSearchOpen?: () => void;
}

export default function AppHeader({ onSearchOpen }: AppHeaderProps) {
  const pathname = usePathname();
  const { count, fetchCount } = useUnreadCount();
  const { userId } = usePermissions({ enabled: true });
  const { count: dmCount, fetchCount: fetchDmCount } = useUnreadDmCount(userId ?? null);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, NOTIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (!userId) return;
    fetchDmCount();
    const interval = setInterval(fetchDmCount, NOTIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, [userId, fetchDmCount]);

  return (
    <header className="sticky top-0 z-40 flex h-[42px] items-center justify-between border-b border-border bg-bg/95 px-4">
      <h1 className="font-brand text-[20px] font-bold tracking-wide text-accent">
        FOOTORY
      </h1>
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
          aria-label="검색"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* DM — C14: 미읽은 DM 뱃지 */}
        <Link
          href="/dm"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {dmCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
              {dmCount > 99 ? "99+" : dmCount}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
        {pathname.startsWith("/profile") && !pathname.includes("/settings") && (
          <>
            <HeaderButton />
            <Link href="/profile/settings" className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </Link>
          </>
        )}
        {pathname.startsWith("/team") && <HeaderButton />}
      </div>
    </header>
  );
}

function HeaderButton() {
  return (
    <button className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17l9.2-9.2M17 17V7H7" />
      </svg>
    </button>
  );
}
