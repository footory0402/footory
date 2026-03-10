"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUnreadCount } from "@/hooks/useNotifications";

export default function AppHeader() {
  const router = useRouter();
  const { count, fetchCount } = useUnreadCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchCount();
      }
    };

    const timeout = window.setTimeout(fetchWhenVisible, 250);
    const interval = window.setInterval(fetchWhenVisible, 60_000);

    document.addEventListener("visibilitychange", fetchWhenVisible);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchWhenVisible);
    };
  }, [fetchCount]);

  // Close search on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 glass-nav">
        {/* Top row: Logo + icons */}
        <div className="flex h-[44px] items-center justify-between px-4">
          <Link href="/" className="font-brand text-[20px] font-bold tracking-wide text-accent">
            FOOTORY
          </Link>
          <div className="flex items-center gap-1">
            {/* DM */}
            <Link
              href="/dm"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
              aria-label="메시지"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
              aria-label="알림"
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

            {/* Settings */}
            <Link
              href="/profile/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors active:bg-card"
              aria-label="설정"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-white/[0.08] px-3.5 py-2.5 text-[13px] text-text-3 transition-colors active:bg-white/[0.12] border border-white/[0.06]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            선수, 팀, 스킬 검색...
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-bg">
          <div className="mx-auto max-w-[430px]">
            {/* Search input */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="선수, 팀, 스킬 검색..."
                autoFocus
                className="flex-1 bg-transparent text-[15px] text-text-1 placeholder:text-text-3 outline-none"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="shrink-0 text-[13px] font-medium text-text-2"
              >
                취소
              </button>
            </form>

            {/* Search suggestions */}
            <div className="px-4 py-4">
              {/* Popular tags */}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">인기 태그</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {["⚽ 드리블", "🦵 슈팅", "🎯 볼컨트롤", "🏐 패스", "🛡️ 수비"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const tagName = tag.split(" ")[1];
                      router.push(`/discover?tag=${tagName}`);
                      setSearchOpen(false);
                    }}
                    className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium text-text-2 transition-colors active:bg-white/[0.1]"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Quick links */}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">바로가기</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { router.push("/discover?sort=followers"); setSearchOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-white/[0.05]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-base">🏆</span>
                  <div>
                    <p className="text-[13px] font-medium text-text-1">선수 랭킹</p>
                    <p className="text-[11px] text-text-3">팔로워 · 응원 순</p>
                  </div>
                </button>
                <button
                  onClick={() => { router.push("/discover?tab=teams"); setSearchOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-white/[0.05]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue/10 text-base">👥</span>
                  <div>
                    <p className="text-[13px] font-medium text-text-1">팀 둘러보기</p>
                    <p className="text-[11px] text-text-3">팀 검색 · 가입</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
