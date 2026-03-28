"use client";

import { useRef, useCallback, useState } from "react";
import { type ClipSegment, EVENT_TAG_COLORS, EVENTS, MIN_CLIP_DURATION } from "./types";

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
  const [dragTime, setDragTime] = useState<{ time: number; percent: number } | null>(null);

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  const toTime = useCallback((clientX: number): number => {
    const bar = barRef.current;
    if (!bar || duration === 0) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
  }, [duration]);

  const onDown = useCallback((e: React.PointerEvent, target: DragTarget) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = target;
    const t = toTime(e.clientX);
    if (target.type === "seek") onSeek(t);
    else setDragTime({ time: t, percent: pct(t) });
  }, [toTime, onSeek, pct]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const t = toTime(e.clientX);
    if (drag.type === "seek") { onSeek(t); return; }
    const clip = clips.find((c) => c.id === drag.clipId);
    if (!clip) return;
    if (drag.type === "start") {
      const v = Math.max(0, Math.min(t, clip.endTime - MIN_CLIP_DURATION));
      onClipChange({ ...clip, startTime: v });
      setDragTime({ time: v, percent: pct(v) });
    } else {
      const v = Math.min(duration, Math.max(t, clip.startTime + MIN_CLIP_DURATION));
      onClipChange({ ...clip, endTime: v });
      setDragTime({ time: v, percent: pct(v) });
    }
  }, [toTime, clips, duration, onClipChange, onSeek, pct]);

  const onUp = useCallback(() => { dragRef.current = null; setDragTime(null); }, []);

  if (duration === 0) {
    return (
      <div className="flex h-10 items-center justify-center rounded-xl text-[11px] text-white/20"
        style={{ background: "rgba(255,255,255,0.03)" }}>
        영상을 불러오면 타임라인이 표시됩니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* 타임라인 바 */}
      <div
        ref={barRef}
        className="relative h-12 cursor-pointer select-none touch-none rounded-xl overflow-visible"
        style={{ background: "rgba(255,255,255,0.05)" }}
        onPointerDown={(e) => onDown(e, { type: "seek" })}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* 틱 마크 (10분할) */}
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="absolute top-0 h-full w-px bg-white/[0.04]"
            style={{ left: `${(i + 1) * 10}%` }} />
        ))}

        {/* 클립 세그먼트 */}
        {clips.map((clip) => {
          const left = pct(clip.startTime);
          const width = pct(clip.endTime) - left;
          const sel = selectedClipId === clip.id;
          const color = EVENT_TAG_COLORS[clip.eventTag];
          const ev = EVENTS.find((e) => e.id === clip.eventTag);

          return (
            <div key={clip.id} className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%` }}>
              {/* 채우기 */}
              <div className="absolute inset-0 rounded-lg transition-all"
                style={{
                  background: `linear-gradient(180deg, ${color}${sel ? "44" : "22"}, ${color}${sel ? "33" : "11"})`,
                  border: sel ? `2px solid ${color}88` : `1px solid ${color}33`,
                  boxShadow: sel ? `0 0 12px ${color}22` : "none",
                }}
                onClick={(e) => { e.stopPropagation(); onSelectClip(clip); }}
              />

              {/* 클립 라벨 */}
              {width > 6 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold" style={{ color: color + (sel ? "cc" : "66") }}>
                    {ev?.emoji}
                  </span>
                </div>
              )}

              {/* 시작 핸들 — 넓은 터치 영역 */}
              <div className="absolute -left-3 top-0 bottom-0 flex w-10 cursor-ew-resize items-center justify-center z-10"
                onPointerDown={(e) => { e.stopPropagation(); onDown(e, { type: "start", clipId: clip.id }); }}
                onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                <div className="h-7 w-1.5 rounded-full transition-all"
                  style={{
                    background: sel ? color : color + "88",
                    boxShadow: sel ? `0 0 8px ${color}44` : "none",
                  }} />
              </div>

              {/* 끝 핸들 */}
              <div className="absolute -right-3 top-0 bottom-0 flex w-10 cursor-ew-resize items-center justify-center z-10"
                onPointerDown={(e) => { e.stopPropagation(); onDown(e, { type: "end", clipId: clip.id }); }}
                onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                <div className="h-7 w-1.5 rounded-full transition-all"
                  style={{
                    background: sel ? color : color + "88",
                    boxShadow: sel ? `0 0 8px ${color}44` : "none",
                  }} />
              </div>
            </div>
          );
        })}

        {/* 드래그 시 시간 팝업 */}
        {dragTime && (
          <div className="absolute -top-7 -translate-x-1/2 z-30 pointer-events-none"
            style={{ left: `${Math.max(8, Math.min(92, dragTime.percent))}%` }}>
            <div className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-mono font-bold text-black shadow-lg">
              {fmtPrecise(dragTime.time)}
            </div>
            <div className="mx-auto h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-accent" />
          </div>
        )}

        {/* 재생 헤드 */}
        <div className="absolute top-0 h-full w-[2px] z-20 pointer-events-none transition-[left] duration-75"
          style={{ left: `${pct(currentTime)}%`, background: "rgba(255,255,255,0.85)" }}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow-md" />
        </div>
      </div>

      {/* 시간 라벨 */}
      <div className="flex justify-between px-0.5">
        <span className="font-mono text-[9px] text-white/20">{fmt(0)}</span>
        <span className="font-mono text-[9px] text-white/20">{fmt(duration)}</span>
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtPrecise(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
}
