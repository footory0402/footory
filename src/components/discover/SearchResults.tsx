"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { POSITION_COLORS } from "@/lib/constants";
import type { Position } from "@/lib/constants";

interface SearchResultsProps {
  players: any[];
  teams: any[];
  loading: boolean;
  query: string;
}

export default function SearchResults({ players, teams, loading, query }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!query.trim()) return null;

  const empty = players.length === 0 && teams.length === 0;
  if (empty) {
    return (
      <div className="flex flex-col items-center pt-16">
        <span className="text-[28px] mb-2">🔍</span>
        <p className="text-[13px] text-text-3">검색 결과가 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {players.length > 0 && (
        <section>
          <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-2">선수</h3>
          <div className="space-y-1">
            {players.map((p: any) => (
              <Link
                key={p.id}
                href={`/p/${p.handle}`}
                className="flex items-center gap-3 rounded-[10px] bg-card p-3 active:bg-card-alt transition-colors"
              >
                <Avatar name={p.name} size="sm" level={p.level} imageUrl={p.avatar_url ?? undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-text-1 truncate">{p.name}</span>
                    {p.position && (
                      <span className="text-[10px]" style={{ color: POSITION_COLORS[p.position as Position] }}>
                        {p.position}
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-text-3">@{p.handle}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {teams.length > 0 && (
        <section>
          <h3 className="text-[12px] font-semibold text-text-3 uppercase tracking-wider mb-2">팀</h3>
          <div className="space-y-1">
            {teams.map((t: any) => (
              <Link
                key={t.id}
                href={`/team/${t.handle}`}
                className="flex items-center gap-3 rounded-[10px] bg-card p-3 active:bg-card-alt transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card-alt text-[14px]">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    "⚽"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-semibold text-text-1 truncate block">{t.name}</span>
                  <span className="text-[12px] text-text-3">
                    {t.city && `${t.city} · `}{t.member_count ?? 0}명
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
