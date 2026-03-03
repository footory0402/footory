"use client";

import { useState } from "react";
import {
  useSearch,
  useHotHighlights,
  useRecentMedals,
  useRecommendedPlayers,
  usePopularTeams,
} from "@/hooks/useDiscover";
import SearchResults from "@/components/discover/SearchResults";
import HotHighlights from "@/components/discover/HotHighlights";
import RecentMedals from "@/components/discover/RecentMedals";
import RecommendedPlayers from "@/components/discover/RecommendedPlayers";
import PopularTeams from "@/components/discover/PopularTeams";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;

  const search = useSearch(query);
  const highlights = useHotHighlights();
  const medals = useRecentMedals();
  const players = useRecommendedPlayers();
  const teams = usePopularTeams();

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Search Bar */}
      <div className="flex h-10 items-center rounded-full bg-card-alt px-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="선수, 팀, 핸들 검색"
          className="ml-2 flex-1 bg-transparent text-[13px] text-text-1 placeholder:text-text-3 outline-none"
        />
        {isSearching && (
          <button onClick={() => setQuery("")} className="text-text-3 text-[18px] leading-none">
            ×
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="mt-4">
          <SearchResults
            players={search.players}
            teams={search.teams}
            loading={search.loading}
            query={query}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Hot Highlights */}
          <Section title="인기 하이라이트" emoji="🔥">
            <HotHighlights items={highlights.items} loading={highlights.loading} />
          </Section>

          {/* Recent Medals */}
          <Section title="최근 메달" emoji="🏅">
            <RecentMedals medals={medals.medals} loading={medals.loading} />
          </Section>

          {/* Recommended Players */}
          <Section title="추천 선수" emoji="⭐">
            <RecommendedPlayers players={players.players} loading={players.loading} />
          </Section>

          {/* Popular Teams */}
          <Section title="인기 팀" emoji="🏟">
            <PopularTeams teams={teams.teams} loading={teams.loading} />
          </Section>
        </div>
      )}
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
