"use client";

import { useState, useCallback, useEffect } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { EVENTS, EVENT_TAG_COLORS } from "@/components/editor/video/types";
import type { EventTag } from "@/components/editor/video/types";
import PinchZoomVideo from "@/components/editor/video/PinchZoomVideo";
import FrameNavigator from "@/components/editor/video/FrameNavigator";
import EffectsToggle from "@/components/video/EffectsToggle";

interface DecorateViewProps {
  videoSrc: string;
  onNext: () => void;
  onBack: () => void;
}

export default function DecorateView({ videoSrc, onNext, onBack }: DecorateViewProps) {
  const effects = useUploadStore((s) => s.effects);
  const spotlightX = useUploadStore((s) => s.spotlightX);
  const spotlightY = useUploadStore((s) => s.spotlightY);
  const freezeAt = useUploadStore((s) => s.freezeAt);
  const eventTag = useUploadStore((s) => s.eventTag);
  const trimStart = useUploadStore((s) => s.trimStart);
  const trimEnd = useUploadStore((s) => s.trimEnd);
  const duration = useUploadStore((s) => s.duration) ?? 0;

  const effectiveTrimEnd = trimEnd ?? duration;
  const defaultFreeze = trimStart + Math.min(1, (effectiveTrimEnd - trimStart) * 0.3);
  const [freezeTime, setFreezeTime] = useState(freezeAt ?? defaultFreeze);

  useEffect(() => {
    if (freezeAt != null) setFreezeTime(freezeAt);
  }, [freezeAt]);

  const handleTap = useCallback((x: number, y: number) => {
    useUploadStore.getState().setSpotlight(x, y);
    useUploadStore.getState().setFreezeAt(freezeTime);
  }, [freezeTime]);

  const handleMarkerDrag = useCallback((x: number, y: number) => {
    useUploadStore.getState().setSpotlight(x, y);
  }, []);

  const handleMarkerClear = useCallback(() => {
    useUploadStore.getState().setSpotlight(null, null);
    useUploadStore.getState().setFreezeAt(null);
  }, []);

  const handleTimeChange = useCallback((t: number) => {
    setFreezeTime(t);
    if (useUploadStore.getState().spotlightX != null) {
      useUploadStore.getState().setFreezeAt(t);
    }
  }, []);

  const handleEventTag = useCallback((tag: EventTag) => {
    const current = useUploadStore.getState().eventTag;
    useUploadStore.getState().setEventTag(current === tag ? null : tag);
  }, []);

  const hasSpotlight = spotlightX !== null && spotlightY !== null;

  return (
    <div className="flex flex-col bg-[#070709] min-h-dvh">
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
          <span className="text-[15px] font-bold text-white">꾸미기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent/40" />
          <div className="h-1 w-6 rounded-full bg-accent" />
          <div className="h-1 w-6 rounded-full bg-white/10" />
        </div>
      </div>

      {/* 영상 영역 — edge-to-edge (인스타 스타일) */}
      <div className="w-full">
        <PinchZoomVideo
          videoSrc={videoSrc}
          currentTime={freezeTime}
          markerX={spotlightX ?? undefined}
          markerY={spotlightY ?? undefined}
          onTap={handleTap}
          onMarkerDrag={handleMarkerDrag}
          onMarkerClear={handleMarkerClear}
        />
      </div>

      {/* 프레임 네비게이터 + 스포트라이트 뱃지 */}
      <div className="relative">
        <FrameNavigator
          currentTime={freezeTime}
          minTime={trimStart}
          maxTime={effectiveTrimEnd}
          onTimeChange={handleTimeChange}
        />
        {/* 스포트라이트 인라인 뱃지 */}
        {hasSpotlight && (
          <div className="absolute top-1.5 right-3 flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{
                border: "1.5px solid #D4A853",
                background: "radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)",
              }}
            />
            <span className="text-[10px] text-accent font-medium">위치 설정됨</span>
            <button
              type="button"
              onClick={handleMarkerClear}
              className="text-[10px] text-text-3 underline underline-offset-2 active:text-text-1"
            >
              초기화
            </button>
          </div>
        )}
      </div>

      {/* 옵션 영역 (컴팩트) */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 flex flex-col gap-3">
        {/* 이벤트 태그 */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-2 mb-1.5">이 장면은?</h3>
          <div className="flex flex-wrap gap-1.5">
            {EVENTS.map((ev) => {
              const selected = eventTag === ev.id;
              const color = EVENT_TAG_COLORS[ev.id];
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleEventTag(ev.id)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all active:scale-95"
                  style={{
                    background: selected ? color + "20" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.08)"}`,
                    color: selected ? color : "rgba(255,255,255,0.5)",
                  }}
                >
                  <span className="text-[13px]">{ev.emoji}</span>
                  {ev.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 효과 토글 */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-2 mb-1.5">효과</h3>
          <EffectsToggle
            effects={effects}
            onChange={(partial) => useUploadStore.getState().setEffects(partial)}
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#070709]/95 backdrop-blur-sm border-t border-white/[0.06]"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg active:scale-[0.99]"
        >
          다음
        </button>
      </div>
    </div>
  );
}
