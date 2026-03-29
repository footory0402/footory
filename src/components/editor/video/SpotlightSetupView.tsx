"use client";

import { useState, useCallback, useMemo } from "react";
import type { ClipSegment } from "./types";
import { EVENT_TAG_COLORS, EVENTS } from "./types";
import PinchZoomVideo from "./PinchZoomVideo";
import FrameNavigator from "./FrameNavigator";

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

  // Current freeze time for this clip (default to markedAt or clip midpoint)
  const defaultFreezeAt = clip.freezeAt ?? clip.markedAt ?? (clip.startTime + clip.endTime) / 2;
  const [freezeTime, setFreezeTime] = useState(defaultFreezeAt);

  // Sync freezeTime when clip changes
  const currentClipId = clip?.id;
  const [lastClipId, setLastClipId] = useState(currentClipId);
  if (currentClipId !== lastClipId) {
    setLastClipId(currentClipId);
    const nextClip = clips[currentIndex];
    setFreezeTime(nextClip.freezeAt ?? nextClip.markedAt ?? (nextClip.startTime + nextClip.endTime) / 2);
  }

  const handleTap = useCallback((x: number, y: number) => {
    onUpdateClip(clip.id, { markerX: x, markerY: y, freezeAt: freezeTime });
  }, [clip.id, freezeTime, onUpdateClip]);

  const handleMarkerDrag = useCallback((x: number, y: number) => {
    onUpdateClip(clip.id, { markerX: x, markerY: y });
  }, [clip.id, onUpdateClip]);

  const handleMarkerClear = useCallback(() => {
    onUpdateClip(clip.id, { markerX: undefined, markerY: undefined, freezeAt: undefined });
  }, [clip.id, onUpdateClip]);

  const handleTimeChange = useCallback((t: number) => {
    setFreezeTime(t);
    // If marker already set, update freezeAt too
    if (clip.markerX != null) {
      onUpdateClip(clip.id, { freezeAt: t });
    }
  }, [clip.id, clip.markerX, onUpdateClip]);

  const handleNext = useCallback(() => {
    // Save freezeAt if marker is set
    if (clip.markerX != null) {
      onUpdateClip(clip.id, { freezeAt: freezeTime });
    }
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [clip.id, clip.markerX, freezeTime, isLast, onDone, onUpdateClip]);

  const handleSkip = useCallback(() => {
    // Clear marker data for this clip
    onUpdateClip(clip.id, { markerX: undefined, markerY: undefined, freezeAt: undefined });
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [clip.id, isLast, onDone, onUpdateClip]);

  const ev = useMemo(() => EVENTS.find((e) => e.id === clip.eventTag), [clip.eventTag]);
  const color = EVENT_TAG_COLORS[clip.eventTag];

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

      {/* Video with pinch zoom + marker */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-2">
        <div className="w-full max-w-[430px]">
          <PinchZoomVideo
            videoSrc={videoSrc}
            currentTime={freezeTime}
            markerX={clip.markerX}
            markerY={clip.markerY}
            onTap={handleTap}
            onMarkerDrag={handleMarkerDrag}
            onMarkerClear={handleMarkerClear}
          />
        </div>
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
