"use client";

import { useState } from "react";
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
    <div className="flex flex-col gap-3">
      <GrowthSection stats={stats} onAddStat={onAddStat} onUpdateStat={onUpdateStat} onDeleteStat={onDeleteStat} />
      <TeamSection profile={profile} seasons={seasons} onAddSeason={onAddSeason} />
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
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-accent"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span className="text-[13px] font-semibold text-text-1">성장 기록</span>
          {stats.length > 0 && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {stats.length}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`text-text-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4">
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
            <div className="flex flex-col items-center gap-2.5 py-6 text-center">
              <svg
                width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-text-3"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <p className="text-[13px] font-semibold text-text-1">나의 성장을 기록해보세요</p>
              <p className="text-[11px] text-text-3 leading-relaxed">
                50m 달리기, 리프팅, 킥 속도 등을 기록하면<br />
                과거의 나와 비교하며 성장을 확인할 수 있어요
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                {MEASUREMENTS.slice(0, 4).map((m) => (
                  <span key={m.id} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-text-3">
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onAddStat && (
            <button
              onClick={onAddStat}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/30 py-2.5 text-[12px] font-medium text-accent transition-colors active:bg-accent/5"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              종목 추가
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
  const [open, setOpen] = useState(false);
  const prevSeasons = seasons.filter((s) => !s.isCurrent);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        className="flex w-full items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-text-3"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-[13px] font-semibold text-text-1">소속 팀</span>
          {profile.teamName && (
            <span className="text-[12px] text-accent font-medium">{profile.teamName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAddSeason && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onAddSeason(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onAddSeason(); } }}
              className="text-[12px] font-medium text-accent cursor-pointer"
            >
              + 추가
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`text-text-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4">
          {profile.teamName ? (
            <div className="flex items-center gap-3 rounded-xl bg-card-alt p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-1 truncate">{profile.teamName}</p>
                {profile.city && <p className="text-[12px] text-text-3">{profile.city}</p>}
              </div>
              {profile.teamId && (
                <Link href={`/team/${profile.teamId}`} className="shrink-0 text-[12px] text-accent">
                  상세 →
                </Link>
              )}
            </div>
          ) : (
            <p className="py-3 text-center text-[12px] text-text-3">아직 소속 팀이 없어요</p>
          )}

          {prevSeasons.length > 0 && (
            <div className="mt-3 border-t border-white/[0.04] pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">이전 소속</p>
              <div className="flex flex-col gap-2">
                {prevSeasons.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-text-3">•</span>
                    <span className="text-text-2 flex-1">{s.teamName}</span>
                    <span className="text-text-3">{s.year}년</span>
                    {(s.gamesPlayed != null || s.goals != null) && (
                      <span className="text-text-3 text-[11px]">
                        {s.gamesPlayed != null ? `${s.gamesPlayed}경기` : ""}
                        {s.goals ? ` ${s.goals}골` : ""}
                        {s.assists ? ` ${s.assists}어시` : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
