import React from "react";

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

function StatRow({ icon, label, value, unit, previousValue, verified, lowerIsBetter = false }: StatRowProps) {
  const diff = previousValue != null ? value - previousValue : null;
  const improved = diff != null && diff !== 0 && (lowerIsBetter ? diff < 0 : diff > 0);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
      {/* Icon */}
      <span className="text-base shrink-0">{icon}</span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-medium text-text-2 truncate block">{label}</span>
      </div>

      {/* Value + diff */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-stat text-[18px] font-bold text-text-1 leading-none">{value}</span>
        <span className="text-[11px] text-text-3">{unit}</span>
        {verified && (
          <span className="text-[9px] font-bold text-accent">✓</span>
        )}
      </div>

      {/* Growth indicator */}
      {diff != null && diff !== 0 && (
        <span className={`text-[11px] font-bold shrink-0 ${improved ? "text-accent" : "text-text-3"}`}>
          {lowerIsBetter
            ? (diff < 0 ? `↓${Math.abs(diff).toFixed(1)}` : `↑${diff.toFixed(1)}`)
            : (diff > 0 ? `↑${diff.toFixed(1)}` : `↓${Math.abs(diff).toFixed(1)}`)
          }
        </span>
      )}

      {/* First record badge */}
      {diff == null && previousValue == null && (
        <span className="text-[10px] text-accent/60 shrink-0">NEW</span>
      )}
    </div>
  );
}

export default React.memo(StatRow);
