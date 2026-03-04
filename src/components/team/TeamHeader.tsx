"use client";

import type { Team } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

interface TeamHeaderProps {
  team: Team;
  activityScore?: number;
  rank?: number;
  mvpCount?: number;
}

export default function TeamHeader({ team, activityScore, rank, mvpCount }: TeamHeaderProps) {
  return (
    <div className="flex flex-col items-center px-4 pb-4 pt-6">
      <Avatar
        name={team.name}
        imageUrl={team.logoUrl}
        size="lg"
      />
      <h1 className="text-[20px] font-bold text-text-1">{team.name}</h1>
      <p className="mt-0.5 text-[13px] text-text-3">@{team.handle}</p>

      <div className="mt-3 flex items-center gap-4 text-[13px]">
        {team.city && (
          <span className="text-text-2">
            <svg className="mr-1 inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {team.city}
          </span>
        )}
        <span className="text-text-2">
          <svg className="mr-1 inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          {team.memberCount}명
        </span>
      </div>

      {/* Activity score + rank */}
      {(activityScore !== undefined || mvpCount !== undefined) && (
        <div className="mt-3 flex items-center gap-3">
          {rank !== undefined && rank > 0 && (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[12px] font-semibold text-accent">
              팀 랭킹 {rank}위
            </span>
          )}
          {activityScore !== undefined && activityScore > 0 && (
            <span className="text-[12px] text-text-3">
              활동 점수 <span className="font-stat font-bold text-text-1">{activityScore}</span>
            </span>
          )}
          {mvpCount !== undefined && mvpCount > 0 && (
            <span className="text-[12px] text-text-3">
              MVP 배출 <span className="font-stat font-bold text-accent">{mvpCount}</span>
            </span>
          )}
        </div>
      )}

      {team.description && (
        <p className="mt-3 text-center text-[13px] leading-relaxed text-text-2">
          {team.description}
        </p>
      )}
    </div>
  );
}
