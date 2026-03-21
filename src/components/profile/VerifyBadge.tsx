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
      className={`inline-flex items-center gap-[3px] whitespace-nowrap rounded-sm font-body font-medium ${
        compact ? "text-[9px] px-[6px] py-px" : "text-[10px] px-2 py-0.5"
      } ${
        isTeam
          ? "bg-green/[0.08] border border-green/[0.18] text-green"
          : "bg-white/[0.03] border border-white/[0.06] text-text-3"
      }`}
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
