"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerData } from "./types";
import EaSportsCard from "./cards/EaSportsCard";

const CARD_W = 360;
const CARD_H = 520;

export default function CardPreview({ data }: { data: PlayerData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  // 컨테이너 너비에 맞춰 카드 스케일 자동 계산
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (width: number) => {
      const next = Math.min(1, (width - 16) / CARD_W);
      setScale(Math.max(0.38, next));
    };

    update(el.offsetWidth);

    const ro = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[340px] w-full items-center justify-center overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_28%),linear-gradient(180deg,_#18181c_0%,_#0b0b0d_100%)] px-3 py-5 md:min-h-[430px] md:px-5 md:py-7"
    >
      <div className="pointer-events-none absolute inset-x-6 top-4 h-16 rounded-full bg-[#d4a853]/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 rounded-full bg-black/40 blur-3xl" />
      <div
        className="relative overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        style={{
          width: CARD_W * scale,
          height: CARD_H * scale,
          flexShrink: 0,
        }}
      >
        <div
          data-capture="card"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: CARD_W,
            height: CARD_H,
          }}
        >
          <EaSportsCard data={data} />
        </div>
      </div>
    </div>
  );
}
