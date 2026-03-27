"use client";

/** 아웃트로 카드 — Footory 로고 + 공유 CTA (3초) */
export default function OutroCard({ accentColor = "#D4A853" }: { accentColor?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0a0a0c]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-black text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}
        >
          F
        </div>
        <span className="font-[var(--font-brand)] text-[40px] font-extrabold tracking-tight">
          <span style={{ color: accentColor }}>Foot</span>
          <span className="text-white">ory</span>
        </span>
      </div>

      {/* Tagline */}
      <p className="mt-4 text-[12px] tracking-[4px] text-white/30">
        YOUR FOOTBALL STORY
      </p>

      {/* CTA */}
      <div className="mt-8 flex items-center gap-3">
        <div
          className="rounded-full px-6 py-2 text-[11px] font-bold tracking-wide text-black"
          style={{ background: accentColor }}
        >
          footory.app
        </div>
      </div>
    </div>
  );
}
