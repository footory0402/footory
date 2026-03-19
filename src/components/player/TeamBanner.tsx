"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Profile, Season } from "@/lib/types";

interface TeamBannerProps {
  profile: Profile;
  seasons: Season[];
  onAddSeason?: () => void;
}

export default function TeamBanner({ profile, seasons, onAddSeason }: TeamBannerProps) {
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

        {/* 현재 소속 */}
        <div className="px-4 pt-3 pb-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-3">현재 소속</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0 overflow-hidden">
              {teamLogoUrl ? (
                <img src={teamLogoUrl} alt={profile.teamName} className="h-full w-full object-cover rounded-xl" />
              ) : (
                <span className="text-[20px]">⚽</span>
              )}
            </div>
            <span className="min-w-0 flex-1 text-[15px] font-bold text-text-1 truncate">{profile.teamName}</span>
            {profile.teamId && (
              <Link
                href={`/team/${profile.teamId}`}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-2 text-[11px] font-bold text-text-2 transition-colors active:scale-95"
              >
                팀 보기
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* 이전 소속 이력 */}
        <div className="border-t border-white/[0.05] px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3">이전 소속 이력</p>
            {onAddSeason && (
              <button
                onClick={onAddSeason}
                className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-text-2 transition-colors active:scale-95"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                이력 추가
              </button>
            )}
          </div>

          {prevSeasons.length > 0 ? (
            <div className="flex flex-col gap-0">
              {prevSeasons.map((s, i) => (
                <div key={s.id} className="relative flex items-start gap-3 pb-2.5">
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                    {i < prevSeasons.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] mt-1" style={{ minHeight: 14 }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold text-text-2 truncate">{s.teamName}</span>
                      <span className="shrink-0 text-[11px] text-text-3 tabular-nums">{s.year}</span>
                    </div>
                    {(s.gamesPlayed != null || s.goals != null) && (
                      <p className="mt-0.5 text-[10px] text-text-3">
                        {s.gamesPlayed != null ? `${s.gamesPlayed}경기` : ""}
                        {s.goals ? ` · ${s.goals}골` : ""}
                        {s.assists ? ` · ${s.assists}어시` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-3">아직 이력이 없어요. 이전 팀을 기록해보세요.</p>
          )}
        </div>

        {/* 진학 / 팀 이동 */}
        <Link
          href="/team"
          className="flex items-center gap-2.5 border-t border-white/[0.05] px-4 py-3 transition-colors active:bg-white/[0.03]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-2">팀 만들기 · 가입하기</p>
            <p className="text-[10px] text-text-3 mt-0.5">새 팀을 직접 만들거나 초대코드로 합류</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

      </div>
    </div>
  );
}
