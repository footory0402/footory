"use client";

import { useState } from "react";
import {
  type EventTag,
  type ClipSegment,
  EVENTS,
  DEFAULT_CLIP_DURATION,
  MAX_CLIPS,
} from "./types";

interface ClipMarkerProps {
  currentTime: number;
  duration: number;
  clipCount: number;
  onAddClip: (clip: ClipSegment) => void;
}

export default function ClipMarker({
  currentTime,
  duration,
  clipCount,
  onAddClip,
}: ClipMarkerProps) {
  const [selectedTag, setSelectedTag] = useState<EventTag>("goal");
  const isFull = clipCount >= MAX_CLIPS;

  const handleMark = () => {
    if (isFull || duration === 0) return;

    const half = DEFAULT_CLIP_DURATION / 2;
    const startTime = Math.max(0, currentTime - half);
    const endTime = Math.min(duration, currentTime + half);

    const clip: ClipSegment = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      eventTag: selectedTag,
      markedAt: currentTime,
    };
    onAddClip(clip);
  };

  return (
    <div className="rounded-xl border border-white/8 bg-[#111] p-3.5">
      <div className="flex items-center gap-2.5">
        {/* Event tags */}
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedTag(ev.id)}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
              style={{
                background: selectedTag === ev.id ? "rgba(231,76,60,0.2)" : "rgba(255,255,255,0.05)",
                color: selectedTag === ev.id ? "#E74C3C" : "rgba(255,255,255,0.4)",
                border: `1px solid ${selectedTag === ev.id ? "rgba(231,76,60,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {ev.emoji} {ev.label}
            </button>
          ))}
        </div>

        {/* Mark button */}
        <button
          onClick={handleMark}
          disabled={isFull || duration === 0}
          className="shrink-0 rounded-xl px-7 py-2.5 text-base font-black tracking-wider text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: isFull
              ? "#333"
              : "linear-gradient(135deg, #D4A843, #E74C3C)",
            boxShadow: isFull ? "none" : "0 4px 20px rgba(231,76,60,0.25)",
          }}
        >
          ⚡ 여기!
        </button>
      </div>

      <p className="mt-2 text-[10px] text-white/30">
        {isFull
          ? `최대 ${MAX_CLIPS}개 클립까지 마킹 가능합니다`
          : `이벤트를 선택하고 "여기!"를 누르면 현재 시점 ±5초가 클립으로 추가됩니다 (${clipCount}/${MAX_CLIPS})`}
      </p>
    </div>
  );
}
