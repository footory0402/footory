"use client";

import { useState, useCallback } from "react";

interface Clip {
  id: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

interface ClipSelectorProps {
  clips: Clip[];
  selected: string[];
  maxDuration?: number;
  onSelectionChange: (ids: string[]) => void;
}

export default function ClipSelector({
  clips,
  selected,
  maxDuration = 60,
  onSelectionChange,
}: ClipSelectorProps) {
  const totalDuration = clips
    .filter((c) => selected.includes(c.id))
    .reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0);

  const toggleClip = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        onSelectionChange(selected.filter((s) => s !== id));
      } else {
        // 시간 초과 체크
        const clip = clips.find((c) => c.id === id);
        const newTotal = totalDuration + (clip?.durationSeconds ?? 0);
        if (newTotal > maxDuration) return;

        onSelectionChange([...selected, id]);
      }
    },
    [clips, selected, totalDuration, maxDuration, onSelectionChange]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 듀레이션 바 */}
      <div className="flex items-center justify-between text-[12px] text-text-3">
        <span>
          {selected.length}개 선택 · {totalDuration}초
        </span>
        <span
          className={
            totalDuration > maxDuration ? "text-red-400" : "text-accent"
          }
        >
          최대 {maxDuration}초
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all ${
            totalDuration > maxDuration ? "bg-red-400" : "bg-accent"
          }`}
          style={{
            width: `${Math.min(100, (totalDuration / maxDuration) * 100)}%`,
          }}
        />
      </div>

      {/* 클립 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {clips.map((clip) => {
          const isSelected = selected.includes(clip.id);
          const index = selected.indexOf(clip.id);

          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => toggleClip(clip.id)}
              className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-colors ${
                isSelected ? "border-accent" : "border-transparent"
              }`}
            >
              {clip.thumbnailUrl ? (
                <img
                  src={clip.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-card">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-text-3"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              )}

              {/* 듀레이션 뱃지 */}
              {clip.durationSeconds && (
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-stat text-white">
                  {formatDuration(clip.durationSeconds)}
                </span>
              )}

              {/* 선택 순서 */}
              {isSelected && (
                <div className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-bg">
                  {index + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
