"use client";

import { useState } from "react";
import PlayerRanking from "@/components/explore/PlayerRanking";
import RisingPlayers from "@/components/explore/RisingPlayers";
import TeamRanking from "@/components/explore/TeamRanking";
import TagGrid from "@/components/explore/TagGrid";
import SearchOverlay from "@/components/explore/SearchOverlay";

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
        className="flex h-10 w-full items-center rounded-full bg-card-alt px-4 text-left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span className="ml-2 text-[13px] text-text-3">선수, 팀, 태그 검색</span>
      </button>

      {/* Filter tabs */}
      <div className="flex gap-2 mt-4">
        {FILTER_TABS.map((ft) => (
          <button
            key={ft.key}
            onClick={() => setTab(ft.key)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              tab === ft.key
                ? "bg-accent text-bg"
                : "bg-card text-text-2 active:bg-card-alt"
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Content sections */}
      <div className="mt-6 space-y-6">
        {/* "전체" tab: shows all sections in overview */}
        {tab === "all" && (
          <>
            <Section title="떠오르는 선수" emoji="🚀">
              <RisingPlayers />
            </Section>

            <Section title="인기 선수 랭킹" emoji="🏆">
              <PlayerRanking compact />
            </Section>

            <Section title="팀 랭킹" emoji="🏟">
              <TeamRanking compact />
            </Section>

            <Section title="태그별 인기 클립" emoji="🎬">
              <TagGrid />
            </Section>
          </>
        )}

        {/* "선수" tab: full player ranking */}
        {tab === "player" && (
          <Section title="선수 랭킹" emoji="🏆">
            <PlayerRanking />
          </Section>
        )}

        {/* "팀" tab: full team ranking */}
        {tab === "team" && (
          <Section title="팀 랭킹" emoji="🏟">
            <TeamRanking />
          </Section>
        )}

        {/* "태그" tab: full tag grid */}
        {tab === "tag" && (
          <Section title="태그별 인기 클립" emoji="🎬">
            <TagGrid />
          </Section>
        )}
      </div>

      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-text-1">
          {emoji} {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
