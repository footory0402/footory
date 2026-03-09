"use client";

import StatRow from "./StatRow";
import MedalBadge from "./MedalBadge";
import EmptyCTA from "@/components/ui/EmptyCTA";
import { MEASUREMENTS } from "@/lib/constants";
import type { Stat, Medal } from "@/lib/types";

interface PhysicalInfo {
  heightCm?: number | null;
  weightKg?: number | null;
  preferredFoot?: string | null;
}

interface StatsTabProps {
  stats: Stat[];
  medals: Medal[];
  physicalInfo: PhysicalInfo;
  onAddStat?: () => void;
}

function footLabel(foot: string): string {
  if (foot === "right") return "오른발";
  if (foot === "left") return "왼발";
  if (foot === "both") return "양발";
  return foot;
}

export default function StatsTab({ stats, medals, physicalInfo, onAddStat }: StatsTabProps) {
  const hasPhysical = physicalInfo.heightCm || physicalInfo.weightKg || physicalInfo.preferredFoot;

  return (
    <div className="flex flex-col gap-4">
      {/* Physical Info — compact chip row */}
      {hasPhysical && (
        <div className="flex items-center gap-2">
          {physicalInfo.heightCm && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
              <span className="text-[10px] uppercase tracking-wide text-text-3">키</span>
              <span className="font-stat text-sm font-bold text-text-1">{physicalInfo.heightCm}</span>
              <span className="text-[10px] text-text-3">cm</span>
            </div>
          )}
          {physicalInfo.weightKg && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
              <span className="text-[10px] uppercase tracking-wide text-text-3">몸무게</span>
              <span className="font-stat text-sm font-bold text-text-1">{physicalInfo.weightKg}</span>
              <span className="text-[10px] text-text-3">kg</span>
            </div>
          )}
          {physicalInfo.preferredFoot && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
              <span className="text-[10px] uppercase tracking-wide text-text-3">주발</span>
              <span className="text-sm font-medium text-text-1">{footLabel(physicalInfo.preferredFoot)}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats — FIFA-style 2-column grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-text-2">
            핵심 스탯
          </h3>
          {onAddStat && (
            <button
              onClick={onAddStat}
              className="text-text-3 transition-colors hover:text-accent"
              aria-label="스탯 추가"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, i) => {
              const m = MEASUREMENTS.find((m) => m.id === stat.type);
              return (
                <div
                  key={stat.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <StatRow
                    icon={m?.icon ?? "📊"}
                    label={m?.label ?? stat.type}
                    value={stat.value}
                    unit={stat.unit}
                    type={stat.type}
                    previousValue={stat.previousValue}
                    verified={stat.verified}
                    lowerIsBetter={m?.lowerIsBetter}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyCTA text="첫 측정 기록을 추가하세요" onAction={onAddStat} />
        )}
      </div>

      {/* Achievements — clean card list */}
      {(medals.length > 0) && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-text-2 mb-3">
            달성 기록
          </h3>
          <div className="flex flex-col gap-1.5">
            {medals.map((medal, i) => (
              <div
                key={medal.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <MedalBadge
                  label={medal.label}
                  value={medal.value}
                  unit={medal.unit}
                  difficultyTier={medal.difficultyTier}
                  verified={medal.verified}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
