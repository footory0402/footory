"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import GrowthCard from "./GrowthCard";
import RadarChart from "./RadarChart";
import { MEASUREMENTS, getStatMeta, RADAR_STATS, type RadarStatId } from "@/lib/constants";
import { EMPTY_RADAR_STATS } from "@/lib/radar-calc";
import type { Stat } from "@/lib/types";
import type { Profile, Season } from "@/lib/types";

interface InfoTabProps {
  stats: Stat[];
  seasons: Season[];
  profile: Profile;
  percentiles?: Record<string, number>;
  radarStats?: Record<RadarStatId, number>;
  onAddStat?: () => void;
  onUpdateStat?: (statType: string) => void;
  onDeleteStat?: (statId: string) => void;
  onAddSeason?: () => void;
}

export default function InfoTab({
  stats,
  seasons,
  profile,
  percentiles,
  radarStats,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
  onAddSeason,
}: InfoTabProps) {
  const growthStats = stats.filter((s) => (s.measureCount ?? 0) > 1);
  const radar = radarStats ?? EMPTY_RADAR_STATS;
  const hasRadarData = useMemo(
    () => Object.values(radar).some((v) => v > 0),
    [radar]
  );

  return (
    <div className="flex flex-col gap-5">
      <RadarSection radarStats={radar} hasData={hasRadarData} />
      <GrowthSection stats={stats} percentiles={percentiles} onAddStat={onAddStat} onUpdateStat={onUpdateStat} onDeleteStat={onDeleteStat} />
      {growthStats.length > 0 && <GrowthTrendSection stats={growthStats} />}
      <TeamSection profile={profile} seasons={seasons} onAddSeason={onAddSeason} />
    </div>
  );
}

/* ── 능력치 레이더 섹션 ── */
function RadarSection({
  radarStats,
  hasData,
}: {
  radarStats: Record<RadarStatId, number>;
  hasData: boolean;
}) {
  return (
    <div>
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className="text-accent">
            <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
          </svg>
        }
        title="능력치"
      />

      {hasData ? (
        <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
          {/* Radar chart */}
          <div className="px-4 pt-4 pb-2">
            <RadarChart stats={radarStats} showOverall size={280} />
          </div>

          {/* Stat bars */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            {RADAR_STATS.map((s) => {
              const val = radarStats[s.id] ?? 0;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-7 text-[10px] font-bold text-text-3 tracking-wide shrink-0">
                    {s.shortLabel}
                  </span>
                  <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full animate-grow-w"
                      style={{
                        width: `${(val / 99) * 100}%`,
                        background:
                          val >= 80
                            ? "linear-gradient(90deg, #D4A853, #F5D78E)"
                            : val >= 50
                            ? "rgba(212,168,83,0.6)"
                            : "rgba(212,168,83,0.3)",
                      }}
                    />
                  </div>
                  <span
                    className="w-6 text-right text-[12px] font-bold tabular-nums shrink-0"
                    style={{
                      fontFamily: "var(--font-stat)",
                      color: val >= 80 ? "#D4A853" : val >= 50 ? "#A1A1AA" : "#71717A",
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-card py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-text-3">
              <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text-1 mb-1">아직 능력치 데이터가 없어요</p>
            <p className="text-[11px] text-text-3 leading-relaxed">
              기록을 추가하면 능력치가<br />자동으로 계산됩니다
            </p>
          </div>
        </div>
      )}
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
  percentiles,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
}: {
  stats: Stat[];
  percentiles?: Record<string, number>;
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
                percentile={percentiles?.[stat.type]}
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

/* ── 성장 추이 섹션 ── */
function GrowthTrendSection({ stats }: { stats: Stat[] }) {
  return (
    <div>
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
        title="성장 추이"
      />

      <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden divide-y divide-white/[0.05]">
        {stats.map((stat) => {
          const meta = getStatMeta(stat.type);
          const isTime = stat.unit === "분:초";
          const diff = stat.firstValue != null ? Math.abs(stat.value - stat.firstValue) : 0;
          const improved = stat.firstValue != null
            ? (meta.lowerIsBetter ? stat.value < stat.firstValue : stat.value > stat.firstValue)
            : false;

          return (
            <div key={stat.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-[12px] font-medium text-text-2">{meta.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-3 font-stat tabular-nums">
                  {isTime ? fmtTimeSec(stat.firstValue ?? 0) : stat.firstValue}
                  {!isTime && meta.unit}
                </span>
                <svg width="12" height="8" viewBox="0 0 12 8" className="text-text-3 shrink-0">
                  <path d="M0 4h10M8 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-stat text-[14px] font-bold text-text-1 tabular-nums">
                  {isTime ? fmtTimeSec(stat.value) : stat.value}
                  {!isTime && meta.unit}
                </span>
                {diff > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: improved ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                      color: improved ? "#4ADE80" : "#F87171",
                    }}
                  >
                    {improved ? "▲" : "▼"}{isTime ? fmtTimeSec(diff) : diff.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div className="px-4 py-2 bg-white/[0.02]">
          <p className="text-center text-[10px] text-text-3">
            첫 기록 대비 변화량
          </p>
        </div>
      </div>
    </div>
  );
}

function fmtTimeSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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

          {/* Team actions: 내 팀 관리 + 새 팀으로 이동 */}
          <div className="mx-4 h-px bg-white/[0.05]" />
          <div className="flex gap-2 px-4 py-3">
            <Link
              href="/team"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] py-2.5 text-[11px] font-bold text-text-2 transition-colors active:bg-white/[0.08]"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              내 팀 관리
            </Link>
            <Link
              href="/team"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] py-2.5 text-[11px] font-bold text-text-2 transition-colors active:bg-white/[0.08]"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8l4 4-4 4" />
                <path d="M2 12h20" />
              </svg>
              새 팀으로 이동
            </Link>
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text-1 mb-1">아직 소속 팀이 없어요</p>
            <p className="text-[11px] text-text-3 leading-relaxed">팀을 만들거나 초대코드로 가입해보세요</p>
          </div>
          <Link
            href="/team"
            className="mt-1 rounded-full bg-accent px-5 py-2 text-[12px] font-bold text-bg transition-colors hover:bg-accent/90 active:scale-95"
          >
            팀 만들기 · 가입하기
          </Link>
        </div>
      )}
    </div>
  );
}
