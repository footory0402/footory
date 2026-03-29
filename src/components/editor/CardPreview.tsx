"use client";

import { useState, useCallback } from "react";
import { Eye, RotateCcw } from "lucide-react";
import type { PlayerData } from "./types";
import BroadcastCard from "./cards/BroadcastCard";

interface CardPreviewProps {
  data: PlayerData;
}

export default function CardPreview({ data }: CardPreviewProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const playPreview = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  return (
    <div className="flex flex-col items-center bg-[#0a0a0c] md:min-h-[500px] md:flex-1 md:justify-center md:overflow-auto md:p-8">
      {/* Mobile: compact card with controlled height */}
      <div className="relative w-full px-3 pt-3 pb-1 md:hidden">
        {/* Card wrapper — clip to scaled height, prevent dead space */}
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            /* 640 * 0.57 ≈ 365px (fits 390 - 24px padding), 360 * 0.57 ≈ 205px */
            width: "calc(640px * 0.57)",
            height: "calc(360px * 0.57)",
          }}
        >
          <div
            id="card-capture-target"
            className={`origin-top-left scale-[0.57] ${isAnimating ? "animate-card-intro" : ""}`}
          >
            <BroadcastCard data={data} />
          </div>
        </div>

        {/* Overlay preview button */}
        <button
          onClick={playPreview}
          disabled={isAnimating}
          className="absolute bottom-3 right-5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm transition-colors active:bg-black/80 disabled:opacity-40"
        >
          {isAnimating ? (
            <RotateCcw className="h-3 w-3 animate-spin" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          미리보기
        </button>
      </div>

      {/* Desktop: spacious layout */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-6">
        <button
          onClick={playPreview}
          disabled={isAnimating}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          미리보기
        </button>
        <div
          style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}
        >
          <div
            id="card-capture-target"
            className={isAnimating ? "animate-card-intro" : ""}
          >
            <BroadcastCard data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
