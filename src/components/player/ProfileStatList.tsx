import React from "react";
import { RADAR_STATS, MEASUREMENTS } from "@/lib/constants";
import type { Stat } from "@/lib/types";

interface ProfileStatListProps {
  stats: Stat[];
  className?: string;
}

function ProfileStatListInner({ stats, className }: ProfileStatListProps) {
  const statMap = new Map(stats.map((s) => [s.type, s]));

  return (
    <div className={`flex flex-1 flex-col ${className ?? ""}`}>
      {RADAR_STATS.map((axis, i) => {
        const stat = statMap.get(axis.statType);
        const measurement = MEASUREMENTS.find((m) => m.id === axis.statType);
        const unit = measurement?.unit ?? "";
        const hasValue = stat != null;

        let delta: number | null = null;
        let isImproved = false;
        if (stat?.previousValue != null) {
          delta = stat.value - stat.previousValue;
          isImproved = axis.lowerIsBetter ? delta < 0 : delta > 0;
        }

        return (
          <div
            key={axis.id}
            className="flex items-center justify-between border-b border-white/[0.02] last:border-b-0"
            style={{
              padding: "3.5px 0",
              animation: `slide-r 0.35s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.05}s both`,
            }}
          >
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: "#52525B", fontFamily: "Rajdhani, sans-serif", minWidth: 32 }}
            >
              {axis.label}
            </span>
            <div className="flex items-baseline gap-0.5">
              {hasValue ? (
                <>
                  <span className="font-stat text-[16px] font-medium leading-none text-text-1">
                    {stat.value}
                  </span>
                  <span
                    className="text-[8px] font-semibold"
                    style={{ color: "#3F3F46", fontFamily: "Rajdhani, sans-serif", marginLeft: 1 }}
                  >
                    {unit}
                  </span>
                  {delta != null && delta !== 0 && (
                    <span
                      className="font-stat text-[8px] font-medium"
                      style={{ color: isImproved ? "#4ADE80" : "#F87171", marginLeft: 3 }}
                    >
                      {isImproved ? "▲" : "▼"}
                      {parseFloat(Math.abs(delta).toFixed(2))}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-text-3/40">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ProfileStatList = React.memo(ProfileStatListInner);
export default ProfileStatList;
