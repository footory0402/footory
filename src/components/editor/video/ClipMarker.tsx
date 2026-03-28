"use client";

import { useState } from "react";
import {
  type EventTag,
  type ClipSegment,
  EVENT_TAG_LABELS,
  EVENT_TAG_COLORS,
  DEFAULT_CLIP_DURATION,
  MAX_CLIPS,
} from "./types";

interface ClipMarkerProps {
  currentTime: number;
  duration: number;
  clips: ClipSegment[];
  onAddClip: (clip: ClipSegment) => void;
  onRemoveClip: (id: string) => void;
  onSelectClip: (clip: ClipSegment) => void;
  selectedClipId?: string;
}

export default function ClipMarker({
  currentTime,
  duration,
  clips,
  onAddClip,
  onRemoveClip,
  onSelectClip,
  selectedClipId,
}: ClipMarkerProps) {
  const [selectedTag, setSelectedTag] = useState<EventTag>("goal");

  const handleMark = () => {
    if (clips.length >= MAX_CLIPS) return;
    if (duration === 0) return;

    const half = DEFAULT_CLIP_DURATION / 2;
    const startTime = Math.max(0, currentTime - half);
    const endTime = Math.min(duration, currentTime + half);

    const clip: ClipSegment = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      eventTag: selectedTag,
    };
    onAddClip(clip);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tag selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(EVENT_TAG_LABELS) as [EventTag, string][]).map(([tag, label]) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95"
            style={{
              background: selectedTag === tag ? EVENT_TAG_COLORS[tag] : "rgba(255,255,255,0.08)",
              color: selectedTag === tag ? "#fff" : "rgba(255,255,255,0.5)",
              border: `1px solid ${selectedTag === tag ? EVENT_TAG_COLORS[tag] : "rgba(255,255,255,0.1)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mark button */}
      <button
        onClick={handleMark}
        disabled={clips.length >= MAX_CLIPS || duration === 0}
        className="w-full rounded-xl py-4 font-[var(--font-brand)] text-xl font-black tracking-widest text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: clips.length >= MAX_CLIPS ? "#555" : "#D4A853" }}
      >
        여기! ⚡
      </button>

      {clips.length >= MAX_CLIPS && (
        <p className="text-center text-xs text-white/40">최대 {MAX_CLIPS}개 클립까지 가능합니다</p>
      )}

      {/* Clip list */}
      {clips.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 tracking-wide">마킹된 클립</span>
            <span className="text-xs text-white/30">{clips.length}/{MAX_CLIPS}</span>
          </div>

          {clips.map((clip, i) => (
            <button
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
              style={{
                background: selectedClipId === clip.id
                  ? "rgba(212,168,83,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedClipId === clip.id ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {/* Index */}
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-black"
                style={{ background: EVENT_TAG_COLORS[clip.eventTag] }}
              >
                {i + 1}
              </span>

              {/* Tag + time */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white/80">
                  {EVENT_TAG_LABELS[clip.eventTag]}
                </div>
                <div className="text-[10px] font-mono text-white/40">
                  {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
                  <span className="ml-1.5 text-white/25">
                    ({Math.round(clip.endTime - clip.startTime)}초)
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveClip(clip.id); }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                aria-label="클립 삭제"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
