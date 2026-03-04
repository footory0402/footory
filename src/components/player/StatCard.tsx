import { MEASUREMENTS } from "@/lib/constants";
import type { Stat } from "@/lib/types";

interface StatCardProps {
  stat: Stat;
}

export default function StatCard({ stat }: StatCardProps) {
  const measurement = MEASUREMENTS.find((m) => m.id === stat.type);
  const diff = stat.previousValue != null ? stat.value - stat.previousValue : null;
  const isLowerBetter = measurement?.lowerIsBetter ?? false;
  const isGood = diff != null && (isLowerBetter ? diff < 0 : diff > 0);

  return (
    <div className="flex min-w-[120px] shrink-0 flex-col gap-1.5 rounded-[10px] border border-border bg-card p-3">
      <span className="text-[16px]">{measurement?.icon ?? "📊"}</span>
      <span className="text-[10px] text-text-3">{measurement?.label ?? stat.type}</span>
      <div className="flex items-end gap-1">
        <span className="font-stat text-[22px] font-bold leading-none text-text-1">
          {stat.value}
        </span>
        <span className="mb-0.5 text-[11px] text-text-3">{stat.unit}</span>
      </div>
      {diff != null && diff !== 0 && (
        <span className={`text-[11px] font-semibold ${isGood ? "text-green" : "text-red"}`}>
          {diff > 0 ? "↑" : "↓"}{Math.abs(diff).toFixed(1)}
        </span>
      )}
      {stat.verified && (
        <span className="text-[9px] font-medium text-green">✓ 인증됨</span>
      )}
    </div>
  );
}
