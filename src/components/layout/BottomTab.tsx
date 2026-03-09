"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfileContext } from "@/providers/ProfileProvider";
import UploadBottomSheet from "@/components/upload/UploadBottomSheet";

/* ── Tab definitions per role ── */

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ active: boolean }>;
  isCenter?: boolean;
}

const playerTabs: Tab[] = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/discover", label: "탐색", icon: DiscoverIcon },
  { href: "/upload", label: "업로드", icon: PlusIcon, isCenter: true },
  { href: "/mvp", label: "MVP", icon: MvpIcon },
  { href: "/profile", label: "프로필", icon: UserIcon },
];

const parentTabs: Tab[] = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/discover", label: "탐색", icon: DiscoverIcon },
  { href: "/upload", label: "영상 올려주기", icon: PlusIcon, isCenter: true },
  { href: "/profile/settings", label: "설정", icon: SettingsIcon },
];

const scoutTabs: Tab[] = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/discover", label: "탐색", icon: DiscoverIcon },
  { href: "/scout/watchlist", label: "관심", icon: StarIcon, isCenter: true },
  { href: "/mvp", label: "MVP", icon: MvpIcon },
  { href: "/profile", label: "프로필", icon: UserIcon },
];

function getTabsForRole(role: string): Tab[] {
  if (role === "parent") return parentTabs;
  if (role === "scout") return scoutTabs;
  return playerTabs;
}

// TODO: Replace with real challenge API when available
function useActiveChallenge(): { tag: string; title: string } | null {
  return null;
}

export default function BottomTab() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, error } = useProfileContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeChallenge = useActiveChallenge();

  const role = profile?.role ?? "player";
  const isGuest = error === "not_authenticated";
  const isLoading = loading || (!isGuest && !profile?.id);
  const tabs = getTabsForRole(role);

  const handleCenterTap = (tab: Tab) => {
    if (tab.href === "/upload" && (role === "player" || role === "parent")) {
      setSheetOpen(true);
      return;
    }
    router.push(tab.href);
  };

  return (
    <>
      <UploadBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        challengeTag={activeChallenge?.tag}
        challengeTitle={activeChallenge?.title}
      />

      <nav aria-label="하단 탭 네비게이션" className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-white/5 glass-nav">
        <div
          className={`flex h-[54px] items-center justify-around pb-[env(safe-area-inset-bottom)] transition-opacity duration-150 ${
            isLoading || isGuest ? "opacity-0" : "opacity-100"
          }`}
        >
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            /* ── Center action button (upload / watchlist) ── */
            if (tab.isCenter) {
              return (
                <button
                  key={tab.href}
                  type="button"
                  onClick={() => handleCenterTap(tab)}
                  className="relative flex flex-col items-center"
                >
                  <div className="relative -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-[0_0_12px_rgba(212,168,83,0.35)] transition-transform active:scale-95">
                    <tab.icon active={false} />
                  </div>
                </button>
              );
            }

            /* ── Normal tab ── */
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => router.prefetch(tab.href)}
                onFocus={() => router.prefetch(tab.href)}
                className="relative flex flex-1 flex-col items-center gap-0.5 pt-1.5"
              >
                {active && (
                  <span className="absolute top-0 h-[2px] w-8 rounded-full bg-accent shadow-[0_0_8px_rgba(212,168,83,0.4)]" />
                )}
                <tab.icon active={active} />
                <span
                  className={`text-[10px] font-medium ${active ? "text-accent" : "text-text-3"}`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* ── Icons ── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 00-16 0" />
    </svg>
  );
}

function MvpIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
