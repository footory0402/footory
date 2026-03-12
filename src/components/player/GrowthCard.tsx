"use client";

import React, { useState } from "react";
import type { Stat } from "@/lib/types";

interface GrowthCardProps {
  label: string;
  stat: Stat;
  lowerIsBetter?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
}

function fmt(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function GrowthCard({ label, stat, lowerIsBetter = false, onUpdate, onDelete }: GrowthCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { value, previousValue, unit, isPR, bestValue, firstValue, firstMeasuredAt, measureCount, measuredAt } = stat;

  const diff = previousValue != null ? value - previousValue : null;
  const improved = diff != null && diff !== 0 && (lowerIsBetter ? diff < 0 : diff > 0);

  let progressPercent = 0;
  if (firstValue != null && bestValue != null && firstValue !== bestValue) {
    progressPercent = Math.min(100, Math.max(5, (Math.abs(value - firstValue) / Math.abs(bestValue - firstValue)) * 100));
  } else if ((measureCount ?? 0) <= 1) {
    progressPercent = 100;
  }

  const hasPR = isPR && (measureCount ?? 1) > 1;

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className={`overflow-hidden rounded-xl border transition-all cursor-pointer active:scale-[0.97] select-none ${
        hasPR ? "border-accent/25" : "border-white/[0.06]"
      } bg-card`}
      style={hasPR ? { boxShadow: "inset 2px 0 0 #D4A853" } : undefined}
    >
      <div className="px-3 pt-3 pb-2.5">
        {/* label + date */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wide text-text-3 uppercase truncate pr-1 leading-none">
            {label}
          </span>
          <span className="text-[10px] text-text-3 shrink-0 tabular-nums">{fmt(measuredAt)}</span>
        </div>

        {/* value */}
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="font-stat text-[30px] font-bold leading-none text-text-1 tabular-nums">{value}</span>
          <span className="text-[11px] text-text-3 leading-none">{unit}</span>
          <span className="ml-auto shrink-0">
            {diff != null && diff !== 0 ? (
              <span className={`text-[11px] font-bold tabular-nums ${improved ? "text-accent" : "text-text-3"}`}>
                {lowerIsBetter
                  ? diff < 0 ? `↓${Math.abs(diff).toFixed(1)}` : `↑${diff.toFixed(1)}`
                  : diff > 0 ? `↑${diff.toFixed(1)}` : `↓${Math.abs(diff).toFixed(1)}`}
              </span>
            ) : (measureCount ?? 0) <= 1 ? (
              <span className="text-[9px] font-semibold text-accent/60">첫 기록</span>
            ) : null}
          </span>
        </div>

        {/* progress */}
        {(measureCount ?? 0) > 1 && (
          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: hasPR ? "var(--accent-gradient, #D4A853)" : "rgba(255,255,255,0.18)",
              }}
            />
          </div>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/[0.05] px-3 py-2.5 space-y-1.5">
          {(bestValue != null) && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">자기 최고</span>
              <span className={`font-stat text-[12px] font-bold ${hasPR ? "text-accent" : "text-text-2"}`}>
                {bestValue}{unit}
              </span>
            </div>
          )}
          {firstValue != null && firstMeasuredAt && (measureCount ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">{fmtFull(firstMeasuredAt)} 첫 기록</span>
              <span className="font-stat text-[12px] text-text-3">{firstValue}{unit}</span>
            </div>
          )}
          {(measureCount ?? 0) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">누적 측정</span>
              <span className="text-[11px] font-semibold text-text-2">{measureCount}회</span>
            </div>
          )}
          <div className="mt-1 flex gap-2">
            {onUpdate && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(); }}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-accent/10 py-2 text-[11px] font-semibold text-accent active:bg-accent/20 transition-colors"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                새 기록
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center justify-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-400 active:bg-red-500/20 transition-colors"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(GrowthCard);
