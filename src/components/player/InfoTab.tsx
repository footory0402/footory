"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GrowthCard from "./GrowthCard";
import { MEASUREMENTS, getStatMeta } from "@/lib/constants";
import type { Stat } from "@/lib/types";
import type { Profile, Season } from "@/lib/types";

interface InfoTabProps {
  stats: Stat[];
  seasons: Season[];
  profile: Profile;
  onAddStat?: () => void;
  onUpdateStat?: (statType: string) => void;
  onDeleteStat?: (statId: string) => void;
  onAddSeason?: () => void;
}

export default function InfoTab({
  stats,
  seasons,
  profile,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
  onAddSeason,
}: InfoTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <GrowthSection stats={stats} onAddStat={onAddStat} onUpdateStat={onUpdateStat} onDeleteStat={onDeleteStat} />
      <TeamSection profile={profile} seasons={seasons} onAddSeason={onAddSeason} />
    </div>
  );
}

/* ── 섹션 헤더 ── */
function SectionHeader({ icon, title, count, action }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {/* Left accent bar */}
        <div className="h-4 w-[3px] rounded-full bg-accent shrink-0" />
        <span className="flex items-center gap-1.5">
          {icon}
          <span className="text-[14px] font-bold text-text-1">{title}</span>
        </span>
        {count != null && count > 0 && (
          <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/* ── 성장 기록 섹션 ── */
function GrowthSection({
  stats,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
}: {
  stats: Stat[];
  onAddStat?: () => void;
  onUpdateStat?: (statType: string) => void;
  onDeleteStat?: (statId: string) => void;
}) {
  return (
    <div>
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        }
        title="성장 기록"
        count={stats.length}
        action={
          onAddStat && (
            <button
              onClick={onAddStat}
              className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent transition-colors hover:bg-accent/20 active:scale-95"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              종목 추가
            </button>
          )
        }
      />

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => {
            const m = getStatMeta(stat.type);
            return (
              <GrowthCard
                key={stat.id}
                label={m.label}
                stat={stat}
                lowerIsBetter={"lowerIsBetter" in m ? m.lowerIsBetter : undefined}
                onUpdate={onUpdateStat ? () => onUpdateStat(stat.type) : undefined}
                onDelete={onDeleteStat ? () => onDeleteStat(stat.id) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-card py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text-1 mb-1">나의 성장을 기록해보세요</p>
            <p className="text-[11px] text-text-3 leading-relaxed">
              50m 달리기, 리프팅, 킥 속도 등을 기록하면<br />과거의 나와 비교하며 성장을 확인할 수 있어요
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 px-4">
            {MEASUREMENTS.slice(0, 4).map((m) => (
              <span key={m.id} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-text-3">
                {m.label}
              </span>
            ))}
          </div>
          {onAddStat && (
            <button
              onClick={onAddStat}
              className="mt-1 rounded-full bg-accent px-5 py-2 text-[12px] font-bold text-bg transition-colors hover:bg-accent/90 active:scale-95"
            >
              첫 기록 시작하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 소속 팀 섹션 ── */
function TeamSection({
  profile,
  seasons,
  onAddSeason,
}: {
  profile: Profile;
  seasons: Season[];
  onAddSeason?: () => void;
}) {
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const prevSeasons = seasons.filter((s) => !s.isCurrent);

  useEffect(() => {
    if (!profile.teamId) return;
    fetch(`/api/teams/${profile.teamId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.team?.logo_url) setTeamLogoUrl(data.team.logo_url); })
      .catch(() => {});
  }, [profile.teamId]);

  return (
    <div>
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
        }
        title="소속 팀"
        action={
          onAddSeason && (
            <button
              onClick={onAddSeason}
              className="flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold text-text-2 transition-colors hover:bg-white/[0.12] active:scale-95"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              팀 추가
            </button>
          )
        }
      />

      {profile.teamName ? (
        <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
          {/* Current team */}
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 shrink-0 overflow-hidden">
              {teamLogoUrl ? (
                <img src={teamLogoUrl} alt={profile.teamName} className="h-full w-full object-cover rounded-xl" />
              ) : (
                <span className="text-[22px]">⚽</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-text-1 truncate">{profile.teamName}</p>
              <p className="text-[11px] text-accent font-semibold mt-0.5">현재 소속</p>
            </div>
            {profile.teamId && (
              <Link
                href={`/team/${profile.teamId}`}
                className="shrink-0 rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent transition-colors hover:bg-accent/20"
              >
                팀 보기
              </Link>
            )}
          </div>

          {/* Previous seasons */}
          {prevSeasons.length > 0 && (
            <>
              <div className="mx-4 h-px bg-white/[0.05]" />
              <div className="px-4 py-3">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-3">이전 소속</p>
                <div className="flex flex-col gap-0">
                  {prevSeasons.map((s, i) => (
                    <div key={s.id} className="relative flex items-start gap-3 pb-3">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-white/20" />
                        {i < prevSeasons.length - 1 && (
                          <div className="w-px flex-1 bg-white/[0.06] mt-1" style={{ minHeight: 16 }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[12px] font-semibold text-text-2 truncate">{s.teamName}</span>
                          <span className="shrink-0 text-[11px] text-text-3 tabular-nums">{s.year}</span>
                        </div>
                        {(s.gamesPlayed != null || s.goals != null) && (
                          <p className="mt-0.5 text-[11px] text-text-3">
                            {s.gamesPlayed != null ? `${s.gamesPlayed}경기` : ""}
                            {s.goals ? ` · ${s.goals}골` : ""}
                            {s.assists ? ` · ${s.assists}어시` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-card py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text-1 mb-1">아직 소속 팀이 없어요</p>
            <p className="text-[11px] text-text-3">팀을 등록하면 프로필에 표시돼요</p>
          </div>
        </div>
      )}
    </div>
  );
}
