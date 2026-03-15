"use client";

import { useState, useEffect, useMemo } from "react";

import GrowthCard from "./GrowthCard";
import RadarChart from "./RadarChart";
import { MEASUREMENTS, getStatMeta, RADAR_STATS, type RadarStatId } from "@/lib/constants";

/** Axes that are derived from video tags, not physical measurements */
const VIDEO_BASED_AXES = new Set<RadarStatId>(["passing", "defense"]);
import { EMPTY_RADAR_STATS, calcRadarStatsFromFirstValues, type ClipTagCount } from "@/lib/radar-calc";
import type { Stat } from "@/lib/types";
import type { Season } from "@/lib/types";

interface InfoTabProps {
  stats: Stat[];
  seasons: Season[];
  percentiles?: Record<string, number>;
  radarStats?: Record<RadarStatId, number>;
  clipTagCounts?: ClipTagCount[];
  onAddStat?: () => void;
  onUpdateStat?: (statType: string) => void;
  onDeleteStat?: (statId: string) => void;
  onAddSeason?: () => void;
}

export default function InfoTab({
  stats,
  seasons,
  percentiles,
  radarStats,
  clipTagCounts,
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

  // 과거의 나 레이더 데이터 (firstValue 기반)
  const pastRadar = useMemo(
    () => calcRadarStatsFromFirstValues(stats, clipTagCounts ?? []),
    [stats, clipTagCounts]
  );

  return (
    <div className="flex flex-col gap-5">
      <RadarSection radarStats={radar} hasData={hasRadarData} pastRadar={pastRadar} />
      <GrowthSection stats={stats} percentiles={percentiles} onAddStat={onAddStat} onUpdateStat={onUpdateStat} onDeleteStat={onDeleteStat} />
      {growthStats.length > 0 && <GrowthTrendSection stats={growthStats} />}
      <PrevSeasonsSection seasons={seasons} onAddSeason={onAddSeason} />
    </div>
  );
}

/* ── 능력치 레이더 섹션 ── */
function RadarSection({
  radarStats,
  hasData,
  pastRadar,
}: {
  radarStats: Record<RadarStatId, number>;
  hasData: boolean;
  pastRadar?: Record<RadarStatId, number> | null;
}) {
  const [showPast, setShowPast] = useState(false);

  return (
    <div>
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className="text-accent">
            <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
          </svg>
        }
        title="능력치"
        action={
          hasData && pastRadar ? (
            <button
              onClick={() => setShowPast((p) => !p)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                showPast
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-white/[0.07] text-text-3 hover:bg-white/[0.12]"
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              성장 비교
            </button>
          ) : undefined
        }
      />

      {hasData ? (
        <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
          {/* Radar chart */}
          <div className="px-4 pt-4 pb-2">
            <RadarChart
              stats={radarStats}
              compareStats={showPast ? pastRadar : undefined}
              compareLabel="첫 기록"
              showOverall
              size={280}
            />
          </div>

          {/* Stat bars */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            {RADAR_STATS.map((s) => {
              const val = radarStats[s.id] ?? 0;
              const isVideoBased = VIDEO_BASED_AXES.has(s.id);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-7 text-[10px] font-bold text-text-3 tracking-wide shrink-0">
                    {s.shortLabel}
                  </span>
                  {isVideoBased && (
                    <span className="text-[9px] shrink-0" title="영상 기반 추정치">📹</span>
                  )}
                  <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full animate-grow-w"
                      style={{
                        width: `${(val / 99) * 100}%`,
                        background: isVideoBased
                          ? val >= 50
                            ? "rgba(160,160,180,0.5)"
                            : "rgba(160,160,180,0.25)"
                          : val >= 80
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
                      color: isVideoBased
                        ? "#9E9EA8"
                        : val >= 80 ? "#D4A853" : val >= 50 ? "#A1A1AA" : "#71717A",
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
            {/* 영상 기반 범례 */}
            <p className="text-[9px] text-text-3 mt-1 flex items-center gap-1">
              <span>📹</span> 영상 태그 기반 추정치 · 측정 종목 추가 시 정확도 향상
            </p>
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
  // 팀 내 순위 로드 (비공개, 나만 볼 수 있음)
  const [teamRanks, setTeamRanks] = useState<Record<string, { rank: number; total: number }>>({});

  useEffect(() => {
    fetch("/api/stats/team-rank")
      .then((r) => (r.ok ? r.json() : { ranks: {} }))
      .then((data) => setTeamRanks(data.ranks ?? {}))
      .catch(() => {});
  }, []);

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
                teamRank={teamRanks[stat.type]}
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

/* ── 이전 소속 타임라인 섹션 ── */
function PrevSeasonsSection({
  seasons,
  onAddSeason,
}: {
  seasons: Season[];
  onAddSeason?: () => void;
}) {
  const prevSeasons = seasons.filter((s) => !s.isCurrent);
  if (prevSeasons.length === 0) return null;

  return (
    <div id="prev-seasons">
      <SectionHeader
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
        title="이전 소속"
        count={prevSeasons.length}
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

      <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
        <div className="px-4 py-3">
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
      </div>
    </div>
  );
}
