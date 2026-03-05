"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

const playerTabs = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/mvp", label: "MVP", icon: MvpIcon },
  { href: "/dm", label: "DM", icon: DmIcon },
  { href: "/profile", label: "프로필", icon: UserIcon },
  { href: "/team", label: "팀", icon: TeamIcon },
] as const;

const parentTabs = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/dm", label: "DM", icon: DmIcon },
  { href: "/profile/settings", label: "설정", icon: SettingsIcon },
] as const;

export default function BottomTab() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = usePermissions();

  const tabs = role === "parent" ? parentTabs : playerTabs;

  return (
    <nav aria-label="하단 탭 네비게이션" className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-bg/95">
      <div className="flex h-[54px] items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
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
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function DmIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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

function TeamIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-accent" : "text-text-3"}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
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
