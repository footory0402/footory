"use client";

import type { HudPlayerData } from "./types";

/**
 * 인트로 카드 — 참고 영상의 0~6초 구간 재현.
 * 경기장 배경 + 선수 컷아웃 + 이름/등번호/포지션/구단
 * 16:9 비율 (1920x1080)
 */
export default function IntroCard({ data }: { data: HudPlayerData }) {
  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-[var(--font-body)]"
      style={{
        background: `linear-gradient(135deg, ${data.mainColor} 0%, #0a0a0a 40%, ${data.mainColor}44 100%)`,
      }}
    >
      {/* Stadium background overlay */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(180deg, ${data.mainColor}66 0%, transparent 50%, ${data.mainColor}22 100%)`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${data.accentColor}, transparent)` }}
      />

      {/* Club logo — top right */}
      <div className="absolute right-8 top-6 text-right">
        <div className="text-[18px] font-black tracking-wider text-white/90">
          {data.club.replace(/\s*U\d+/, "").toUpperCase()}
        </div>
        <div className="text-[9px] tracking-[2px] text-white/30">
          FOOTBALL CLUB
        </div>
      </div>

      {/* Left: Player photo (cutout style) */}
      <div className="flex w-[45%] items-end justify-center">
        <div className="relative h-[90%] w-[85%]">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg width="120" height="150" viewBox="0 0 24 28" fill="none">
                <circle cx="12" cy="8" r="5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Right: Name + Number + Info */}
      <div className="relative flex flex-1 flex-col justify-center pr-8">
        {/* First name (small) */}
        <div className="text-[16px] font-medium uppercase tracking-[8px] text-white/40">
          {data.firstName || "FIRST"}
        </div>

        {/* Last name (large) + Number */}
        <div className="flex items-baseline gap-3">
          <span className="font-[var(--font-stat)] text-[72px] font-black uppercase leading-none tracking-wider text-white">
            {data.lastName || "LAST"}
          </span>
          <span
            className="font-[var(--font-stat)] text-[96px] font-black leading-none"
            style={{
              color: "transparent",
              WebkitTextStroke: `2px ${data.accentColor}`,
              textShadow: `0 0 40px ${data.accentColor}33`,
            }}
          >
            {data.number || "9"}
          </span>
        </div>

        {/* Info line */}
        <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-[2px]">
          <span className="text-white/30">NATIONALITY</span>
          <span style={{ color: data.accentColor }}>{data.nationality || "KOREA"}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/30">CLUB</span>
          <span style={{ color: data.accentColor }}>{data.club}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/30">POSITION</span>
          <span style={{ color: data.accentColor }}>{data.position || "FORWARD"}</span>
        </div>

        {/* Signature style name */}
        <div
          className="mt-6 text-[24px] italic tracking-wide"
          style={{
            color: data.accentColor + "66",
            fontFamily: "var(--font-brand), cursive",
          }}
        >
          {data.lastName}{data.firstName}
        </div>
      </div>

      {/* Club emblem — bottom right */}
      <div
        className="absolute bottom-6 right-8 flex h-14 w-14 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor})` }}
      >
        {data.club.replace(/\s*U\d+/, "").substring(0, 4)}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${data.mainColor}, ${data.accentColor}, ${data.mainColor})` }}
      />
    </div>
  );
}
