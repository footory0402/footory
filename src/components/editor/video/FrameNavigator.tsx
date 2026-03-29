"use client";

import { useRef, useCallback } from "react";

interface FrameNavigatorProps {
  currentTime: number;
  minTime: number;
  maxTime: number;
  step?: number;
  onTimeChange: (time: number) => void;
}

function fmtDetailed(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export default function FrameNavigator({
  currentTime,
  minTime,
  maxTime,
  step = 0.1,
  onTimeChange,
}: FrameNavigatorProps) {
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((dir: -1 | 1) => {
    onTimeChange(Math.max(minTime, Math.min(maxTime, currentTime + dir * step)));
  }, [currentTime, minTime, maxTime, step, onTimeChange]);

  const startRepeat = useCallback((dir: -1 | 1) => {
    if (repeatTimer.current) return;
    repeatTimer.current = setInterval(() => advance(dir), 100);
  }, [advance]);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  const handlePressStart = useCallback((dir: -1 | 1) => {
    advance(dir);
    const timeout = setTimeout(() => startRepeat(dir), 400);
    return () => { clearTimeout(timeout); stopRepeat(); };
  }, [advance, startRepeat, stopRepeat]);

  const cleanupRef = useRef<(() => void) | null>(null);

  return (
    <div
      className="flex items-center justify-center gap-5 px-4 py-3"
      style={{ background: "#0f0f11", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Prev frame */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-[16px] text-white/60 active:bg-white/10 active:text-white"
        style={{ background: "#24242a" }}
        onTouchStart={() => { cleanupRef.current = handlePressStart(-1); }}
        onTouchEnd={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        onMouseDown={() => { cleanupRef.current = handlePressStart(-1); }}
        onMouseUp={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        onMouseLeave={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
      >
        ◀
      </button>

      {/* Time display */}
      <div className="text-center">
        <div className="font-stat text-[16px] font-semibold tabular-nums text-white">
          {fmtDetailed(currentTime)}
        </div>
        <div className="text-[11px] text-white/30">프리즈 시점</div>
      </div>

      {/* Next frame */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-[16px] text-white/60 active:bg-white/10 active:text-white"
        style={{ background: "#24242a" }}
        onTouchStart={() => { cleanupRef.current = handlePressStart(1); }}
        onTouchEnd={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        onMouseDown={() => { cleanupRef.current = handlePressStart(1); }}
        onMouseUp={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        onMouseLeave={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
      >
        ▶
      </button>
    </div>
  );
}
