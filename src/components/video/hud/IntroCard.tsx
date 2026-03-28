"use client";

import type { HudPlayerData } from "./types";

/**
 * 인트로 카드 — 16:9 풀스크린 (1920×1080)
 * 구단 컬러 배경 + 경기장 SVG + 선수 사진 + 이름/등번호
 */
export default function IntroCard({ data }: { data: HudPlayerData }) {
  const clubDisplay = data.club.replace(/\s*U\d+/, "").toUpperCase();
  const clubFull = data.clubFull ?? data.club;

  return (
    <div
      className="relative flex h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${data.mainColor}dd 0%, #0a0a0a 40%, #111 100%)`,
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Stadium background SVG */}
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
          <rect fill="#1a1a2e" width="960" height="540" />
          <ellipse cx="480" cy="480" rx="400" ry="80" fill={data.mainColor} opacity="0.3" />
          <rect x="80" y="100" width="800" height="340" rx="4" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
          <line x1="480" y1="100" x2="480" y2="440" stroke="#fff" strokeWidth="0.8" opacity="0.2" />
          <circle cx="480" cy="270" r="60" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.2" />
        </svg>
      </div>

      {/* Top gradient overlay */}
      <div
        className="absolute inset-x-0 top-0 h-[30%]"
        style={{ background: `linear-gradient(180deg, ${data.mainColor}88, transparent)` }}
      />

      {/* Left gold accent line */}
      <div
        className="absolute left-0 w-1 rounded-r-sm"
        style={{
          top: "5%",
          bottom: "5%",
          background: `linear-gradient(180deg, ${data.accentColor}, ${data.accentColor}44)`,
        }}
      />

      {/* Club name — top right */}
      <div className="absolute right-[3%] top-[5%] z-10 text-right">
        <div
          className="text-[clamp(14px,2.2vw,24px)] font-black tracking-widest text-white/90"
        >
          {clubDisplay}
        </div>
        <div className="text-[clamp(6px,0.9vw,10px)] font-medium tracking-[3px] text-white/40">
          FOOTBALL CLUB {clubDisplay}
        </div>
      </div>

      {/* Left: Player photo (cutout style, 40%) */}
      <div className="absolute bottom-0 left-0 z-10 flex h-full w-[40%] items-end justify-center">
        <div
          className="flex h-[85%] w-[80%] items-end justify-center rounded-t-lg"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08))" }}
        >
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
            />
          ) : (
            <svg width="60%" viewBox="0 0 120 180" fill="none" style={{ marginBottom: 0, opacity: 0.3 }}>
              <circle cx="60" cy="45" r="28" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <path d="M20 170c0-25 17-45 40-45s40 20 40 45" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      </div>

      {/* Right: Name + Number + Info (60%) */}
      <div className="relative z-10 ml-[40%] flex flex-1 flex-col justify-center py-[8%] pr-[5%] pl-[2%]">
        {/* First name */}
        <div
          className="text-[clamp(14px,3vw,36px)] font-semibold uppercase tracking-[4px] text-white"
          style={{ textShadow: `2px 2px 20px ${data.accentColor}66` }}
        >
          {data.firstName || "FIRST"}
        </div>

        {/* Last name + Number */}
        <div className="flex items-baseline gap-[3%]">
          <span className="font-[var(--font-stat)] text-[clamp(28px,7vw,80px)] font-black uppercase leading-none tracking-wide text-white">
            {data.lastName || "LAST"}
          </span>
          <span
            className="font-[var(--font-stat)] text-[clamp(40px,10vw,120px)] font-black leading-[0.85] text-white/90"
          >
            {data.number || "9"}
          </span>
        </div>

        {/* Info strip: NATIONALITY | CLUB | POSITION */}
        <div className="mt-[4%] flex items-center gap-0">
          {[
            { label: "NATIONALITY", value: data.nationality || "KOREA" },
            { label: "CLUB", value: clubFull },
            { label: "POSITION", value: data.position || "FORWARD" },
          ].map((item, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className="mx-[clamp(6px,1.2vw,14px)] w-px bg-white/20"
                  style={{ height: "clamp(16px,2.5vw,28px)" }}
                />
              )}
              <div>
                <div className="text-[clamp(5px,0.7vw,8px)] font-semibold tracking-[2px] text-white/40">
                  {item.label}
                </div>
                <div className="text-[clamp(8px,1.2vw,14px)] font-bold tracking-wide">
                  {/* 값의 마지막 2글자에 accent 컬러 */}
                  <span className="text-white">{item.value.slice(0, -2)}</span>
                  <span style={{ color: data.accentColor }}>{item.value.slice(-2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signature */}
        <div
          className="mt-[6%] text-[clamp(16px,4vw,48px)] italic"
          style={{
            fontFamily: "'Caveat', 'Rajdhani', cursive",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {data.lastName}{data.firstName}
        </div>
      </div>

      {/* Club emblem — bottom right */}
      <div
        className="absolute bottom-[5%] right-[3%] z-10 flex items-center justify-center rounded-full font-black text-white"
        style={{
          width: "clamp(32px,5vw,56px)",
          height: "clamp(32px,5vw,56px)",
          background: `linear-gradient(135deg, ${data.mainColor}, ${data.accentColor})`,
          border: "2px solid rgba(255,255,255,0.15)",
          fontSize: "clamp(8px,1.2vw,14px)",
        }}
      >
        {clubDisplay.substring(0, 4)}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${data.mainColor}, ${data.accentColor}, ${data.mainColor})` }}
      />
    </div>
  );
}
