"use client";

import type { HudPlayerData } from "./types";

interface PlayerReviewCardProps {
  data: HudPlayerData;
  /** 0~1 진행률 — 행 단위 애니메이션 제어용 */
  progress?: number;
}

const REVIEW_ROWS = [
  { label: "NAME", getValue: (d: HudPlayerData) => `${d.lastName} ${d.firstName}`.trim() },
  { label: "NUMBER", getValue: (d: HudPlayerData) => d.number },
  { label: "AGE", getValue: (d: HudPlayerData) => d.age || "-" },
  { label: "DATE OF BIRTH", getValue: (d: HudPlayerData) => d.birthDate || "-" },
  { label: "HEIGHT / WEIGHT", getValue: (d: HudPlayerData) => `${d.height || "-"}CM / ${d.weight || "-"}KG` },
  { label: "FOOT", getValue: (d: HudPlayerData) => d.foot },
  { label: "POSITION", getValue: (d: HudPlayerData) => d.position },
  { label: "CLUB", getValue: (d: HudPlayerData) => d.club },
  { label: "NATIONALITY", getValue: (d: HudPlayerData) => d.nationality },
];

/**
 * Player Review 카드 — 참고 영상의 8~18초 구간 재현.
 * progress로 행 단위 슬라이드인 애니메이션 제어.
 */
export default function PlayerReviewCard({ data, progress = 1 }: PlayerReviewCardProps) {
  // 각 행의 표시 여부 (progress에 따라 순차 등장)
  const visibleRows = Math.floor(progress * REVIEW_ROWS.length);

  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-[var(--font-body)]"
      style={{
        background: `linear-gradient(135deg, #0a0a0a 0%, ${data.mainColor}44 100%)`,
      }}
    >
      {/* Stadium background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(180deg, ${data.mainColor}33 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${data.mainColor}, ${data.accentColor})` }}
      />

      {/* Club logo — top right */}
      <div className="absolute right-6 top-4 text-right">
        <div className="text-[14px] font-black tracking-wider text-white/80">
          {data.club.replace(/\s*U\d+/, "").toUpperCase()}
        </div>
        <div className="text-[8px] tracking-[2px] text-white/30">
          FOOTBALL CLUB
        </div>
      </div>

      {/* Left: Photo area */}
      <div className="flex w-[40%] items-end pl-8 pb-8">
        <div className="relative h-[80%] w-full overflow-hidden rounded-t-lg">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full items-center justify-center bg-white/5">
              <svg width="80" height="100" viewBox="0 0 24 28" fill="none">
                <circle cx="12" cy="8" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Right: Title + Review Table */}
      <div className="relative flex flex-1 flex-col justify-between py-8 pr-6">
        {/* Title */}
        <div className="mb-4">
          <div className="text-[10px] italic tracking-wider text-white/40">
            {data.lastName}{data.firstName}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-[var(--font-brand)] text-[28px] font-black italic text-white">
              PLAYER
            </span>
            <span
              className="font-[var(--font-brand)] text-[28px] font-black italic"
              style={{ color: data.accentColor }}
            >
              REVIEW
            </span>
          </div>
        </div>

        {/* Review rows */}
        <div className="flex flex-col gap-[2px]">
          {REVIEW_ROWS.map((row, i) => {
            const isVisible = i < visibleRows;
            const isEven = i % 2 === 0;

            return (
              <div
                key={row.label}
                className="flex h-[28px] items-center overflow-hidden transition-all duration-300"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(40px)",
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <span className="w-[130px] shrink-0 text-[8px] font-semibold tracking-[2px] text-white/35">
                  {row.label}
                </span>
                <span
                  className="flex-1 rounded-sm px-3 py-1 text-[10px] font-bold tracking-wide"
                  style={{
                    background: isEven ? `${data.accentColor}22` : "rgba(255,255,255,0.04)",
                    color: isEven ? data.accentColor : "rgba(255,255,255,0.7)",
                  }}
                >
                  {row.getValue(data)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Club emblem — bottom right */}
      <div
        className="absolute bottom-4 right-6 flex h-12 w-12 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor})` }}
      >
        {data.club.replace(/\s*U\d+/, "").substring(0, 4)}
      </div>
    </div>
  );
}
