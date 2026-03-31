"use client";

import { useState, useCallback } from "react";
import { Eye, RotateCcw } from "lucide-react";
import type { PlayerData } from "./types";
import type { TemplateId } from "./constants";
import BroadcastCard from "./cards/BroadcastCard";
import EaSportsCard from "./cards/EaSportsCard";

interface CardPreviewProps {
  data: PlayerData;
  template: TemplateId;
  onTemplateChange: (t: TemplateId) => void;
}

const TEMPLATES: { id: TemplateId; label: string; icon: string }[] = [
  { id: "fifa", label: "EA Sports", icon: "🃏" },
  { id: "broadcast", label: "방송 스타일", icon: "📺" },
];

function CardContent({ data, template }: { data: PlayerData; template: TemplateId }) {
  if (template === "fifa") return <EaSportsCard data={data} />;
  return <BroadcastCard data={data} />;
}

// 템플릿별 원본 크기와 모바일 스케일
function getCardDimensions(template: TemplateId) {
  if (template === "fifa") {
    return { width: 360, height: 520, mobileScale: 0.65 };
  }
  return { width: 640, height: 360, mobileScale: 0.57 };
}

export default function CardPreview({ data, template, onTemplateChange }: CardPreviewProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const playPreview = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  const dim = getCardDimensions(template);

  return (
    <div className="flex flex-col items-center bg-[#0a0a0c] md:min-h-[500px] md:flex-1 md:justify-center md:overflow-auto md:p-8">
      {/* 템플릿 선택 토글 */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 md:pb-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTemplateChange(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
              template === t.id
                ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                : "bg-white/4 text-text-3 active:text-text-2"
            }`}
          >
            <span className="text-[13px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mobile: compact card */}
      <div className="relative w-full px-3 pb-1 md:hidden">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            width: `calc(${dim.width}px * ${dim.mobileScale})`,
            height: `calc(${dim.height}px * ${dim.mobileScale})`,
          }}
        >
          <div
            data-capture="card"
            className={`origin-top-left ${isAnimating ? "animate-card-intro" : ""}`}
            style={{ transform: `scale(${dim.mobileScale})` }}
          >
            <CardContent data={data} template={template} />
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
        <div style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}>
          <div
            data-capture="card"
            className={isAnimating ? "animate-card-intro" : ""}
          >
            <CardContent data={data} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}
