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
import { panToSpotlight } from "@/lib/spotlight-math";
import { FOCUS_ZOOM_PRESETS, resolveFocusZoom } from "@/lib/focus-zoom";
import { toast } from "@/components/ui/Toast";

type DecorateTab = "position" | "tag" | "caption" | "effect";

const TABS: { id: DecorateTab; label: string; icon: string }[] = [
  { id: "position", label: "선수", icon: "🎯" },
  { id: "tag", label: "태그", icon: "🏷" },
  { id: "effect", label: "효과", icon: "✨" },
  { id: "caption", label: "텍스트", icon: "💬" },
];

interface DecorateViewProps {
  videoSrc: string;
  onNext: () => void;
  onBack: () => void;
}

export default function DecorateView({ videoSrc, onNext, onBack }: DecorateViewProps) {
  const [activeTab, setActiveTab] = useState<DecorateTab>("position");
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const effects = useUploadStore((s) => s.effects);
  const spotlightX = useUploadStore((s) => s.spotlightX);
  const spotlightY = useUploadStore((s) => s.spotlightY);
  const freezeAt = useUploadStore((s) => s.freezeAt);
  const eventTag = useUploadStore((s) => s.eventTag);
  const trimStart = useUploadStore((s) => s.trimStart);
  const trimEnd = useUploadStore((s) => s.trimEnd);
  const duration = useUploadStore((s) => s.duration) ?? 0;
  const slowmoStart = useUploadStore((s) => s.slowmoStart);
  const slowmoEnd = useUploadStore((s) => s.slowmoEnd);

  const effectiveTrimEnd = trimEnd ?? duration;
  const defaultFreeze = trimStart + Math.min(1, (effectiveTrimEnd - trimStart) * 0.3);
  const [freezeTime, setFreezeTime] = useState(freezeAt ?? defaultFreeze);

  // 현재 PinchZoomVideo의 zoom/pan 상태 (설정 저장에 사용)
  const [currentZoom, setCurrentZoom] = useState(1);
  const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });
  // 영상 네이티브 해상도 (비율 계산용)
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (freezeAt == null) return;
    const frame = requestAnimationFrame(() => setFreezeTime(freezeAt));
    return () => cancelAnimationFrame(frame);
  }, [freezeAt]);

  useEffect(() => {
    const store = useUploadStore.getState();
    store.setBgm(null);
    store.setBgmVolume(40);
    store.setOriginalVolume(100);
  }, []);

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
  }, []);

  // "이대로 설정" 버튼: 현재 zoom/pan 중심점을 spotlight 좌표로 변환 후 저장
  const handleConfirmZoom = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const videoEl = container.querySelector("video");
    const resolvedDims =
      videoDims ??
      (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0
        ? { w: videoEl.videoWidth, h: videoEl.videoHeight }
        : {
            w: Math.max(1, container.offsetWidth),
            h: Math.max(1, container.offsetHeight),
          });
    if (!videoDims && videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      setVideoDims(resolvedDims);
    }

    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;

    const spot = panToSpotlight(currentPan, {
      containerW,
      containerH,
      videoW: resolvedDims.w,
      videoH: resolvedDims.h,
    }, currentZoom);

    useUploadStore.getState().setSpotlight(spot.x, spot.y);
    useUploadStore.getState().setFreezeAt(freezeTime);
  }, [currentZoom, currentPan, videoDims, freezeTime]);

  const handleMarkerClear = useCallback(() => {
    useUploadStore.getState().setSpotlight(null, null);
    useUploadStore.getState().setFreezeAt(null);
    useUploadStore.getState().setSlowmo(null, null);
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

  const handleZoomChange = useCallback((zoom: number, pan: { x: number; y: number }) => {
    setCurrentZoom(zoom);
    setCurrentPan(pan);
  }, []);

  const { guideStep, dismissStep, skipAll } = useUploadGuide();

  const handleTapSpotlight = useCallback((spot: { x: number; y: number }) => {
    const store = useUploadStore.getState();
    store.setSpotlight(spot.x, spot.y);
    store.setFreezeAt(freezeTime);
    skipAll();
    toast("선수 지정됨. 재생 시 1.2초만 자동 확대됩니다.", "success");
  }, [freezeTime, skipAll]);

  const handleEnableSlowmoAroundFocus = useCallback(() => {
    const clipWindow = Math.max(0.8, Math.min(1.6, (effectiveTrimEnd - trimStart) * 0.22));
    const rawStart = Math.max(trimStart, freezeTime - clipWindow * 0.4);
    const rawEnd = Math.min(effectiveTrimEnd, freezeTime + clipWindow * 0.6);
    const end = Math.min(effectiveTrimEnd, Math.max(rawStart + 0.5, rawEnd));
    const start = Math.max(trimStart, Math.min(rawStart, end - 0.5));
    useUploadStore.getState().setSlowmo(start, end);
    toast(`슬로모 ${Math.max(0, end - start).toFixed(1)}초 구간 생성됨`, "info");
  }, [effectiveTrimEnd, freezeTime, trimStart]);
  const hasSpotlight = spotlightX !== null && spotlightY !== null;
  const hasSlowmo = slowmoStart !== null && slowmoEnd !== null;
  const selectedFocusZoom = resolveFocusZoom(effects.focusZoom);

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

      {/* 영상 영역 */}
      <div className="w-full" ref={videoContainerRef}>
        <PinchZoomVideo
          videoSrc={videoSrc}
          currentTime={freezeTime}
          onZoomChange={handleZoomChange}
          onTapSpotlight={handleTapSpotlight}
          selectedSpotlight={hasSpotlight ? { x: spotlightX, y: spotlightY } : null}
          maxHeight="72dvh"
          testId="decorate-video"
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
          <div className="px-4 pt-4 pb-3">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[12px] font-semibold text-white/80">선수를 화면에서 바로 찍으세요</p>
              <p className="mt-1 text-[11px] leading-5 text-white/35">
                여기서 주인공 선수를 직접 눌러 지정합니다. 찍어둔 좌표를 기준으로
                재생할 때마다 같은 장면에서 자동 확대가 들어갑니다.
              </p>
            </div>
            <div className="mt-3 grid gap-2">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[12px] font-semibold text-white/72">1. 장면에서 선수를 직접 탭</p>
                <p className="mt-1 text-[11px] leading-5 text-white/32">
                  가장 먼저 보여주고 싶은 선수를 찍으면 바로 기준점이 저장됩니다.
                </p>
              </div>
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[12px] font-semibold text-white/72">2. 필요하면 확대해서 다시 미세 조정</p>
                <p className="mt-1 text-[11px] leading-5 text-white/32">
                  손가락 확대는 선택 사항입니다. 먼 장면만 확대해서 다시 찍으면 더 정확해집니다.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-white/55">자동 확대 정도</p>
                  <p className="mt-1 text-[10px] text-white/28">선수를 찍은 뒤 재생할 때 얼마나 가까이 들어갈지 고릅니다.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-accent">
                  현재 {selectedFocusZoom.toFixed(1)}x
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {FOCUS_ZOOM_PRESETS.map((preset) => {
                  const active = Math.abs(selectedFocusZoom - preset.value) < 0.01;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        useUploadStore.getState().setEffects({ focusZoom: preset.value });
                        toast(`${preset.label}로 자동 확대 설정`, "info");
                      }}
                      className="rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99]"
                      style={{
                        background: active ? "rgba(212,168,83,0.14)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(212,168,83,0.45)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <p className="text-[12px] font-semibold" style={{ color: active ? "#D4A853" : "rgba(255,255,255,0.78)" }}>
                        {preset.label}
                      </p>
                      <p className="mt-1 text-[10px]" style={{ color: active ? "rgba(212,168,83,0.85)" : "rgba(255,255,255,0.32)" }}>
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.3)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 20 12">
                      <polygon points="10,12 0,0 20,0" fill="#D4A853" />
                    </svg>
                    <span className="text-[11px] font-semibold text-accent">선수 지정 완료</span>
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
                  타임라인을 드래그해 언제 이 선수로 확대할지 맞추세요
                </p>
              </div>

              <div className="px-4 pb-6">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold text-white/80">같은 순간에 슬로모도 같이 설정</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/32">
                        선수 찍은 시점을 기준으로 슬로모를 바로 얹을 수 있습니다. 안 쓰면 그대로 두면 됩니다.
                      </p>
                    </div>
                    {!hasSlowmo && (
                      <button
                        type="button"
                        onClick={handleEnableSlowmoAroundFocus}
                        className="shrink-0 rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent active:scale-[0.98]"
                      >
                        이 장면 슬로모
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                    <SlowmoTab embedded />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 pt-1 pb-3">
              {/* 안내 */}
              <div className="mb-4 flex items-start gap-3">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(212,168,83,0.2)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.4)" }}
                >
                  1
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/70">선수를 한 번 눌러 기준 잡기</p>
                  <p className="text-[11px] text-white/30">먼저 선수부터 찍고, 필요하면 확대해서 다시 찍으면 됩니다</p>
                </div>
              </div>
              {currentZoom > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmZoom}
                    className="w-full rounded-xl py-3 text-[14px] font-bold transition-all active:scale-[0.99]"
                    style={{
                      background: "rgba(212,168,83,0.15)",
                      border: "1.5px solid rgba(212,168,83,0.5)",
                      color: "#D4A853",
                    }}
                  >
                    확대한 구도로 다시 찍기
                  </button>
                  <p className="mt-2 text-center text-[11px] text-white/30">
                    기본은 탭 지정이고, 먼 장면만 확대 후 다시 저장하면 더 정확합니다
                  </p>
                </>
              ) : (
                <div
                  className="rounded-2xl px-4 py-3 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[12px] font-semibold text-white/62">영상 위 선수를 바로 눌러주세요</p>
                  <p className="mt-1 text-[11px] text-white/28">저장 버튼 없이 바로 기준점이 잡힙니다</p>
                </div>
              )}
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
