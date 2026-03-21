import React from "react";

type TournamentType = "공식대회" | "리그" | "친선";

interface TournamentTypeBadgeProps {
  type: TournamentType;
}

const TYPE_STYLES: Record<TournamentType, { color: string; bg: string; border: string }> = {
  "공식대회": {
    color: "var(--v5-gold-light)",
    bg: "var(--v5-gold-bg)",
    border: "var(--v5-gold-border)",
  },
  "리그": {
    color: "var(--v5-blue)",
    bg: "var(--v5-blue-bg)",
    border: "var(--v5-blue-border)",
  },
  "친선": {
    color: "var(--v5-text-sub)",
    bg: "rgba(255,255,255,0.03)",
    border: "var(--v5-card-border)",
  },
};

function TournamentTypeBadgeInner({ type }: TournamentTypeBadgeProps) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES["친선"];

  return (
    <span
      style={{
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 9,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {type}
    </span>
  );
}

const TournamentTypeBadge = React.memo(TournamentTypeBadgeInner);
export default TournamentTypeBadge;
