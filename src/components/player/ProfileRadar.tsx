"use client";

import React, { useMemo, useId } from "react";
import { RADAR_STATS } from "@/lib/constants";
import type { RadarStatId } from "@/lib/constants";

interface ProfileRadarProps {
  stats: Record<RadarStatId, number>; // 0~99 정규화 값
  className?: string;
}

/** 꼭짓점 좌표 계산 (위쪽 시작, 시계방향) */
function hexPoint(cx: number, cy: number, radius: number, index: number): [number, number] {
  const angle = (Math.PI / 180) * (index * 60 - 90);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function ProfileRadarInner({ stats, className }: ProfileRadarProps) {
  const uid = useId();
  const gradientId = `profileRadarFill-${uid.replace(/:/g, "")}`;
  const size = 140;
  const cx = 70;
  const cy = 63;
  const maxRadius = 48;
  const gridLevels = [0.33, 0.66, 1.0];

  const dataPoints = useMemo(() => {
    return RADAR_STATS.map((s, i) => {
      const val = Math.max(0, Math.min(99, stats[s.id] ?? 0));
      const r = (val / 99) * maxRadius;
      return hexPoint(cx, cy, r, i);
    });
  }, [stats]);

  const dataPath = dataPoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ") + " Z";

  const hasData = RADAR_STATS.some((s) => (stats[s.id] ?? 0) > 0);

  return (
    <div className={className} style={{ width: 130, height: 130, flexShrink: 0 }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="130"
        height="130"
        role="img"
        aria-label="선수 능력치 레이더 차트"
        style={{
          filter: "drop-shadow(0 0 12px rgba(212,168,83,0.1))",
          animation: "radar-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both",
        }}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(245,197,66,0.12)" />
            <stop offset="100%" stopColor="rgba(245,197,66,0.03)" />
          </radialGradient>
        </defs>

        {/* Grid hexagons */}
        {gridLevels.map((level) => {
          const path = Array.from({ length: 6 })
            .map((_, i) => {
              const [x, y] = hexPoint(cx, cy, maxRadius * level, i);
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ") + " Z";
          return (
            <path key={level} d={path} fill="none" stroke="rgba(245,197,66,0.06)" strokeWidth="0.5" />
          );
        })}

        {/* Axis lines */}
        {RADAR_STATS.map((_, i) => {
          const [x, y] = hexPoint(cx, cy, maxRadius, i);
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(245,197,66,0.025)" strokeWidth="0.5" />
          );
        })}

        {/* Data polygon */}
        {hasData && (
          <>
            <path d={dataPath} fill={`url(#${gradientId})`} stroke="none" />
            <path d={dataPath} fill="none" stroke="rgba(245,197,66,0.65)" strokeWidth="1.3" strokeLinejoin="round" />
          </>
        )}

        {/* Vertex dots with glow ring */}
        {hasData && dataPoints.map(([x, y], i) => (
          <g key={RADAR_STATS[i].id}>
            <circle cx={x} cy={y} r="6" fill="none" stroke="rgba(245,197,66,0.15)" strokeWidth="1" />
            <circle cx={x} cy={y} r="2.5" fill="#F5C542" opacity="0.9" />
          </g>
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="1.5" fill="rgba(245,197,66,0.2)" />

        {/* Labels */}
        {RADAR_STATS.map((s, i) => {
          const labelR = maxRadius + 14;
          const [lx, ly] = hexPoint(cx, cy, labelR, i);
          return (
            <text
              key={s.id}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "7px", fontWeight: 600, fill: "#71717A", fontFamily: "Rajdhani, sans-serif" }}
            >
              {s.shortLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

const ProfileRadar = React.memo(ProfileRadarInner);
export default ProfileRadar;
