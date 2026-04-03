"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ClipSegment } from "./types";
import { EVENT_TAG_COLORS, EVENTS } from "./types";
import PinchZoomVideo from "./PinchZoomVideo";
import FrameNavigator from "./FrameNavigator";
import { panToSpotlight } from "@/lib/spotlight-math";

interface SpotlightSetupViewProps {
  clips: ClipSegment[];
  videoSrc: string;
  onUpdateClip: (id: string, updates: Partial<ClipSegment>) => void;
  onDone: () => void;
  onBack: () => void;
}

export default function SpotlightSetupView({
  clips,
  videoSrc,
  onUpdateClip,
  onDone,
  onBack,
}: SpotlightSetupViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const clip = clips[currentIndex];
  const isLast = currentIndex === clips.length - 1;

  const defaultFreezeAt = clip.freezeAt ?? clip.markedAt ?? (clip.startTime + clip.endTime) / 2;
  const [freezeTime, setFreezeTime] = useState(defaultFreezeAt);

  // 현재 PinchZoomVideo의 zoom/pan 상태
  const [currentZoom, setCurrentZoom] = useState(1);
  const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // 클립 변경 시 freeze 시간 초기화
  const currentClipId = clip?.id;
  const [lastClipId, setLastClipId] = useState(currentClipId);
  if (currentClipId !== lastClipId) {
    setLastClipId(currentClipId);
    const nextClip = clips[currentIndex];
    setFreezeTime(nextClip.freezeAt ?? nextClip.markedAt ?? (nextClip.startTime + nextClip.endTime) / 2);
    setCurrentZoom(1);
    setCurrentPan({ x: 0, y: 0 });
  }

  // 영상 메타데이터 로드 후 네이티브 해상도 파악
  useEffect(() => {
    const videoEl = videoContainerRef.current?.querySelector("video");
    if (!videoEl) return;
    const onMeta = () => {
      if (videoEl.videoWidth && videoEl.videoHeight) {
        setVideoDims({ w: videoEl.videoWidth, h: videoEl.videoHeight });
      }
    };
    videoEl.addEventListener("loadedmetadata", onMeta);
    if (videoEl.readyState >= 1 && videoEl.videoWidth) onMeta();
    return () => videoEl.removeEventListener("loadedmetadata", onMeta);
  }, [currentIndex]);

  const handleZoomChange = useCallback((zoom: number, pan: { x: number; y: number }) => {
    setCurrentZoom(zoom);
    setCurrentPan(pan);
  }, []);

  const handleTimeChange = useCallback((t: number) => {
    setFreezeTime(t);
    if (clip.spotlightX != null) {
      onUpdateClip(clip.id, { freezeAt: t });
    }
  }, [clip.id, clip.spotlightX, onUpdateClip]);

  const handleConfirmZoom = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container || !videoDims) return;
    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;

    const spot = panToSpotlight(currentPan, {
      containerW,
      containerH,
      videoW: videoDims.w,
      videoH: videoDims.h,
    }, currentZoom);

    onUpdateClip(clip.id, {
      spotlightX: spot.x,
      spotlightY: spot.y,
      markerX: spot.x,
      markerY: spot.y,
      freezeAt: freezeTime,
    });
  }, [clip.id, currentPan, currentZoom, videoDims, freezeTime, onUpdateClip]);

  const handleClear = useCallback(() => {
    onUpdateClip(clip.id, { spotlightX: undefined, spotlightY: undefined, markerX: undefined, markerY: undefined, freezeAt: undefined });
  }, [clip.id, onUpdateClip]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast, onDone]);

  const handleSkip = useCallback(() => {
    onUpdateClip(clip.id, { spotlightX: undefined, spotlightY: undefined, markerX: undefined, markerY: undefined, freezeAt: undefined });
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [clip.id, isLast, onDone, onUpdateClip]);

  const ev = useMemo(() => EVENTS.find((e) => e.id === clip.eventTag), [clip.eventTag]);
  const color = EVENT_TAG_COLORS[clip.eventTag];
  const hasSpotlight = clip.spotlightX != null;
  const canConfirm = currentZoom > 1;

  if (!clip) return null;

  return (
    <div className="flex h-dvh flex-col bg-[#070709]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded-full p-1.5 text-white/40 active:bg-white/8"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-bold text-white">주인공 표시</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ background: "#D4A853", color: "#070709" }}
          >
            클립 {currentIndex + 1}/{clips.length}
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-1.5 pb-3">
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-white/10" />
      </div>

      {/* Clip tag info */}
      <div className="flex items-center justify-center gap-2 pb-3">
        <span className="text-[14px]">{ev?.emoji}</span>
        <span className="text-[13px] font-semibold" style={{ color }}>{ev?.label}</span>
        <span className="text-[11px] text-white/30">
          {fmtSimple(clip.startTime)} → {fmtSimple(clip.endTime)}
        </span>
      </div>

      {/* 영상 + 핀치줌 */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-2" ref={videoContainerRef}>
        <div className="w-full max-w-[430px]">
          <PinchZoomVideo
            videoSrc={videoSrc}
            currentTime={freezeTime}
            onZoomChange={handleZoomChange}
          />
        </div>
      </div>

      {/* 설정 상태 / 안내 */}
      <div className="shrink-0 px-4 pt-2 pb-1">
        {hasSpotlight ? (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.3)" }}
            >
              <span className="text-[11px] font-semibold text-accent">확대 재생 설정됨</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-white/30 underline underline-offset-2"
            >
              초기화
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirmZoom}
            disabled={!canConfirm}
            className="w-full rounded-xl py-2.5 text-[13px] font-bold"
            style={{
              background: canConfirm ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${canConfirm ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)"}`,
              color: canConfirm ? "#D4A853" : "rgba(255,255,255,0.2)",
            }}
          >
            {canConfirm ? "이대로 설정" : "두 손가락으로 확대 후 설정하세요"}
          </button>
        )}
      </div>

      {/* Frame navigator */}
      <div className="shrink-0">
        <FrameNavigator
          currentTime={freezeTime}
          minTime={clip.startTime}
          maxTime={clip.endTime}
          onTimeChange={handleTimeChange}
        />
      </div>

      {/* Action buttons */}
      <div
        className="shrink-0 flex gap-3 px-4 py-3 pb-[env(safe-area-inset-bottom,16px)]"
        style={{ background: "#0f0f11" }}
      >
        <button
          onClick={handleSkip}
          className="flex-1 rounded-xl py-3 text-[14px] font-semibold text-white/50 active:bg-white/8"
          style={{ background: "#24242a", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          건너뛰기
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] rounded-xl py-3 text-[14px] font-bold text-black active:scale-[0.98]"
          style={{ background: "#D4A853" }}
        >
          {isLast ? "완료 ✓" : "다음 클립 →"}
        </button>
      </div>
    </div>
  );
}

function fmtSimple(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
