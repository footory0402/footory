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

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(parseFloat(e.target.value));
  }, [onTimeChange]);

  const rangeDuration = maxTime - minTime;
  const progress = rangeDuration > 0 ? ((currentTime - minTime) / rangeDuration) * 100 : 0;

  return (
    <div
      className="flex flex-col gap-1.5 px-4 py-2"
      style={{ background: "#0c0c0e", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Scrub bar */}
      <div className="relative h-5 flex items-center">
        <input
          type="range"
          min={minTime}
          max={maxTime}
          step={step}
          value={currentTime}
          onChange={handleScrub}
          className="w-full h-1 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #D4A853 0%, #D4A853 ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-4">
        {/* Prev frame */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px] text-white/60 active:bg-white/10 active:text-white"
          style={{ background: "#1a1a1e" }}
          onTouchStart={() => { cleanupRef.current = handlePressStart(-1); }}
          onTouchEnd={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
          onMouseDown={() => { cleanupRef.current = handlePressStart(-1); }}
          onMouseUp={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
          onMouseLeave={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        >
          ◀
        </button>

        {/* Time display */}
        <div className="text-center min-w-[100px]">
          <div className="font-stat text-[14px] font-semibold tabular-nums text-white">
            {fmtDetailed(currentTime)}
          </div>
          <div className="text-[9px] text-white/25">프리즈 시점</div>
        </div>

        {/* Next frame */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px] text-white/60 active:bg-white/10 active:text-white"
          style={{ background: "#1a1a1e" }}
          onTouchStart={() => { cleanupRef.current = handlePressStart(1); }}
          onTouchEnd={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
          onMouseDown={() => { cleanupRef.current = handlePressStart(1); }}
          onMouseUp={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
          onMouseLeave={() => { cleanupRef.current?.(); cleanupRef.current = null; }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
