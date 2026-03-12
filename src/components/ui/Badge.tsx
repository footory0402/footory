import { POSITION_COLORS, type Position } from "@/lib/constants";

const POSITION_BADGE_STYLES: Record<Position, { bg: string; text: string; border: string }> = {
  FW: { bg: "rgba(239,68,68,0.10)", text: "#F87171", border: "rgba(239,68,68,0.20)" },
  MF: { bg: "rgba(59,130,246,0.10)", text: "#60A5FA", border: "rgba(59,130,246,0.20)" },
  DF: { bg: "rgba(245,158,11,0.10)", text: "#FBBF24", border: "rgba(245,158,11,0.20)" },
  GK: { bg: "rgba(168,85,247,0.10)", text: "#C084FC", border: "rgba(168,85,247,0.20)" },
};

interface PositionBadgeProps {
  position: Position;
  size?: "sm" | "md";
}

export function PositionBadge({ position, size = "sm" }: PositionBadgeProps) {
  const style = POSITION_BADGE_STYLES[position] ?? { bg: "rgba(161,161,170,0.10)", text: "#A1A1AA", border: "rgba(161,161,170,0.20)" };
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const px = size === "sm" ? "px-2 py-0.5" : "px-2 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-md ${px} ${textSize} font-stat font-bold tracking-wide`}
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {position}
    </span>
  );
}

/** Utility to get position badge colors for inline use */
export function getPositionBadgeStyle(position: Position | string) {
  return POSITION_BADGE_STYLES[position as Position] ?? { bg: "rgba(161,161,170,0.10)", text: "#A1A1AA", border: "rgba(161,161,170,0.20)" };
}
