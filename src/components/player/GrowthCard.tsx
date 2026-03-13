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

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function GrowthCard({ label, stat, lowerIsBetter = false, onUpdate, onDelete }: GrowthCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { value, previousValue, unit, isPR, bestValue, firstValue, firstMeasuredAt, measureCount, measuredAt } = stat;
  const isTimeUnit = unit === "분:초";

  const diff = previousValue != null ? value - previousValue : null;
  const improved = diff != null && diff !== 0 && (lowerIsBetter ? diff < 0 : diff > 0);
  const worsened = diff != null && diff !== 0 && !improved;

  let progressPercent = 0;
  if (firstValue != null && bestValue != null && firstValue !== bestValue) {
    progressPercent = Math.min(100, Math.max(5, (Math.abs(value - firstValue) / Math.abs(bestValue - firstValue)) * 100));
  } else if ((measureCount ?? 0) <= 1) {
    progressPercent = 100;
  }

  const hasPR = isPR && (measureCount ?? 1) > 1;
  const isFirst = (measureCount ?? 0) <= 1;

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="overflow-hidden rounded-2xl bg-card cursor-pointer select-none transition-all active:scale-[0.98]"
      style={{
        border: hasPR
          ? "1px solid rgba(212,168,83,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hasPR
          ? "inset 3px 0 0 #D4A853, 0 0 20px rgba(212,168,83,0.06)"
          : "inset 3px 0 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="p-3">
        {/* Label + date row */}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-3 truncate">
            {label}
          </p>
          <span className="text-[10px] text-text-3 tabular-nums shrink-0 ml-1">{fmt(measuredAt)}</span>
        </div>

        {/* Value + delta row */}
        <div className="flex items-end justify-between gap-1">
          <div className="flex items-baseline gap-1">
            <span
              className="font-stat leading-none tabular-nums"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: hasPR ? "#D4A853" : "var(--color-text-1)",
                letterSpacing: "-0.5px",
              }}
            >
              {isTimeUnit ? fmtTime(value) : value}
            </span>
            {!isTimeUnit && <span className="text-[11px] text-text-3 font-medium">{unit}</span>}
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {diff != null && diff !== 0 ? (
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                style={{
                  background: improved ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                  color: improved ? "#4ADE80" : "#F87171",
                }}
              >
                {lowerIsBetter
                  ? diff < 0 ? `↓${Math.abs(diff).toFixed(1)}` : `↑${diff.toFixed(1)}`
                  : diff > 0 ? `↑${diff.toFixed(1)}` : `↓${Math.abs(diff).toFixed(1)}`}
              </span>
            ) : isFirst ? (
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "rgba(212,168,83,0.12)", color: "#D4A853" }}
              >
                첫 기록
              </span>
            ) : null}

            {hasPR && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
                style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}
              >
                🏅 PR
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail — 고정 높이로 밀림 없음 */}
      {expanded && (
        <div
          className="border-t px-3 py-2.5 space-y-1.5"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {bestValue != null && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">자기 최고</span>
              <span className={`font-stat text-[12px] font-bold ${hasPR ? "text-accent" : "text-text-2"}`}>
                {isTimeUnit ? fmtTime(bestValue) : `${bestValue} ${unit}`}
              </span>
            </div>
          )}
          {firstValue != null && firstMeasuredAt && (measureCount ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">첫 기록 ({fmtFull(firstMeasuredAt)})</span>
              <span className="font-stat text-[11px] text-text-3">{isTimeUnit ? fmtTime(firstValue) : `${firstValue} ${unit}`}</span>
            </div>
          )}
          {(measureCount ?? 0) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">측정 횟수</span>
              <span className="text-[11px] font-bold text-text-2">{measureCount}회</span>
            </div>
          )}

          {(onUpdate || onDelete) && (
            <div className="flex gap-1.5 pt-1">
              {onUpdate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate(); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent/10 py-2 text-[11px] font-bold text-accent active:scale-95"
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
                  className="flex items-center justify-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-400 active:scale-95"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  삭제
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(GrowthCard);
