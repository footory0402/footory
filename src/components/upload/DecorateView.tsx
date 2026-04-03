"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { EVENTS, EVENT_TAG_COLORS } from "@/components/editor/video/types";
import type { EventTag } from "@/components/editor/video/types";
import PinchZoomVideo from "@/components/editor/video/PinchZoomVideo";
import FrameNavigator from "@/components/editor/video/FrameNavigator";
import EffectsToggle from "@/components/video/EffectsToggle";
import SlowmoTab from "@/components/upload/SlowmoTab";
import CaptionTab from "@/components/upload/CaptionTab";
import { useUploadGuide } from "@/hooks/useUploadGuide";
import CoachMark from "@/components/upload/guide/CoachMark";

type DecorateTab = "position" | "tag" | "slowmo" | "caption" | "effect";

const TABS: { id: DecorateTab; label: string; icon: string }[] = [
  { id: "tag", label: "태그", icon: "🏷" },
  { id: "position", label: "위치", icon: "📍" },
  { id: "effect", label: "효과", icon: "✨" },
  { id: "slowmo", label: "슬로모", icon: "🐢" },
  { id: "caption", label: "텍스트", icon: "💬" },
];

interface DecorateViewProps {
  videoSrc: string;
  onNext: () => void;
  onBack: () => void;
}

export default function DecorateView({ videoSrc, onNext, onBack }: DecorateViewProps) {
  const [activeTab, setActiveTab] = useState<DecorateTab>("tag");
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

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

  // 탭 인디케이터 슬라이딩 애니메이션
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const tabIdx = TABS.findIndex((t) => t.id === activeTab);
    const tabWidth = bar.offsetWidth / TABS.length;
    if (tabIndicatorRef.current) {
      tabIndicatorRef.current.style.transform = `translateX(${tabIdx * tabWidth}px)`;
      tabIndicatorRef.current.style.width = `${tabWidth}px`;
    }
  }, [activeTab]);

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

  const { guideStep, dismissStep, skipAll } = useUploadGuide();
  const hasSpotlight = spotlightX !== null && spotlightY !== null;

  return (
    <div className="flex flex-col bg-[#070709] min-h-dvh">
      {/* Header */}
      <div className="flex shrink-0 items-center px-4 py-3 gap-2">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-white/40 active:bg-white/8"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[15px] font-bold text-white">꾸미기</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent/40" />
          <div className="h-1 w-6 rounded-full bg-accent" />
          <div className="h-1 w-6 rounded-full bg-white/10" />
        </div>
      </div>

      {/* 영상 영역 — 72vh (인스타 릴스 스타일) */}
      <div className="w-full">
        <PinchZoomVideo
          videoSrc={videoSrc}
          currentTime={freezeTime}
          markerX={spotlightX ?? undefined}
          markerY={spotlightY ?? undefined}
          onTap={handleTap}
          onMarkerDrag={handleMarkerDrag}
          onMarkerClear={handleMarkerClear}
          maxHeight="72dvh"
        />
      </div>

      {/* 탭 바 */}
      <div
        ref={tabBarRef}
        className="relative flex shrink-0"
        style={{ background: "#0a0a0c", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* 슬라이딩 골드 인디케이터 */}
        <div
          ref={tabIndicatorRef}
          className="absolute bottom-0 left-0 h-[2px] rounded-full bg-accent transition-transform duration-200"
          style={{ width: `${100 / TABS.length}%` }}
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
            style={{
              color: activeTab === tab.id ? "#D4A853" : "rgba(255,255,255,0.35)",
            }}
          >
            <span className="text-[16px]">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 (PinchZoomVideo 리마운트 방지: display 토글) */}
      <div className="flex-1 overflow-y-auto">
        {/* ── 위치 탭 ── */}
        <div style={{ display: activeTab === "position" ? "block" : "none" }}>
          {hasSpotlight ? (
            <>
              {/* 마커 설정 완료 — 프리즈 타임 조정 */}
              <FrameNavigator
                currentTime={freezeTime}
                minTime={trimStart}
                maxTime={effectiveTrimEnd}
                onTimeChange={handleTimeChange}
                compact
              />
              <div className="px-4 pt-2 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.3)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 20 12">
                      <polygon points="10,12 0,0 20,0" fill="#D4A853" />
                    </svg>
                    <span className="text-[11px] font-semibold text-accent">선수 위치 설정됨</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkerClear}
                    className="text-[11px] text-text-3 underline underline-offset-2 active:text-text-1"
                  >
                    초기화
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-white/30">
                  타임라인을 드래그해 프리즈 구간을 조절하세요
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 pt-4 pb-3">
              {/* 단계 가이드 */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(212,168,83,0.2)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.4)" }}
                  >
                    1
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white/70">두 손가락으로 확대</p>
                    <p className="text-[11px] text-white/30">선수가 잘 보이도록 핀치해서 확대하세요</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(212,168,83,0.12)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.25)" }}
                  >
                    2
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white/70">선수 위치 탭</p>
                    <p className="text-[11px] text-white/30">영상에서 선수를 한 번 탭하면 마커가 생겨요</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 태그 탭 ── */}
        <div style={{ display: activeTab === "tag" ? "block" : "none" }}>
          <div className="px-4 pt-4 pb-6">
            <h3 className="text-[11px] font-semibold text-text-2 mb-3">이 장면은?</h3>
            <div className="grid grid-cols-3 gap-2">
              {EVENTS.map((ev) => {
                const selected = eventTag === ev.id;
                const color = EVENT_TAG_COLORS[ev.id];
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleEventTag(ev.id)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3.5 text-[12px] font-semibold transition-all active:scale-95"
                    style={{
                      background: selected ? color + "22" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.07)"}`,
                      color: selected ? color : "rgba(255,255,255,0.45)",
                    }}
                  >
                    <span className="text-[24px]">{ev.emoji}</span>
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 슬로모 탭 ── */}
        <div style={{ display: activeTab === "slowmo" ? "block" : "none" }}>
          <SlowmoTab />
        </div>

        {/* ── 텍스트 탭 ── */}
        <div style={{ display: activeTab === "caption" ? "block" : "none" }}>
          <CaptionTab />
        </div>

        {/* ── 효과 탭 ── */}
        <div style={{ display: activeTab === "effect" ? "block" : "none" }}>
          <div className="px-4 pt-4 pb-6">
            <h3 className="text-[11px] font-semibold text-text-2 mb-3">영상 효과</h3>
            <EffectsToggle
              effects={effects}
              onChange={(partial) => useUploadStore.getState().setEffects(partial)}
            />
          </div>
        </div>
      </div>

      {/* Coach Mark Guide — 위치 탭에서만 표시 */}
      {activeTab === "position" && guideStep && (
        <CoachMark step={guideStep} onDismiss={dismissStep} onSkipAll={skipAll} />
      )}

      {/* 하단 버튼 */}
      <div
        className="shrink-0 px-4 py-3 bg-[#070709]/95 backdrop-blur-sm border-t border-white/[0.06]"
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
