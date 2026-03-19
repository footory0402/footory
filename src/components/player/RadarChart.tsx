"use client";

import React, { useMemo } from "react";
import { RADAR_STATS, type RadarStatId } from "@/lib/constants";

interface RadarChartProps {
  stats: Record<RadarStatId, number>; // 각 축 0~99
  compareStats?: Record<RadarStatId, number> | null; // 비교 데이터 (과거의 나 or 상대)
  compareLabel?: string; // 비교 레이블 (예: "3개월 전")
  size?: number; // 기본값 280
  showOverall?: boolean; // OVR 평균 표시 여부
  className?: string;
}

/** 꼭짓점 좌표 계산 (위쪽 시작, 시계방향) */
function hexPoint(cx: number, cy: number, radius: number, index: number): [number, number] {
  // 0° = top (−90° in standard coords), 60° increments clockwise
  const angle = (Math.PI / 180) * (index * 60 - 90);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function hexPath(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const [x, y] = hexPoint(cx, cy, radius, i);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function RadarChartInner({ stats, compareStats, compareLabel, size = 280, showOverall = true, className }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Leave space for labels around the hexagon
  const maxRadius = size * 0.34;
  const labelRadius = size * 0.46;

  const gridLevels = [0.33, 0.66, 1.0];

  const dataPath = useMemo(() => {
    return (
      RADAR_STATS.map((s, i) => {
        const val = Math.max(0, Math.min(99, stats[s.id] ?? 0));
        const r = (val / 99) * maxRadius;
        const [x, y] = hexPoint(cx, cy, r, i);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(" ") + " Z"
    );
  }, [stats, cx, cy, maxRadius]);

  const comparePath = useMemo(() => {
    if (!compareStats) return null;
    return (
      RADAR_STATS.map((s, i) => {
        const val = Math.max(0, Math.min(99, compareStats[s.id] ?? 0));
        const r = (val / 99) * maxRadius;
        const [x, y] = hexPoint(cx, cy, r, i);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(" ") + " Z"
    );
  }, [compareStats, cx, cy, maxRadius]);

  const compareOverall = useMemo(() => {
    if (!compareStats) return 0;
    const values = RADAR_STATS.map((s) => compareStats[s.id] ?? 0);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [compareStats]);

  const overall = useMemo(() => {
    const values = RADAR_STATS.map((s) => stats[s.id] ?? 0);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [stats]);

  // Axis lines from center to each vertex
  const axisLines = RADAR_STATS.map((_, i) => {
    const [x, y] = hexPoint(cx, cy, maxRadius, i);
    return { x1: cx, y1: cy, x2: x, y2: y };
  });

  return (
    <div className={`relative w-full flex flex-col items-center justify-center ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        style={{ maxWidth: size, maxHeight: size }}
        className="animate-fade-up"
      >
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212,168,83,0.30)" />
            <stop offset="100%" stopColor="rgba(212,168,83,0.08)" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid hexagons */}
        {gridLevels.map((level) => (
          <path
            key={level}
            d={hexPath(cx, cy, maxRadius * level)}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.8"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.6"
          />
        ))}

        {/* Compare polygon (past/opponent) — rendered behind current */}
        {comparePath && (
          <>
            <path
              d={comparePath}
              fill="rgba(255,255,255,0.04)"
              stroke="none"
            />
            <path
              d={comparePath}
              fill="none"
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1"
              strokeLinejoin="round"
              strokeDasharray="4 3"
            />
          </>
        )}

        {/* Data polygon fill */}
        <path
          d={dataPath}
          fill="url(#radarFill)"
          stroke="none"
        />

        {/* Data polygon border */}
        <path
          d={dataPath}
          fill="none"
          stroke="#D4A853"
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter="url(#radarGlow)"
        />

        {/* Vertex dots */}
        {RADAR_STATS.map((s, i) => {
          const val = Math.max(0, Math.min(99, stats[s.id] ?? 0));
          const r = (val / 99) * maxRadius;
          const [x, y] = hexPoint(cx, cy, r, i);
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={3}
              fill="#D4A853"
              stroke="#0A0A0C"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels + values at each vertex */}
        {RADAR_STATS.map((s, i) => {
          const [lx, ly] = hexPoint(cx, cy, labelRadius, i);
          const val = stats[s.id] ?? 0;

          return (
            <g key={s.id}>
              {/* Stat value */}
              <text
                x={lx}
                y={ly - 6}
                textAnchor="middle"
                dominantBaseline="auto"
                className="font-stat"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  fill: "var(--color-accent)",
                  fontFamily: "var(--font-stat)",
                }}
              >
                {val}
              </text>
              {/* Short label */}
              <text
                x={lx}
                y={ly + 9}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  fill: "var(--color-text-3)",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.3px",
                }}
              >
                {s.shortLabel}
              </text>
            </g>
          );
        })}

        {/* Central OVR */}
        {showOverall && (
          <g>
            {compareStats ? (
              <>
                {/* Compare mode: show both OVRs */}
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    fill: "var(--color-accent)",
                    fontFamily: "var(--font-stat)",
                  }}
                >
                  {overall}
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  style={{
                    fontSize: "8px",
                    fontWeight: 700,
                    fill: "var(--color-text-3)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "1px",
                  }}
                >
                  OVR
                </text>
                {/* Delta badge */}
                {overall !== compareOverall && (
                  <text
                    x={cx}
                    y={cy + 20}
                    textAnchor="middle"
                    dominantBaseline="auto"
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      fill: overall > compareOverall ? "var(--color-green)" : "var(--color-red)",
                      fontFamily: "var(--font-stat)",
                    }}
                  >
                    {overall > compareOverall ? "+" : ""}{overall - compareOverall}
                  </text>
                )}
              </>
            ) : (
              <>
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  style={{
                    fontSize: "26px",
                    fontWeight: 700,
                    fill: "var(--color-accent)",
                    fontFamily: "var(--font-stat)",
                  }}
                >
                  {overall}
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  style={{
                    fontSize: "8px",
                    fontWeight: 700,
                    fill: "var(--color-text-3)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "1.5px",
                  }}
                >
                  OVR
                </text>
              </>
            )}
          </g>
        )}
      </svg>

      {/* Legend when comparing */}
      {compareStats && (
        <div className="flex items-center justify-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-4 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold text-text-2">현재</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-4 rounded-full bg-white/20" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 7px)" }} />
            <span className="text-[10px] font-semibold text-text-3">{compareLabel ?? "이전"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const RadarChart = React.memo(RadarChartInner);
export default RadarChart;
