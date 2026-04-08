"use client";

import { useRef, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";

const SPEEDS = [
  { label: "0.25x", value: 0.25, desc: "슈퍼 슬로우" },
  { label: "0.5x", value: 0.5, desc: "슬로우" },
];

interface SlowmoTabProps {
  embedded?: boolean;
}

export default function SlowmoTab({ embedded = false }: SlowmoTabProps) {
  const trimStart = useUploadStore((s) => s.trimStart);
  const trimEnd = useUploadStore((s) => s.trimEnd);
  const duration = useUploadStore((s) => s.duration) ?? 0;
  const slowmoStart = useUploadStore((s) => s.slowmoStart);
  const slowmoEnd = useUploadStore((s) => s.slowmoEnd);
  const slowmoSpeed = useUploadStore((s) => s.slowmoSpeed);
  const setSlowmo = useUploadStore((s) => s.setSlowmo);
  const setSlowmoSpeed = useUploadStore((s) => s.setSlowmoSpeed);

  const effectiveTrimEnd = trimEnd ?? duration;
  const clipDuration = effectiveTrimEnd - trimStart;

  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  // 터치/마우스 위치 → 0~1 비율
  const posToRatio = useCallback((clientX: number): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const ratioToTime = useCallback((ratio: number): number => {
    return trimStart + ratio * clipDuration;
  }, [trimStart, clipDuration]);

  const timeToRatio = useCallback((time: number): number => {
    if (clipDuration === 0) return 0;
    return (time - trimStart) / clipDuration;
  }, [trimStart, clipDuration]);

  const handleBarTouchStart = useCallback((e: React.TouchEvent) => {
    if (!slowmoStart) {
      // 처음 터치 → 구간 초기화
      const ratio = posToRatio(e.touches[0].clientX);
      const t = ratioToTime(ratio);
      setSlowmo(t, Math.min(t + clipDuration * 0.3, effectiveTrimEnd));
    }
  }, [slowmoStart, posToRatio, ratioToTime, clipDuration, effectiveTrimEnd, setSlowmo]);

  const handleHandleTouchStart = useCallback((handle: "start" | "end") => (e: React.TouchEvent) => {
    e.stopPropagation();
    dragging.current = handle;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    const ratio = posToRatio(e.touches[0].clientX);
    const t = ratioToTime(ratio);
    if (dragging.current === "start") {
      const newStart = Math.max(trimStart, Math.min(t, (slowmoEnd ?? effectiveTrimEnd) - 0.5));
      setSlowmo(newStart, slowmoEnd);
    } else {
      const newEnd = Math.min(effectiveTrimEnd, Math.max(t, (slowmoStart ?? trimStart) + 0.5));
      setSlowmo(slowmoStart, newEnd);
    }
  }, [posToRatio, ratioToTime, trimStart, effectiveTrimEnd, slowmoStart, slowmoEnd, setSlowmo]);

  const handleTouchEnd = useCallback(() => {
    dragging.current = null;
  }, []);

  const formatTime = (t: number) => {
    const min = Math.floor(t / 60);
    const sec = (t % 60).toFixed(1);
    return min > 0 ? `${min}:${sec.padStart(4, "0")}` : `${sec}s`;
  };

  const hasSlowmo = slowmoStart !== null && slowmoEnd !== null;
  const startRatio = hasSlowmo ? timeToRatio(slowmoStart) : 0;
  const endRatio = hasSlowmo ? timeToRatio(slowmoEnd) : 0;

  return (
    <div className={`${embedded ? "space-y-4" : "px-4 pt-4 pb-6 space-y-5"}`}>
      {/* 가이드 텍스트 */}
      {!embedded && (
        <div className="rounded-xl p-3" style={{ background: "rgba(212,168,83,0.07)", border: "1px solid rgba(212,168,83,0.15)" }}>
          <p className="text-[12px] text-accent/80 leading-relaxed">
            💡 핸들을 드래그해 슬로모션 구간을 설정하세요. 재생 중 해당 구간만 느리게 재생됩니다.
          </p>
        </div>
      )}

      {/* 타임라인 바 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-text-2">구간 설정</span>
          {hasSlowmo && (
            <button
              type="button"
              onClick={() => setSlowmo(null, null)}
              className="text-[11px] text-text-3 underline underline-offset-2 active:text-text-1"
            >
              초기화
            </button>
          )}
        </div>

        <div
          ref={barRef}
          className="relative h-10 flex items-center cursor-pointer select-none"
          onTouchStart={handleBarTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 전체 트랙 */}
          <div className="absolute inset-x-0 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* 슬로모 구간 강조 */}
          {hasSlowmo && (
            <div
              className="absolute h-2 rounded-full"
              style={{
                left: `${startRatio * 100}%`,
                width: `${(endRatio - startRatio) * 100}%`,
                background: "linear-gradient(90deg, #D4A853, #F5E6B8)",
              }}
            />
          )}

          {/* 시작 핸들 */}
          {hasSlowmo && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-7 rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${startRatio * 100}%`, background: "#D4A853", boxShadow: "0 2px 8px rgba(212,168,83,0.5)" }}
              onTouchStart={handleHandleTouchStart("start")}
            >
              <div className="flex flex-col gap-[3px]">
                <div className="w-[2px] h-[10px] rounded-full bg-black/60" />
              </div>
            </div>
          )}

          {/* 끝 핸들 */}
          {hasSlowmo && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-7 rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${endRatio * 100}%`, background: "#D4A853", boxShadow: "0 2px 8px rgba(212,168,83,0.5)" }}
              onTouchStart={handleHandleTouchStart("end")}
            >
              <div className="flex flex-col gap-[3px]">
                <div className="w-[2px] h-[10px] rounded-full bg-black/60" />
              </div>
            </div>
          )}
        </div>

        {/* 시간 표시 */}
        {hasSlowmo ? (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-mono text-accent">{formatTime(slowmoStart)}</span>
            <span className="text-[11px] text-text-3">
              구간 {formatTime(slowmoEnd - slowmoStart)} ({slowmoSpeed}x 속도)
            </span>
            <span className="text-[11px] font-mono text-accent">{formatTime(slowmoEnd)}</span>
          </div>
        ) : (
          <p className="text-[11px] text-white/25 text-center mt-1">
            타임라인을 터치하여 구간을 설정하세요
          </p>
        )}
      </div>

      {/* 속도 선택 */}
      <div>
        <p className="text-[11px] font-semibold text-text-2 mb-2.5">재생 속도</p>
        <div className="flex gap-2">
          {SPEEDS.map((s) => {
            const selected = slowmoSpeed === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSlowmoSpeed(s.value)}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-all active:scale-95"
                style={{
                  background: selected ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${selected ? "#D4A853" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <span
                  className="text-[20px] font-bold font-stat"
                  style={{ color: selected ? "#D4A853" : "rgba(255,255,255,0.4)" }}
                >
                  {s.label}
                </span>
                <span className="text-[10px]" style={{ color: selected ? "#D4A853" : "rgba(255,255,255,0.3)" }}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 사용 팁 */}
      {!hasSlowmo && !embedded && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[11px] text-text-3 leading-relaxed">
              슈팅 직전 또는 드리블 순간에 슬로모션을 넣으면 더 드라마틱한 하이라이트가 됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
