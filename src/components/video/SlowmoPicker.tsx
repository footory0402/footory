"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface SlowmoPickerProps {
  trimStart: number;
  trimEnd: number;
  slowmoStart: number | null;
  slowmoEnd: number | null;
  slowmoSpeed: number;
  onSlowmoChange: (
    start: number | null,
    end: number | null,
    speed: number
  ) => void;
}

const MIN_SLOWMO = 2;
const MAX_SLOWMO = 10;
const SPEEDS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.3, label: "0.3x" },
  { value: 0.25, label: "0.25x" },
];

export default function SlowmoPicker({
  trimStart,
  trimEnd,
  slowmoStart,
  slowmoEnd,
  slowmoSpeed,
  onSlowmoChange,
}: SlowmoPickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);
  const [speed, setSpeed] = useState(slowmoSpeed);

  const trimDuration = trimEnd - trimStart;

  // 초기값 설정
  const start = slowmoStart ?? trimStart;
  const end = slowmoEnd ?? Math.min(trimStart + 5, trimEnd);

  const slowmoDuration = end - start;
  const resultDuration = (slowmoDuration / speed).toFixed(1);

  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || trimDuration <= 0) return trimStart;

      const rect = track.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      return trimStart + ratio * trimDuration;
    },
    [trimStart, trimDuration]
  );

  const handlePointerDown = useCallback(
    (type: "start" | "end") => (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = type;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const time = getTimeFromPosition(e.clientX);

      if (dragging.current === "start") {
        const clamped = Math.max(trimStart, Math.min(time, end - MIN_SLOWMO));
        onSlowmoChange(clamped, end, speed);
      } else {
        const maxEnd = Math.min(trimEnd, start + MAX_SLOWMO);
        const minEnd = start + MIN_SLOWMO;
        const clamped = Math.max(minEnd, Math.min(time, maxEnd));
        onSlowmoChange(start, clamped, speed);
      }
    },
    [getTimeFromPosition, start, end, trimStart, trimEnd, speed, onSlowmoChange]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      onSlowmoChange(start, end, newSpeed);
    },
    [start, end, onSlowmoChange]
  );

  const handleClear = useCallback(() => {
    onSlowmoChange(null, null, 0.5);
  }, [onSlowmoChange]);

  const startPct = ((start - trimStart) / trimDuration) * 100;
  const endPct = ((end - trimStart) / trimDuration) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* 타임라인 */}
      <div className="px-2">
        <div
          ref={trackRef}
          className="relative h-12 rounded-lg bg-[#1E1E22]"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* 슬로모 구간 */}
          <div
            className="absolute inset-y-0 rounded border-x-2 border-[#7F77DD] bg-[#7F77DD]/20"
            style={{
              left: `${startPct}%`,
              width: `${endPct - startPct}%`,
            }}
          />

          {/* 왼쪽 핸들 */}
          <div
            className="absolute inset-y-0 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${startPct}%` }}
            onPointerDown={handlePointerDown("start")}
          >
            <div className="mx-auto h-full w-1 rounded-full bg-[#7F77DD]" />
          </div>

          {/* 오른쪽 핸들 */}
          <div
            className="absolute inset-y-0 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${endPct}%` }}
            onPointerDown={handlePointerDown("end")}
          >
            <div className="mx-auto h-full w-1 rounded-full bg-[#7F77DD]" />
          </div>
        </div>

        {/* 시간 표시 */}
        <div className="mt-2 flex items-center justify-between text-[12px] text-text-3">
          <span>{formatTime(start)}</span>
          <span className="font-stat text-[#7F77DD]">
            {formatTime(slowmoDuration)} → {resultDuration}초
          </span>
          <span>{formatTime(end)}</span>
        </div>
      </div>

      {/* 속도 선택 */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-text-3">속도</p>
        <div className="flex gap-2">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleSpeedChange(s.value)}
              className={`flex-1 rounded-xl border py-2.5 text-[14px] font-semibold transition-colors ${
                speed === s.value
                  ? "border-[#7F77DD] bg-[#7F77DD]/10 text-[#7F77DD]"
                  : "border-[#2a2a2e] bg-[#161618] text-text-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 안내 + 초기화 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[12px] text-text-3">
          슬로모션 구간: 2초~10초
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="text-[12px] text-text-3 underline underline-offset-2"
        >
          초기화
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
