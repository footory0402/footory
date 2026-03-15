"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Profile, Season } from "@/lib/types";

interface TeamBannerProps {
  profile: Profile;
  seasons: Season[];
  onAddSeason?: () => void;
  onScrollToSeasons?: () => void;
}

export default function TeamBanner({ profile, seasons, onAddSeason, onScrollToSeasons }: TeamBannerProps) {
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const prevSeasons = seasons.filter((s) => !s.isCurrent);

  useEffect(() => {
    if (!profile.teamId) return;
    fetch(`/api/teams/${profile.teamId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.team?.logo_url) setTeamLogoUrl(data.team.logo_url); })
      .catch(() => {});
  }, [profile.teamId]);

  /* ── 팀 미소속 ── */
  if (!profile.teamName) {
    return (
      <div className="mt-3 animate-fade-up">
        <Link
          href="/team"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card px-4 py-3 transition-colors active:bg-white/[0.04]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-2">아직 소속 팀이 없어요</p>
            <p className="text-[10px] text-text-3 mt-0.5">팀을 만들거나 초대코드로 가입해보세요</p>
          </div>
          <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent">
            가입하기
          </span>
        </Link>
      </div>
    );
  }

  /* ── 팀 소속 ── */
  return (
    <div className="mt-3 animate-fade-up">
      <div className="rounded-xl border border-white/[0.06] bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Team logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0 overflow-hidden">
            {teamLogoUrl ? (
              <img src={teamLogoUrl} alt={profile.teamName} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <span className="text-[20px]">⚽</span>
            )}
          </div>

          {/* Team info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-text-1 truncate">{profile.teamName}</span>
              <span className="shrink-0 inline-flex items-center rounded-full bg-accent/12 px-2 py-0.5 text-[9px] font-bold text-accent tracking-wide">
                현재 소속
              </span>
            </div>
            {/* Previous teams hint */}
            {prevSeasons.length > 0 ? (
              <button
                onClick={onScrollToSeasons}
                className="mt-0.5 text-[11px] text-text-3 hover:text-text-2 transition-colors"
              >
                외 {prevSeasons.length}팀 이력 보기 →
              </button>
            ) : (
              onAddSeason && (
                <button
                  onClick={onAddSeason}
                  className="mt-0.5 text-[11px] text-text-3 hover:text-text-2 transition-colors"
                >
                  이전 소속 추가하기 →
                </button>
              )
            )}
          </div>

          {/* Team page link */}
          {profile.teamId && (
            <Link
              href={`/team/${profile.teamId}`}
              className="shrink-0 flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-2 text-[11px] font-bold text-text-2 transition-colors hover:bg-white/[0.10] active:scale-95"
            >
              팀 보기
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
