import React from "react";

/* ── Max reference values for bar percentage ── */
const STAT_MAX: Record<string, { max: number; min?: number }> = {
  shooting_accuracy: { max: 30 },
  juggling: { max: 500 },
  sprint_30m: { max: 6.0, min: 3.5 },
  run_1000m: { max: 360, min: 180 },
  shuttle_run: { max: 80 },
  sprint_50m: { max: 9.0, min: 5.5 },
  kick_power: { max: 120 },
  vertical_jump: { max: 60 },
  agility: { max: 20, min: 8 },
};

function getBarPercent(type: string, value: number, lowerIsBetter: boolean): number {
  const ref = STAT_MAX[type];
  if (!ref) return 50;

  if (lowerIsBetter && ref.min != null) {
    const pct = ((ref.max - value) / (ref.max - ref.min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  const pct = (value / ref.max) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** FIFA-style color tiers */
function getStatColor(pct: number): { bar: string; text: string; glow: string } {
  if (pct >= 85) return { bar: "#4ADE80", text: "#4ADE80", glow: "rgba(74,222,128,0.25)" };
  if (pct >= 70) return { bar: "#86EFAC", text: "#86EFAC", glow: "rgba(134,239,172,0.15)" };
  if (pct >= 55) return { bar: "#FDE047", text: "#FDE047", glow: "rgba(253,224,71,0.12)" };
  if (pct >= 40) return { bar: "#FB923C", text: "#FB923C", glow: "rgba(251,146,60,0.12)" };
  return { bar: "#F87171", text: "#F87171", glow: "rgba(248,113,113,0.1)" };
}

interface StatRowProps {
  icon: string;
  label: string;
  value: number;
  unit: string;
  type?: string;
  previousValue?: number;
  verified?: boolean;
  lowerIsBetter?: boolean;
}

function StatRow({ icon, label, value, unit, type, previousValue, verified, lowerIsBetter = false }: StatRowProps) {
  const diff = previousValue != null ? value - previousValue : null;
  const isGood = diff != null && diff !== 0 && (lowerIsBetter ? diff < 0 : diff > 0);

  const pct = type ? getBarPercent(type, value, lowerIsBetter) : 50;
  const color = getStatColor(pct);

  return (
    <div className="relative rounded-lg bg-white/[0.03] p-3">
      {/* Top: Label + Value */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{icon}</span>
          <span className="text-[11px] font-medium text-text-3 uppercase tracking-wide truncate">{label}</span>
          {verified && (
            <span className="shrink-0 text-[9px] font-bold text-accent">✓</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {diff != null && diff !== 0 && (
            <span className={`text-[10px] font-bold ${isGood ? "text-green" : "text-red"}`}>
              {diff > 0 ? "▲" : "▼"}{Math.abs(diff).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-1 mb-2.5">
        <span
          className="font-stat text-[28px] font-bold leading-none"
          style={{ color: color.text }}
        >
          {value}
        </span>
        <span className="text-[11px] font-medium text-text-3">{unit}</span>
      </div>

      {/* Bar — thick FIFA style */}
      <div className="relative h-[6px] w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color.bar}CC, ${color.bar})`,
            boxShadow: `0 0 8px ${color.glow}`,
          }}
        />
      </div>
    </div>
  );
}

export default React.memo(StatRow);
