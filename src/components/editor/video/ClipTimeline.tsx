"use client";

import { useRef, useCallback } from "react";
import { type ClipSegment, EVENT_TAG_COLORS, MIN_CLIP_DURATION } from "./types";

interface ClipTimelineProps {
  duration: number;
  currentTime: number;
  clips: ClipSegment[];
  selectedClipId?: string;
  onSeek: (time: number) => void;
  onClipChange: (updated: ClipSegment) => void;
  onSelectClip: (clip: ClipSegment) => void;
}

type DragTarget =
  | { type: "seek" }
  | { type: "start"; clipId: string }
  | { type: "end"; clipId: string };

export default function ClipTimeline({
  duration,
  currentTime,
  clips,
  selectedClipId,
  onSeek,
  onClipChange,
  onSelectClip,
}: ClipTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragTarget | null>(null);

  const timeToPercent = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  const clientXToTime = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar || duration === 0) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  // ──────────────────── Pointer events ────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: DragTarget) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = target;
      if (target.type === "seek") {
        onSeek(clientXToTime(e.clientX));
      }
    },
    [clientXToTime, onSeek]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const t = clientXToTime(e.clientX);

      if (drag.type === "seek") {
        onSeek(t);
        return;
      }

      const clip = clips.find((c) => c.id === drag.clipId);
      if (!clip) return;

      if (drag.type === "start") {
        const newStart = Math.max(0, Math.min(t, clip.endTime - MIN_CLIP_DURATION));
        onClipChange({ ...clip, startTime: newStart });
      } else {
        const newEnd = Math.min(duration, Math.max(t, clip.startTime + MIN_CLIP_DURATION));
        onClipChange({ ...clip, endTime: newEnd });
      }
    },
    [clientXToTime, clips, duration, onClipChange, onSeek]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (duration === 0) {
    return (
      <div className="flex h-12 items-center justify-center rounded-xl bg-white/4 text-xs text-white/30">
        영상을 불러오면 타임라인이 표시됩니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Time markers */}
      <div className="flex justify-between px-1 text-[10px] font-mono text-white/30">
        <span>0:00</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main bar */}
      <div
        ref={barRef}
        className="relative h-10 cursor-pointer select-none touch-none rounded-lg bg-white/8 overflow-hidden"
        onPointerDown={(e) => handlePointerDown(e, { type: "seek" })}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Clip segments */}
        {clips.map((clip) => {
          const left = timeToPercent(clip.startTime);
          const width = timeToPercent(clip.endTime) - left;
          const isSelected = selectedClipId === clip.id;
          const color = EVENT_TAG_COLORS[clip.eventTag];

          return (
            <div
              key={clip.id}
              className="absolute top-0 h-full"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {/* Segment fill */}
              <div
                className="absolute inset-0 transition-opacity"
                style={{
                  background: color + (isSelected ? "55" : "33"),
                  borderTop: `2px solid ${color}`,
                  borderBottom: `2px solid ${color}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectClip(clip);
                }}
              />

              {/* Start handle */}
              <div
                className="absolute top-0 bottom-0 left-0 flex w-4 cursor-ew-resize items-center justify-center z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e, { type: "start", clipId: clip.id });
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="h-6 w-1.5 rounded-full"
                  style={{ background: color }}
                />
              </div>

              {/* End handle */}
              <div
                className="absolute top-0 bottom-0 right-0 flex w-4 cursor-ew-resize items-center justify-center z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e, { type: "end", clipId: clip.id });
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="h-6 w-1.5 rounded-full"
                  style={{ background: color }}
                />
              </div>
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/90 z-20 pointer-events-none"
          style={{ left: `${timeToPercent(currentTime)}%` }}
        >
          {/* Playhead triangle */}
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/90" />
        </div>
      </div>

      {/* Current time label */}
      <div className="px-1 text-[10px] font-mono text-white/40">
        현재 위치: {formatTime(currentTime)}
        {clips.length > 0 && (
          <span className="ml-3 text-white/25">클립 {clips.length}개</span>
        )}
      </div>
    </div>
  );
}
