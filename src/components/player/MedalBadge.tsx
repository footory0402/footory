import React from "react";

interface MedalBadgeProps {
  label: string;
  value: number;
  unit: string;
  difficultyTier?: number;
  verified?: boolean;
  size?: "sm" | "md";
}

const TIER_STYLES = [
  { tier: 1, border: "#71717A", bg: "rgba(113,113,122,0.06)", icon: "🥉" },
  { tier: 2, border: "#60A5FA", bg: "rgba(96,165,250,0.06)", icon: "🥈" },
  { tier: 3, border: "#D4A853", bg: "rgba(212,168,83,0.06)", icon: "🥇" },
  { tier: 4, border: "#4ADE80", bg: "rgba(74,222,128,0.06)", icon: "💎" },
];

function getTierStyle(difficultyTier: number) {
  return TIER_STYLES.find((t) => t.tier === difficultyTier) ?? TIER_STYLES[0];
}

function MedalBadge({ label, value, unit, difficultyTier = 1, verified }: MedalBadgeProps) {
  const tier = getTierStyle(difficultyTier);

  return (
    <div
      className="animate-fade-up flex items-center gap-2.5 rounded-lg p-2.5"
      style={{
        background: tier.bg,
        border: `1px solid ${tier.border}22`,
      }}
    >
      {/* Icon */}
      <span className="text-base shrink-0">{tier.icon}</span>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-text-3 uppercase tracking-wide truncate">{label}</span>
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-stat text-base font-bold leading-tight"
            style={{ color: tier.border }}
          >
            {value}
          </span>
          <span className="text-[10px] text-text-3">{unit}</span>
        </div>
      </div>

      {/* Verified */}
      {verified && (
        <span className="ml-auto shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#4ADE80">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </span>
      )}
    </div>
  );
}

export default React.memo(MedalBadge);
