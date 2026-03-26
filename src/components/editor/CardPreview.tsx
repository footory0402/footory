"use client";

import { useState, useCallback } from "react";
import { Eye } from "lucide-react";
import { TEMPLATES, type TemplateId } from "./constants";
import type { PlayerData } from "./types";
import FifaCard from "./cards/FifaCard";
import BroadcastCard from "./cards/BroadcastCard";
import MinimalCard from "./cards/MinimalCard";

interface CardPreviewProps {
  data: PlayerData;
  template: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
}

export default function CardPreview({ data, template, onTemplateChange }: CardPreviewProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const playPreview = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto bg-[#0a0a0c] p-4 md:gap-6 md:p-8">
      {/* Template Tabs + Preview Button */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <div className="flex gap-1 rounded-xl bg-[#1a1a1e] p-1 ring-1 ring-white/6 md:gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onTemplateChange(t.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all md:px-4 md:py-2 md:text-xs ${
                template === t.id
                  ? "bg-accent text-black shadow-sm"
                  : "text-text-3 hover:text-text-1"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <button
          onClick={playPreview}
          disabled={isAnimating}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-[11px] font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50 md:py-2 md:text-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          미리보기
        </button>
      </div>

      {/* Card — scale down on mobile */}
      <div
        className="origin-top transition-transform duration-300"
        style={{
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
          transform: template === "broadcast" ? "scale(var(--card-scale, 1))" : undefined,
        }}
      >
        <div
          id="card-capture-target"
          className={`${isAnimating ? "animate-card-intro" : ""} ${template === "broadcast" ? "scale-[0.55] origin-top md:scale-100" : "scale-[0.85] origin-top md:scale-100"}`}
        >
          {template === "fifa" && <FifaCard data={data} />}
          {template === "broadcast" && <BroadcastCard data={data} />}
          {template === "minimal" && <MinimalCard data={data} />}
        </div>
      </div>
    </main>
  );
}
