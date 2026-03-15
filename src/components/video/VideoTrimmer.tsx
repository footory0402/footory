"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useVideoTrimmer } from "@/hooks/useVideoTrimmer";

interface VideoTrimmerProps {
  file: File;
  trimStart: number;
  trimEnd: number | null;
  onTrimChange: (start: number, end: number) => void;
}

export default function VideoTrimmer({
  file,
  trimStart: externalStart,
  trimEnd: externalEnd,
  onTrimChange,
}: VideoTrimmerProps) {
  const {
    duration,
    trimStart,
    trimEnd,
    isPlaying,
    selectedDuration,
    videoRef,
    setTrimStart,
    setTrimEnd,
    togglePlay,
    onTimeUpdate,
  } = useVideoTrimmer(file);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  // 비디오 URL 생성
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 외부 초기값 동기화 (마운트 시 1회만)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (duration <= 0) return;
    initializedRef.current = true;
    if (externalStart > 0) setTrimStart(externalStart);
    if (externalEnd !== null) setTrimEnd(externalEnd);
  }, [duration, externalStart, externalEnd, setTrimStart, setTrimEnd]);

  // 변경 사항 부모로 전파 (ref로 최신 콜백 유지)
  const onTrimChangeRef = useRef(onTrimChange);
  onTrimChangeRef.current = onTrimChange;
  const prevTrimRef = useRef({ start: trimStart, end: trimEnd });
  useEffect(() => {
    if (prevTrimRef.current.start !== trimStart || prevTrimRef.current.end !== trimEnd) {
      prevTrimRef.current = { start: trimStart, end: trimEnd };
      onTrimChangeRef.current(trimStart, trimEnd);
    }
  }, [trimStart, trimEnd]);

  // 터치/마우스 드래그 핸들러
  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;

      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
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
        setTrimStart(time);
      } else {
        setTrimEnd(time);
      }
    },
    [getTimeFromPosition, setTrimStart, setTrimEnd]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  if (duration <= 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const startPct = (trimStart / duration) * 100;
  const endPct = (trimEnd / duration) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* 비디오 프리뷰 */}
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          playsInline
          muted
          onTimeUpdate={onTimeUpdate}
        />
        {/* 재생/일시정지 */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity active:opacity-70"
        >
          {!isPlaying && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* 트림 타임라인 */}
      <div className="px-2">
        <div
          ref={trackRef}
          className="relative h-12 rounded-lg bg-[#1E1E22]"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* 선택 구간 하이라이트 */}
          <div
            className="absolute inset-y-0 rounded bg-accent/20 border-x-2 border-accent"
            style={{
              left: `${startPct}%`,
              width: `${endPct - startPct}%`,
            }}
          />

          {/* 왼쪽 핸들 */}
          <div
            className="absolute inset-y-0 w-11 -translate-x-1/2 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            style={{ left: `${startPct}%` }}
            onPointerDown={handlePointerDown("start")}
            tabIndex={0}
            role="slider"
            aria-label="구간 시작 지점"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(trimStart)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") { e.preventDefault(); setTrimStart(Math.max(0, trimStart - 1)); }
              if (e.key === "ArrowRight") { e.preventDefault(); setTrimStart(Math.min(trimEnd - 3, trimStart + 1)); }
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-6 rounded-full border-2 border-accent bg-accent/20 shadow-[0_0_8px_rgba(212,168,83,0.3)] transition-transform active:scale-125" />
            </div>
            <div className="mx-auto h-full w-0.5 rounded-full bg-accent" />
          </div>

          {/* 오른쪽 핸들 */}
          <div
            className="absolute inset-y-0 w-11 -translate-x-1/2 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            style={{ left: `${endPct}%` }}
            onPointerDown={handlePointerDown("end")}
            tabIndex={0}
            role="slider"
            aria-label="구간 종료 지점"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(trimEnd)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") { e.preventDefault(); setTrimEnd(Math.max(trimStart + 3, trimEnd - 1)); }
              if (e.key === "ArrowRight") { e.preventDefault(); setTrimEnd(Math.min(duration, trimEnd + 1)); }
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-6 rounded-full border-2 border-accent bg-accent/20 shadow-[0_0_8px_rgba(212,168,83,0.3)] transition-transform active:scale-125" />
            </div>
            <div className="mx-auto h-full w-0.5 rounded-full bg-accent" />
          </div>
        </div>

        {/* 시간 표시 */}
        <div className="mt-2 flex items-center justify-between text-[12px] text-text-3">
          <span>{formatTime(trimStart)}</span>
          <span className="font-stat text-accent">
            {formatTime(selectedDuration)}
          </span>
          <span>{formatTime(trimEnd)}</span>
        </div>
      </div>

      {/* 미세 조정 버튼 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTrimStart(Math.max(0, trimStart - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-[12px] font-semibold text-text-2 active:bg-card-alt"
          >
            -1s
          </button>
          <span className="px-1 text-[11px] text-text-3">시작</span>
          <button
            type="button"
            onClick={() => setTrimStart(Math.min(trimEnd - 3, trimStart + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-[12px] font-semibold text-text-2 active:bg-card-alt"
          >
            +1s
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTrimEnd(Math.max(trimStart + 3, trimEnd - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-[12px] font-semibold text-text-2 active:bg-card-alt"
          >
            -1s
          </button>
          <span className="px-1 text-[11px] text-text-3">끝</span>
          <button
            type="button"
            onClick={() => setTrimEnd(Math.min(duration, trimEnd + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-[12px] font-semibold text-text-2 active:bg-card-alt"
          >
            +1s
          </button>
        </div>
      </div>

      {/* 가이드 */}
      <p className="text-center text-[12px] text-text-3">
        핸들을 드래그하거나 버튼으로 구간을 조정하세요 (3초~60초)
      </p>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
