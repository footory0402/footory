"use client";

import Link from "next/link";
import type { DiscoverTeam } from "@/types/discover";

interface PopularTeamsProps {
  teams: DiscoverTeam[];
  loading: boolean;
}

export default function PopularTeams({ teams, loading }: PopularTeamsProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-36 shrink-0 animate-pulse rounded-[12px] bg-card" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[12px] bg-card py-6">
        <p className="text-[13px] text-text-3">등록된 팀이 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {teams.map((t) => (
        <Link
          key={t.id}
          href={`/team/${t.id}`}
          className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-[12px] bg-card p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card-alt text-[18px]">
            {t.logo_url ? (
              <img src={t.logo_url} alt={t.name} loading="lazy" className="h-full w-full rounded-full object-cover" />
            ) : (
              "⚽"
            )}
          </div>
          <span className="text-[13px] font-semibold text-text-1 text-center truncate w-full">
            {t.name}
          </span>
          <span className="text-[11px] text-text-3">
            {t.city && `${t.city} · `}{t.member_count ?? 0}명
          </span>
        </Link>
      ))}
    </div>
  );
}
