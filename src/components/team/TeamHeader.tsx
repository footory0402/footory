"use client";

import type { Team } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

interface TeamHeaderProps {
  team: Team;
}

export default function TeamHeader({ team }: TeamHeaderProps) {
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

      {team.description && (
        <p className="mt-3 text-center text-[13px] leading-relaxed text-text-2">
          {team.description}
        </p>
      )}
    </div>
  );
}
