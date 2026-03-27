import type { HudPlayerData } from "./types";

/** 우하단 골 카운터 + 구단 엠블럼 */
export default function GoalCounter({ data, goalCount }: { data: HudPlayerData; goalCount: number }) {
  return (
    <div className="absolute bottom-12 right-3 flex flex-col items-center gap-1.5">
      {/* Goal counter */}
      <div className="flex flex-col items-center rounded-lg bg-black/70 px-3 py-2">
        <span className="text-[7px] font-bold tracking-[2px] text-white/40">GOAL</span>
        <span
          className="font-[var(--font-stat)] text-[24px] font-black leading-none"
          style={{ color: data.accentColor }}
        >
          {goalCount || "-"}
        </span>
      </div>
      {/* Club emblem placeholder */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-[8px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor})` }}
      >
        {data.club.replace(/\s*U\d+/, "").substring(0, 4)}
      </div>
    </div>
  );
}
