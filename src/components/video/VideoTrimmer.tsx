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
            className="absolute inset-y-0 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${startPct}%` }}
            onPointerDown={handlePointerDown("start")}
          >
            <div className="mx-auto h-full w-1 rounded-full bg-accent" />
          </div>

          {/* 오른쪽 핸들 */}
          <div
            className="absolute inset-y-0 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${endPct}%` }}
            onPointerDown={handlePointerDown("end")}
          >
            <div className="mx-auto h-full w-1 rounded-full bg-accent" />
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

      {/* 가이드 */}
      <p className="text-center text-[12px] text-text-3">
        양쪽 핸들을 드래그하여 구간을 선택하세요 (3초~60초)
      </p>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
