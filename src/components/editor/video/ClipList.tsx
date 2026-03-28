"use client";

import {
  type EventTag,
  type ClipSegment,
  EVENTS,
  EVENT_TAG_COLORS,
} from "./types";

interface ClipListProps {
  clips: ClipSegment[];
  selectedClipId?: string;
  onSelectClip: (clip: ClipSegment) => void;
  onRemoveClip: (id: string) => void;
  onUpdateClip: (id: string, updates: Partial<ClipSegment>) => void;
  onGenerate: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ClipList({
  clips,
  selectedClipId,
  onSelectClip,
  onRemoveClip,
  onUpdateClip,
  onGenerate,
}: ClipListProps) {
  if (clips.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/8 bg-[#111] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-white/50">
          마킹된 클립 ({clips.length})
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {clips.map((clip, i) => {
          const ev = EVENTS.find((e) => e.id === clip.eventTag);
          const isSelected = clip.id === selectedClipId;
          const color = EVENT_TAG_COLORS[clip.eventTag];

          return (
            <div
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5 transition-all"
              style={{
                background: isSelected ? `${color}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? `${color}44` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {/* Index */}
              <span className="w-5 shrink-0 text-center text-xs font-bold text-white/30">
                {i + 1}
              </span>

              {/* Emoji */}
              <span className="text-base">{ev?.emoji}</span>

              {/* Tag label */}
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold"
                style={{ background: `${color}20`, color }}
              >
                {ev?.label}
              </span>

              {/* Time range */}
              <span className="font-mono text-xs text-white/50">
                {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
              </span>

              {/* Duration */}
              <span className="text-[10px] text-white/30">
                ({Math.round(clip.endTime - clip.startTime)}초)
              </span>

              <div className="flex-1" />

              {/* Event change dropdown */}
              <select
                value={clip.eventTag}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  onUpdateClip(clip.id, { eventTag: e.target.value as EventTag })
                }
                className="cursor-pointer rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 outline-none"
              >
                {EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.emoji} {ev.label}
                  </option>
                ))}
              </select>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveClip(clip.id);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-red-500/20"
                aria-label="클립 삭제"
              >
                <svg
                  className="h-3 w-3 text-red-400/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Generate highlight button */}
      <button
        onClick={onGenerate}
        className="mt-4 w-full rounded-xl py-3.5 text-sm font-extrabold tracking-wider text-white transition-all active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #C0392B, #E74C3C)",
          boxShadow: "0 4px 20px rgba(231,76,60,0.2)",
        }}
      >
        🎬 하이라이트 영상 생성 ({clips.length}개 클립)
      </button>
    </div>
  );
}
