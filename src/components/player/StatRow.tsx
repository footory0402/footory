import React from "react";

/* ── Max reference values for bar percentage ── */
const STAT_MAX: Record<string, { max: number; min?: number }> = {
  shooting_accuracy: { max: 30 },
  juggling: { max: 500 },
  sprint_30m: { max: 6.0, min: 3.5 },
  "30m_sprint": { max: 6.0, min: 3.5 },
  run_1000m: { max: 360, min: 180 },
  "1000m_run": { max: 360, min: 180 },
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
    // Lower is better: best = min, worst = max
    const pct = ((ref.max - value) / (ref.max - ref.min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  const pct = (value / ref.max) * 100;
  return Math.max(0, Math.min(100, pct));
}

function getBarColor(pct: number): { bg: string; shadow?: string } {
  if (pct >= 80) return { bg: "bg-accent", shadow: "shadow-[0_0_6px_rgba(212,168,83,0.3)]" };
  if (pct >= 60) return { bg: "bg-green-400" };
  if (pct >= 40) return { bg: "bg-blue-400" };
  return { bg: "bg-zinc-500" };
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
  const { bg, shadow } = getBarColor(pct);

  return (
    <div className="py-3 border-b border-white/[0.04] last:border-b-0">
      {/* Top: icon + label + value */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[15px]">{icon}</span>
          <span className="text-sm text-text-2">{label}</span>
          {verified && (
            <span className="text-[10px] font-semibold text-accent">✓ 인증됨</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-brand text-lg font-bold text-text-1">
            {value}
            <span className="ml-0.5 text-xs font-normal text-text-3">{unit}</span>
          </span>
          {diff != null && diff !== 0 && (
            <span className={`text-[11px] font-semibold ${isGood ? "text-green-400" : "text-red-400"}`}>
              {diff > 0 ? "↑" : "↓"}{Math.abs(diff).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className={`h-1.5 w-full rounded-full bg-white/[0.06] ${verified ? "ring-1 ring-accent/20" : ""}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${bg} ${shadow ?? ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default React.memo(StatRow);
