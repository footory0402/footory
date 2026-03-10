"use client";

import { useState } from "react";
import StatRow from "./StatRow";
import MedalBadge from "./MedalBadge";
import { MEASUREMENTS } from "@/lib/constants";
import type { Stat, Medal } from "@/lib/types";

interface StatsCollapsibleProps {
  stats: Stat[];
  medals: Medal[];
  onAddStat?: () => void;
}

export default function StatsCollapsible({ stats, medals, onAddStat }: StatsCollapsibleProps) {
  const [open, setOpen] = useState(stats.length > 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-[13px] font-semibold text-text-1">체력 기록</span>
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

      {/* Collapsible content */}
      {open && (
        <div className="flex flex-col gap-1.5 px-4 pb-4">
          {stats.length > 0 ? (
            stats.map((stat, i) => {
              const m = MEASUREMENTS.find((m) => m.id === stat.type);
              return (
                <div key={stat.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
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
            })
          ) : (
            <p className="py-2 text-center text-[12px] text-text-3">
              아직 기록이 없어요
            </p>
          )}

          {/* Add button */}
          {onAddStat && (
            <button
              onClick={onAddStat}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent/30 py-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent/5"
            >
              <span>+</span> 기록 추가
            </button>
          )}

          {/* Medals inline */}
          {medals.length > 0 && (
            <div className="mt-2 border-t border-white/[0.04] pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">달성 기록</p>
              <div className="flex flex-col gap-1">
                {medals.map((medal) => (
                  <MedalBadge
                    key={medal.id}
                    label={medal.label}
                    value={medal.value}
                    unit={medal.unit}
                    difficultyTier={medal.difficultyTier}
                    verified={medal.verified}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
