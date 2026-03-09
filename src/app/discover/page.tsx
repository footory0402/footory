"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { POSITIONS, POSITION_COLORS, type Position } from "@/lib/constants";

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

const STORAGE_KEY = "footory:discover-filters";

const POSITION_LABELS_SHORT: Record<Position, string> = {
  FW: "공격수",
  MF: "미드필더",
  DF: "수비수",
  GK: "골키퍼",
};

export default function DiscoverPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [regionFilter, setRegionFilter] = useState("");

  // Restore filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.positionFilter) setPositionFilter(parsed.positionFilter);
        if (parsed.regionFilter) setRegionFilter(parsed.regionFilter);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ positionFilter, regionFilter })
      );
    } catch {
      // ignore storage errors
    }
  }, [positionFilter, regionFilter]);

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

      {/* Filter tabs */}
      <div className="flex gap-2 mt-4">
        {FILTER_TABS.map((ft) => (
          <button
            key={ft.key}
            onClick={() => setTab(ft.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === ft.key
                ? "bg-accent text-bg"
                : "bg-card text-text-2 active:bg-card-alt"
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Position / Region filters (visible on player or all tab) */}
      {(tab === "all" || tab === "player") && (
        <div className="mt-3 space-y-2">
          {/* Position chips */}
          <div className="flex gap-1.5">
            {POSITIONS.map((pos) => {
              const active = positionFilter === pos;
              const color = POSITION_COLORS[pos];
              return (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(active ? null : pos)}
                  className="min-h-[32px] rounded-full px-3 text-xs font-medium transition-colors"
                  style={
                    active
                      ? { backgroundColor: `${color}20`, color }
                      : { backgroundColor: "var(--color-card)", color: "#A1A1AA" }
                  }
                >
                  {POSITION_LABELS_SHORT[pos]}
                </button>
              );
            })}
          </div>

          {/* Region text filter */}
          <input
            type="text"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            placeholder="지역으로 필터 (예: 서울, 경기)"
            className="h-8 w-full rounded-lg bg-card px-3 text-[12px] text-text-1 placeholder:text-text-3 outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      )}

      {/* Content sections */}
      <div className="mt-6 space-y-6">
        {/* "전체" tab: shows all sections in overview */}
        {tab === "all" && (
          <>
            <Section title="떠오르는 선수" emoji="🚀" seeMoreHref="/discover?tab=player">
              <RisingPlayers />
            </Section>

            <Section title="인기 선수 랭킹" emoji="🏆" seeMoreHref="/discover?tab=player">
              <PlayerRanking compact positionFilter={positionFilter ?? undefined} />
            </Section>

            <Section title="팀 랭킹" emoji="🏟" seeMoreHref="/discover?tab=team">
              <TeamRanking compact />
            </Section>

            <Section title="태그별 인기 클립" emoji="🎬" seeMoreHref="/discover?tab=tag">
              <TagGrid />
            </Section>
          </>
        )}

        {/* "선수" tab: full player ranking */}
        {tab === "player" && (
          <Section title="선수 랭킹" emoji="🏆">
            <PlayerRanking positionFilter={positionFilter ?? undefined} />
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

function Section({ title, emoji, children, seeMoreHref }: { title: string; emoji: string; children: React.ReactNode; seeMoreHref?: string }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-1">
          <span className="mr-1.5">{emoji}</span>{title}
        </h2>
        {seeMoreHref && (
          <a href={seeMoreHref} className="text-xs text-accent">더보기</a>
        )}
      </div>
      {children}
    </section>
  );
}
