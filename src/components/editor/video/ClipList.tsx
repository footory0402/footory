"use client";

import { useState } from "react";
import {
  type EventTag,
  type ClipSegment,
  EVENTS,
  EVENT_TAG_COLORS,
  MIN_CLIP_DURATION,
} from "./types";

interface ClipListProps {
  clips: ClipSegment[];
  selectedClipId?: string;
  duration: number;
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

function parseTimeInput(val: string): number | null {
  // "1:05" or "65" or "0:05"
  const colonMatch = val.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

/** 시간 입력 인라인 컴포넌트 */
function TimeInput({
  value,
  max,
  minValue,
  onChange,
}: {
  value: number;
  max: number;
  minValue: number;
  onChange: (t: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setText(formatTime(value));
          setEditing(true);
        }}
        className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-xs text-white/70 transition-colors hover:bg-white/15 active:bg-white/20"
      >
        {formatTime(value)}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="text"
      value={text}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const parsed = parseTimeInput(text);
        if (parsed !== null) {
          onChange(Math.max(minValue, Math.min(max, parsed)));
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-14 rounded border border-accent/50 bg-black/50 px-1.5 py-0.5 text-center font-mono text-xs text-white outline-none focus:border-accent"
    />
  );
}

export default function ClipList({
  clips,
  selectedClipId,
  duration,
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
        <span className="text-[10px] text-white/25">시간을 탭하면 직접 수정 가능</span>
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
              className="flex cursor-pointer items-center gap-2 rounded-lg p-2.5 transition-all"
              style={{
                background: isSelected ? `${color}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? `${color}44` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {/* Index + Emoji */}
              <span className="w-5 shrink-0 text-center text-xs font-bold text-white/30">
                {i + 1}
              </span>
              <span className="text-base">{ev?.emoji}</span>

              {/* Tag label */}
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold"
                style={{ background: `${color}20`, color }}
              >
                {ev?.label}
              </span>

              {/* 시간 범위 — 탭하면 직접 입력 */}
              <div className="flex items-center gap-1">
                <TimeInput
                  value={clip.startTime}
                  max={clip.endTime - MIN_CLIP_DURATION}
                  minValue={0}
                  onChange={(t) => onUpdateClip(clip.id, { startTime: t })}
                />
                <span className="text-[10px] text-white/30">→</span>
                <TimeInput
                  value={clip.endTime}
                  max={duration}
                  minValue={clip.startTime + MIN_CLIP_DURATION}
                  onChange={(t) => onUpdateClip(clip.id, { endTime: t })}
                />
              </div>

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
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/20 active:bg-red-500/30"
                aria-label="클립 삭제"
              >
                <svg
                  className="h-3.5 w-3.5 text-red-400/60"
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
