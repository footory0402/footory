"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const PlayerRanking = dynamic(() => import("@/components/explore/PlayerRanking"), { ssr: false });
const RisingPlayers = dynamic(() => import("@/components/explore/RisingPlayers"), { ssr: false });
const TeamRanking = dynamic(() => import("@/components/explore/TeamRanking"), { ssr: false });
const TagGrid = dynamic(() => import("@/components/explore/TagGrid"), { ssr: false });
const SearchOverlay = dynamic(() => import("@/components/explore/SearchOverlay"), { ssr: false });

type FilterTab = "all" | "player" | "team" | "tag";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "player", label: "선수" },
  { key: "team", label: "팀" },
  { key: "tag", label: "태그" },
];

export default function DiscoverPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Search bar (tap to open overlay) */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-10 w-full items-center rounded-full bg-card px-4 text-left shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] border border-white/[0.06]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span className="ml-2 text-xs text-text-3">선수, 팀, 태그 검색</span>
      </button>

      {/* Underline tab bar */}
      <div className="flex border-b border-white/[0.06] mt-3">
        {FILTER_TABS.map((ft) => (
          <button
            key={ft.key}
            onClick={() => setTab(ft.key)}
            className={`flex-1 pb-2.5 text-sm font-medium relative ${
              tab === ft.key ? "text-accent" : "text-text-3"
            }`}
          >
            {ft.label}
            {tab === ft.key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content sections */}
      <div className="mt-6 space-y-8">
        {/* "전체" tab: shows all sections in overview */}
        {tab === "all" && (
          <>
            <Section title="떠오르는 선수" seeMoreHref="/discover?tab=player">
              <RisingPlayers />
            </Section>

            <Section title="인기 선수 랭킹" seeMoreHref="/discover?tab=player">
              <PlayerRanking compact />
            </Section>

            <Section title="팀 랭킹" seeMoreHref="/discover?tab=team">
              <TeamRanking compact />
            </Section>

            <Section title="태그별 인기 클립" seeMoreHref="/discover?tab=tag">
              <TagGrid />
            </Section>
          </>
        )}

        {/* "선수" tab: full player ranking */}
        {tab === "player" && (
          <Section title="선수 랭킹">
            <PlayerRanking />
          </Section>
        )}

        {/* "팀" tab: full team ranking */}
        {tab === "team" && (
          <Section title="팀 랭킹">
            <TeamRanking />
          </Section>
        )}

        {/* "태그" tab: full tag grid */}
        {tab === "tag" && (
          <Section title="태그별 인기 클립">
            <TagGrid />
          </Section>
        )}
      </div>

      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Section({ title, children, seeMoreHref }: { title: string; children: React.ReactNode; seeMoreHref?: string }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold tracking-tight text-text-1">
          {title}
        </h2>
        {seeMoreHref && (
          <a href={seeMoreHref} className="text-xs text-text-3">더보기 →</a>
        )}
      </div>
      {children}
    </section>
  );
}
