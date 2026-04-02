"use client";

import { useState, useCallback } from "react";
import { Eye, RotateCcw, Download, Film } from "lucide-react";
import type { PlayerData } from "./types";
import EaSportsCard from "./cards/EaSportsCard";
import { useExportPng, useExportMp4 } from "./useExport";

const CARD_DIM = { width: 360, height: 520, mobileScale: 0.65 };

export default function CardPreview({ data }: { data: PlayerData }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { exportPng, status: pngStatus } = useExportPng();
  const { exportMp4, status: mp4Status, progress: mp4Progress } = useExportMp4();

  const playPreview = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  return (
    <div className="flex flex-col items-center bg-[#0a0a0c] md:min-h-[500px] md:flex-1 md:justify-center md:overflow-auto md:p-8">
      {/* Mobile: compact card */}
      <div className="relative w-full px-3 pt-3 pb-1 md:hidden">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            width: `calc(${CARD_DIM.width}px * ${CARD_DIM.mobileScale})`,
            height: `calc(${CARD_DIM.height}px * ${CARD_DIM.mobileScale})`,
          }}
        >
          <div
            data-capture="card"
            className={`origin-top-left ${isAnimating ? "animate-card-intro" : ""}`}
            style={{ transform: `scale(${CARD_DIM.mobileScale})` }}
          >
            <EaSportsCard data={data} />
          </div>
        </div>

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

      {/* Mobile: 내보내기 버튼 */}
      <div className="flex items-center gap-2 px-3 pb-2 md:hidden">
        <button
          type="button"
          onClick={exportPng}
          disabled={pngStatus !== "idle"}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/4 py-2 text-[11px] font-semibold text-text-2 active:bg-white/8 disabled:opacity-40"
        >
          <Download className="h-3 w-3" />
          {pngStatus === "capturing" ? "캡처 중…" : pngStatus === "done" ? "저장됨!" : "PNG 저장"}
        </button>
        <button
          type="button"
          onClick={exportMp4}
          disabled={mp4Status !== "idle"}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/4 py-2 text-[11px] font-semibold text-text-2 active:bg-white/8 disabled:opacity-40"
        >
          <Film className="h-3 w-3" />
          {mp4Status === "capturing" ? `프레임 ${mp4Progress}%` : mp4Status === "encoding" ? `인코딩 ${mp4Progress}%` : mp4Status === "done" ? "저장됨!" : "MP4 저장"}
        </button>
      </div>

      {/* Desktop: spacious layout */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={playPreview}
            disabled={isAnimating}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            미리보기
          </button>
          <button
            type="button"
            onClick={exportPng}
            disabled={pngStatus !== "idle"}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {pngStatus === "capturing" ? "캡처 중…" : pngStatus === "done" ? "저장됨!" : "PNG 저장"}
          </button>
          <button
            type="button"
            onClick={exportMp4}
            disabled={mp4Status !== "idle"}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            <Film className="h-3.5 w-3.5" />
            {mp4Status === "capturing" ? `프레임 ${mp4Progress}%` : mp4Status === "encoding" ? `인코딩 ${mp4Progress}%` : mp4Status === "done" ? "저장됨!" : "MP4 저장"}
          </button>
        </div>
        <div style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}>
          <div
            data-capture="card"
            className={isAnimating ? "animate-card-intro" : ""}
          >
            <EaSportsCard data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
