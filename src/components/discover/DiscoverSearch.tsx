"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/useDiscover";
import SearchResults from "./SearchResults";

export default function DiscoverSearch() {
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const search = useSearch(query);

  return (
    <>
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
      {isSearching && (
        <div className="mt-4">
          <SearchResults
            players={search.players}
            teams={search.teams}
            loading={search.loading}
            query={query}
          />
        </div>
      )}
    </>
  );
}
