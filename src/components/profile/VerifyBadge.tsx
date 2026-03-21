import React from "react";

interface VerifyBadgeProps {
  source: "team" | "self";
  verifier?: string | null;
  compact?: boolean;
}

function VerifyBadgeInner({ source, verifier, compact }: VerifyBadgeProps) {
  const isTeam = source === "team";

  return (
    <span
      className="inline-flex items-center gap-[3px] whitespace-nowrap"
      style={{
        padding: compact ? "1px 6px" : "2px 8px",
        borderRadius: 4,
        fontSize: compact ? 9 : 10,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        background: isTeam
          ? "var(--v5-green-bg)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isTeam ? "var(--v5-green-border)" : "var(--v5-card-border)"}`,
        color: isTeam ? "var(--v5-green)" : "var(--v5-text-dim)",
      }}
    >
      {isTeam ? "✓" : "○"}
      {isTeam
        ? compact
          ? "팀 인증"
          : verifier || "팀 인증"
        : "자기 기록"}
    </span>
  );
}

const VerifyBadge = React.memo(VerifyBadgeInner);
export default VerifyBadge;
