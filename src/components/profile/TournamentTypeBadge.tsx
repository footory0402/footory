import React from "react";

type TournamentType = "공식대회" | "리그" | "친선";

interface TournamentTypeBadgeProps {
  type: TournamentType;
}

const TYPE_STYLES: Record<TournamentType, { className: string }> = {
  "공식대회": {
    className: "bg-accent/[0.08] border-accent/20 text-accent",
  },
  "리그": {
    className: "bg-blue/[0.08] border-blue/[0.18] text-blue",
  },
  "친선": {
    className: "bg-white/[0.03] border-white/[0.06] text-text-3",
  },
};

function TournamentTypeBadgeInner({ type }: TournamentTypeBadgeProps) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES["친선"];

  return (
    <span
      className={`inline-block rounded-sm px-[7px] py-0.5 text-[9px] font-body font-semibold border border-solid ${style.className}`}
    >
      {type}
    </span>
  );
}

const TournamentTypeBadge = React.memo(TournamentTypeBadgeInner);
export default TournamentTypeBadge;
