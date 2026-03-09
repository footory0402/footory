import { LEVELS, POSITION_COLORS, type Position } from "@/lib/constants";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  const lvl = LEVELS[Math.min(level, 5) - 1];
  const textSize = size === "sm" ? "text-[10px]" : "text-[12px]";
  const px = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full ${px} ${textSize} font-bold`}
      style={{
        background: `${lvl.color}18`,
        border: `1px solid ${lvl.color}33`,
        color: lvl.color,
      }}
    >
      <span>{lvl.icon}</span>
      Lv.{level}
    </span>
  );
}

interface PositionBadgeProps {
  position: Position;
  size?: "sm" | "md";
}

export function PositionBadge({ position, size = "sm" }: PositionBadgeProps) {
  const color = POSITION_COLORS[position];
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const px = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-md ${px} ${textSize} font-stat font-bold tracking-wide`}
      style={{
        background: `${color}18`,
        color,
      }}
    >
      {position}
    </span>
  );
}
