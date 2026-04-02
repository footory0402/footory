"use client";

import type { HudPlayerData, HudConfig } from "./types";

interface HudOverlayProps {
  data: HudPlayerData;
  config: HudConfig;
  /** "overlay" = 기존 absolute inset-0 방식, "docked" = 하단 고정 바만 렌더 (부모가 위치 제어) */
  mode?: "overlay" | "docked";
}

/**
 * 경기 영상 위 방송 스타일 HUD 오버레이 — 모바일 최적화 2단 레이아웃
 *
 * 상단: FOOTORY 브랜드 바
 * 하단 1행: 선수 사진 + 이름/등번호 + 포지션 뱃지
 * 하단 2행: 구단 | 생년월일 | 키/몸무게 | 주발
 */
export default function HudOverlay({ data, config, mode = "overlay" }: HudOverlayProps) {
  const posShort =
    data.positionShort ?? data.position?.slice(0, 2).toUpperCase() ?? "FW";
  const heightWeight = [
    data.height ? `${data.height}cm` : null,
    data.weight ? `${data.weight}kg` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  const stats = [
    { label: "CLUB", value: data.clubFull ?? data.club },
    { label: "BORN", value: data.birthDate || "-" },
    { label: "SIZE", value: heightWeight || "-" },
    { label: "FOOT", value: data.foot || "-" },
  ];

  // docked 모드: 바 콘텐츠만 렌더 (부모가 위치 제어)
  if (mode === "docked") {
    return (
      <div className="pointer-events-none">
        {/* 골드 액센트 라인 */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${data.accentColor}aa, ${data.accentColor}, ${data.accentColor}aa, transparent)`,
          }}
        />
        {/* 메인 바 */}
        <div
          className="backdrop-blur-md"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,12,0.85), rgba(10,10,12,0.92))",
          }}
        >
          {/* 1행: 선수 아이덴티티 */}
          <div className="flex items-center gap-3 px-3.5 pt-2.5 pb-2">
            <div
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${data.mainColor}66, ${data.mainColor}22)`,
                border: `1.5px solid ${data.accentColor}44`,
              }}
            >
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photoUrl} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-black text-white leading-tight">
                  {data.name || "PLAYER"}
                </span>
              </div>
              <div className="text-[9px] font-medium tracking-[1px] text-white/40">
                {data.clubFull ?? data.club}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[28px] font-black leading-none"
                style={{
                  color: data.accentColor,
                  fontFamily: "var(--font-stat, 'Oswald', sans-serif)",
                  textShadow: `0 0 20px ${data.accentColor}44`,
                }}
              >
                {data.number}
              </span>
              <div
                className="flex h-[26px] items-center rounded-md px-2 text-[11px] font-bold tracking-[1px] text-white"
                style={{ background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor}88)` }}
              >
                {posShort}
              </div>
            </div>
          </div>
          {/* 2행: 스탯 그리드 */}
          <div className="flex items-center border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {stats.map((item, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center py-2 text-center"
                style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <div className="text-[7px] font-semibold tracking-[1.5px] text-white/30">{item.label}</div>
                <div className="mt-0.5 text-[11px] font-bold" style={{ color: data.accentColor }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* ── 상단 브랜드 바 ── */}
      {config.showTopBar && (
        <div
          className="absolute inset-x-0 flex items-center justify-center py-2"
          style={{
            top: "calc(env(safe-area-inset-top, 16px) + 44px)",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}
        >
          <span
            className="text-[12px] font-bold tracking-[5px] text-white/80"
            style={{ fontFamily: "var(--font-brand, 'Rajdhani', sans-serif)" }}
          >
            FOOTORY
          </span>
          <span className="ml-2 text-[9px] tracking-[2px] text-white/30">
            HIGHLIGHT
          </span>
        </div>
      )}

      {/* ── 하단 선수 정보 바 ── */}
      <div
        className="absolute inset-x-0"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 16px) + 56px)" }}
      >
        {/* 골드 액센트 라인 */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${data.accentColor}aa, ${data.accentColor}, ${data.accentColor}aa, transparent)`,
          }}
        />

        {/* 메인 바 */}
        <div
          className="backdrop-blur-md"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,12,0.85), rgba(10,10,12,0.92))",
          }}
        >
          {/* 1행: 선수 아이덴티티 */}
          <div className="flex items-center gap-3 px-3.5 pt-2.5 pb-2">
            {/* 선수 사진 */}
            <div
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${data.mainColor}66, ${data.mainColor}22)`,
                border: `1.5px solid ${data.accentColor}44`,
              }}
            >
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.photoUrl}
                  alt=""
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* 이름 + 등번호 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-black text-white leading-tight">
                  {data.name || "PLAYER"}
                </span>
              </div>
              <div
                className="text-[9px] font-medium tracking-[1px] text-white/40"
              >
                {data.clubFull ?? data.club}
              </div>
            </div>

            {/* 등번호 + 포지션 뱃지 */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[28px] font-black leading-none"
                style={{
                  color: data.accentColor,
                  fontFamily: "var(--font-stat, 'Oswald', sans-serif)",
                  textShadow: `0 0 20px ${data.accentColor}44`,
                }}
              >
                {data.number}
              </span>
              <div
                className="flex h-[26px] items-center rounded-md px-2 text-[11px] font-bold tracking-[1px] text-white"
                style={{
                  background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor}88)`,
                }}
              >
                {posShort}
              </div>
            </div>
          </div>

          {/* 2행: 스탯 그리드 */}
          <div
            className="flex items-center border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {stats.map((item, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center py-2 text-center"
                style={{
                  borderLeft:
                    i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div className="text-[7px] font-semibold tracking-[1.5px] text-white/30">
                  {item.label}
                </div>
                <div
                  className="mt-0.5 text-[11px] font-bold"
                  style={{ color: data.accentColor }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
