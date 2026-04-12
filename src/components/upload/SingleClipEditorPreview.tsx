"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import IntroCard from "@/components/video/hud/IntroCard";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_FREEZE_HOLD_MS } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { computeVideoRect } from "@/lib/spotlight-math";
import {
  resolveSingleClipFreezePoint,
  type SingleClipEditingDraft,
} from "@/lib/single-clip-playback";
import { resolveUiVideoAspectRatio } from "@/lib/video-layout";
import { INTRO_SEQUENCE_DURATION_MS, shouldPlayIntroBeforeVideo } from "@/lib/intro-playback";

type TimelinePointerEvent = MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>;

interface SingleClipEditorPreviewProps {
  videoSrc: string;
  draft: SingleClipEditingDraft;
  playerData: HudPlayerData | null;
  previewTime: number;
  spotlightPicking: boolean;
  draggingTrimHandle?: "start" | "end" | null;
  onFocusTargetReady?: (element: HTMLDivElement | null) => void;
  onTimelineReady?: (element: HTMLDivElement | null) => void;
  onPreviewTimeChange: (time: number) => void;
  onSpotlightChange: (spotlight: { x: number; y: number } | null) => void;
  onZoomChange: (zoom: number) => void;
  onTrimHandlePress: (event: TimelinePointerEvent, handle: "start" | "end") => void;
  onSpotlightPickingChange: (next: boolean) => void;
  onClearSpotlight: () => void;
  onProfileCardToggle: (checked: boolean) => void;
  onLowerThirdToggle: (checked: boolean) => void;
}

export function resolvePreviewPlaybackStartTime({
  currentTime,
  trimStart,
  trimEnd,
  restartFromTrimStart,
}: {
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  restartFromTrimStart: boolean;
}) {
  if (restartFromTrimStart) return trimStart;
  if (currentTime < trimStart || currentTime >= trimEnd) return trimStart;
  return currentTime;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}


function OverlayPreviewGuide({
  playerData,
  showLowerThird,
  showProfileCard,
}: {
  playerData: HudPlayerData | null;
  showLowerThird: boolean;
  showProfileCard: boolean;
}) {
  return (
    <>
      {showProfileCard ? (
        <div className="pointer-events-none absolute left-[6%] top-[8%] z-20 rounded-full border border-white/12 bg-black/55 px-3 py-1 text-[10px] font-semibold text-white/72 backdrop-blur-sm">
          카드
        </div>
      ) : null}

      {showLowerThird && playerData ? (
        <div className="pointer-events-none absolute inset-x-[6%] bottom-[12%] z-20 rounded-[20px] border border-dashed border-white/18 bg-black/25 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#d8b36a] px-2 py-1 text-[10px] font-bold text-[#09090b]">
              {playerData.position || "선수"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">
                {playerData.name || "선수 정보"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function SingleClipEditorPreview({
  videoSrc,
  draft,
  playerData,
  previewTime,
  spotlightPicking,
  draggingTrimHandle = null,
  onFocusTargetReady,
  onTimelineReady,
  onPreviewTimeChange,
  onSpotlightChange,
  onZoomChange,
  onTrimHandlePress,
  onSpotlightPickingChange,
  onClearSpotlight,
  onProfileCardToggle,
  onLowerThirdToggle,
}: SingleClipEditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const lastPinchZoomRef = useRef(draft.playback.zoom);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introPlayedRef = useRef(false);
  const restartFromTrimStartRef = useRef(false);
  const freezeTriggeredRef = useRef(false);
  const freezeHoldingRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchHandledRef = useRef(false);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const [crosshairVideoPos, setCrosshairVideoPos] = useState<{ x: number; y: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const spotlight = draft.playback.spotlight;
  const { freezeAtSec } = useMemo(
    () =>
      resolveSingleClipFreezePoint(
        {
          duration: draft.sourceDurationSec,
          trimStart: draft.playback.trimStart,
          trimEnd: draft.playback.trimEnd,
          freezeAt: spotlight ? draft.playback.freezeAt : null,
        },
        draft.sourceDurationSec,
      ),
    [
      draft.playback.freezeAt,
      draft.playback.trimEnd,
      draft.playback.trimStart,
      draft.sourceDurationSec,
      spotlight,
    ],
  );
  const freezeActive = freezeAtSec != null && Math.abs(freezeAtSec - previewTime) <= 0.35;
  const shouldGateIntroPlayback = shouldPlayIntroBeforeVideo({
    introEnabled: draft.overlay.showProfileCard && !!playerData,
    currentTimeSec: previewTime,
    trimStartSec: draft.playback.trimStart,
  });

  const { adjustedSpotlight, pan, resetTransform, syncZoomTo, zoom } = useSpotlightZoom({
    videoRef,
    videoNativeSize,
    spotlight,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoNativeSize({ w: video.videoWidth || 1, h: video.videoHeight || 1 });
      if (Math.abs(video.currentTime - draft.playback.trimStart) > 0.1) {
        video.currentTime = draft.playback.trimStart;
      }
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      if (currentTime >= draft.playback.trimEnd) {
        video.currentTime = draft.playback.trimEnd;
        video.pause();
        setEnded(true);
        onPreviewTimeChange(draft.playback.trimEnd);
        return;
      }

      setEnded(false);
      onPreviewTimeChange(currentTime);

      if (
        freezeAtSec != null &&
        spotlight &&
        !freezeTriggeredRef.current &&
        !freezeHoldingRef.current &&
        !video.paused &&
        currentTime >= freezeAtSec
      ) {
        freezeTriggeredRef.current = true;
        freezeHoldingRef.current = true;
        video.pause();
        setIsFreezing(true);
        onPreviewTimeChange(freezeAtSec);
        freezeTimerRef.current = setTimeout(() => {
          freezeTimerRef.current = null;
          freezeHoldingRef.current = false;
          setIsFreezing(false);
          video.play().catch(() => {});
        }, DEFAULT_FREEZE_HOLD_MS);
      }
    };

    const handlePlay = () => {
      setEnded(false);
      setIsPlaying(true);
    };
    const handlePause = () => {
      if (!freezeHoldingRef.current) {
        setIsPlaying(false);
      }
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleReady = () => setIsBuffering(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleReady);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleReady);
    };
  }, [
    draft.playback.trimEnd,
    draft.playback.trimStart,
    freezeAtSec,
    onPreviewTimeChange,
    spotlight,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || Math.abs(video.currentTime - previewTime) <= 0.05) return;
    video.currentTime = previewTime;
  }, [previewTime]);

  useEffect(() => {
    if (freezeAtSec == null) {
      freezeTriggeredRef.current = false;
      freezeHoldingRef.current = false;
      setIsFreezing(false);
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = null;
      }
      return;
    }

    if (previewTime < freezeAtSec - 0.1) {
      freezeTriggeredRef.current = false;
      freezeHoldingRef.current = false;
      setIsFreezing(false);
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = null;
      }
    }
  }, [freezeAtSec, previewTime]);

  useEffect(() => {
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }

    if (!draft.overlay.showProfileCard || !playerData) {
      introPlayedRef.current = true;
      setShowIntro(false);
      return;
    }

    if (shouldGateIntroPlayback && !isPlaying) {
      introPlayedRef.current = false;
      setShowIntro(false);
      return;
    }

    introPlayedRef.current = true;
    setShowIntro(false);
  }, [
    draft.overlay.showProfileCard,
    draft.playback.trimStart,
    isPlaying,
    playerData,
    shouldGateIntroPlayback,
    videoSrc,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (
      video.currentTime < draft.playback.trimStart ||
      video.currentTime > draft.playback.trimEnd
    ) {
      video.currentTime = draft.playback.trimStart;
      onPreviewTimeChange(draft.playback.trimStart);
    }
  }, [draft.playback.trimEnd, draft.playback.trimStart, onPreviewTimeChange]);

  useEffect(() => {
    if (spotlight) {
      syncZoomTo(spotlight.x, spotlight.y, draft.playback.zoom);
      return;
    }

    resetTransform();
  }, [draft.playback.zoom, resetTransform, spotlight, syncZoomTo]);

  useEffect(() => {
    onFocusTargetReady?.(videoNativeSize ? containerRef.current : null);
    return () => onFocusTargetReady?.(null);
  }, [onFocusTargetReady, videoNativeSize]);

  // 선수 선택 모드 진입 시 영상 정지
  useEffect(() => {
    if (!spotlightPicking) {
      setCrosshairVideoPos(null);
      return;
    }
    const video = videoRef.current;
    if (video && !video.paused) video.pause();
    // 기존 spotlight 위치 또는 화면 중앙으로 초기화
    setCrosshairVideoPos(spotlight ?? { x: 0.5, y: 0.38 });
  }, [spotlightPicking, spotlight]);

  useEffect(() => {
    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
      }
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || showIntro) return;

    if (ended) {
      video.currentTime = draft.playback.trimStart;
      setEnded(false);
      introPlayedRef.current = false;
    }

    if (video.paused) {
      const nextStartTime = resolvePreviewPlaybackStartTime({
        currentTime: video.currentTime,
        trimStart: draft.playback.trimStart,
        trimEnd: draft.playback.trimEnd,
        restartFromTrimStart: restartFromTrimStartRef.current,
      });
      const isRestartingFromBeginning = Math.abs(nextStartTime - draft.playback.trimStart) <= 0.05;
      restartFromTrimStartRef.current = false;
      if (isRestartingFromBeginning) {
        introPlayedRef.current = false;
        freezeTriggeredRef.current = false;
        freezeHoldingRef.current = false;
        setIsFreezing(false);
        if (freezeTimerRef.current) {
          clearTimeout(freezeTimerRef.current);
          freezeTimerRef.current = null;
        }
      }
      if (Math.abs(video.currentTime - nextStartTime) > 0.05) {
        video.currentTime = nextStartTime;
        onPreviewTimeChange(nextStartTime);
      }
      if (
        !introPlayedRef.current &&
        shouldPlayIntroBeforeVideo({
          introEnabled: draft.overlay.showProfileCard && !!playerData,
          currentTimeSec: video.currentTime,
          trimStartSec: draft.playback.trimStart,
        })
      ) {
        setShowIntro(true);
        introTimerRef.current = setTimeout(() => {
          introTimerRef.current = null;
          introPlayedRef.current = true;
          setShowIntro(false);
          video.play().catch(() => {});
        }, INTRO_SEQUENCE_DURATION_MS);
        return;
      }
      video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [
    draft.overlay.showProfileCard,
    draft.playback.trimEnd,
    draft.playback.trimStart,
    ended,
    onPreviewTimeChange,
    playerData,
    showIntro,
  ]);

  // 선수 포커스 탭 위치 계산 헬퍼
  const getVideoPos = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || !videoNativeSize) return null;
      const rect = container.getBoundingClientRect();
      const { displayW, displayH, offsetX, offsetY } = computeVideoRect({
        containerW: container.clientWidth,
        containerH: container.clientHeight,
        videoW: videoNativeSize.w,
        videoH: videoNativeSize.h,
      });
      return {
        x: Math.max(0.02, Math.min(0.98, (clientX - rect.left - offsetX) / displayW)),
        y: Math.max(0.02, Math.min(0.98, (clientY - rect.top - offsetY) / displayH)),
      };
    },
    [videoNativeSize],
  );

  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // touch tap 처리 후 발생하는 synthetic click 무시
      if (touchHandledRef.current) return;
      // 스포트라이트 모드일 때만 클릭 처리 — 영상 영역 클릭으로 재생/중지 불가
      if (!spotlightPicking) return;
      const pos = getVideoPos(event.clientX, event.clientY);
      if (pos) {
        restartFromTrimStartRef.current = true;
        onSpotlightChange(pos);
      }
    },
    [spotlightPicking, getVideoPos, onSpotlightChange],
  );

  const handleVideoPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!spotlightPicking) return;
      const pos = getVideoPos(event.clientX, event.clientY);
      if (pos) setCrosshairVideoPos(pos);
    },
    [spotlightPicking, getVideoPos],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (spotlightPicking) {
        touchStartPosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        const pos = getVideoPos(event.touches[0].clientX, event.touches[0].clientY);
        if (pos) setCrosshairVideoPos(pos);
        return;
      }
      if (!spotlight || event.touches.length !== 2) {
        pinchStateRef.current = null;
        return;
      }
      const [first, second] = [event.touches[0], event.touches[1]];
      pinchStateRef.current = {
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        zoom: draft.playback.zoom,
      };
      lastPinchZoomRef.current = draft.playback.zoom;
    },
    [draft.playback.zoom, getVideoPos, spotlight, spotlightPicking],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (spotlightPicking) {
        const touch = event.touches[0];
        const pos = getVideoPos(touch.clientX, touch.clientY);
        if (pos) setCrosshairVideoPos(pos);
        return;
      }
      const pinchState = pinchStateRef.current;
      if (!pinchState || event.touches.length !== 2) return;
      event.preventDefault();
      const [first, second] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
      const ratio = pinchState.distance > 0 ? distance / pinchState.distance : 1;
      const nextZoom = Number(Math.min(3.2, Math.max(1, pinchState.zoom * ratio)).toFixed(1));
      if (Math.abs(nextZoom - lastPinchZoomRef.current) < 0.1) return;
      lastPinchZoomRef.current = nextZoom;
      onZoomChange(nextZoom);
    },
    [getVideoPos, onZoomChange, spotlightPicking],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (spotlightPicking) {
        const touch = event.changedTouches[0];
        const start = touchStartPosRef.current;
        // 이동이 거의 없으면 탭으로 처리 → spotlight 확정
        if (start && Math.abs(touch.clientX - start.x) < 12 && Math.abs(touch.clientY - start.y) < 12) {
          // synthetic click 이벤트가 추가로 발생하지 않도록 방지
          event.preventDefault();
          touchHandledRef.current = true;
          setTimeout(() => { touchHandledRef.current = false; }, 400);
          const pos = getVideoPos(touch.clientX, touch.clientY);
          if (pos) {
            restartFromTrimStartRef.current = true;
            onSpotlightChange(pos);
          }
        }
        touchStartPosRef.current = null;
        return;
      }
      pinchStateRef.current = null;
    },
    [getVideoPos, onSpotlightChange, spotlightPicking],
  );

  // 시크바 seek 핸들러
  const getSeekBarTime = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      if (!bar) return previewTime;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Number((ratio * draft.sourceDurationSec).toFixed(2));
    },
    [draft.sourceDurationSec, previewTime],
  );

  const handleSeekBarPress = useCallback(
    (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      event.stopPropagation();
      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      onPreviewTimeChange(getSeekBarTime(clientX));

      const onMove = (moveEvent: globalThis.MouseEvent | globalThis.TouchEvent) => {
        const moveX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        onPreviewTimeChange(getSeekBarTime(moveX));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove as EventListener);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onMove as EventListener);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("mousemove", onMove as EventListener);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove as EventListener, { passive: true });
      document.addEventListener("touchend", onUp);
    },
    [getSeekBarTime, onPreviewTimeChange],
  );

  const seekMin = draft.playback.trimStart;
  const seekMax = draft.playback.trimEnd;
  const seekValue = Math.min(Math.max(previewTime, seekMin), seekMax);
  const videoTransform = zoom > 1 ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` : undefined;
  const previewAspectRatio = resolveUiVideoAspectRatio(videoNativeSize);
  const timelineDuration = Math.max(draft.sourceDurationSec, 0.1);
  const trimStartPercent = (draft.playback.trimStart / timelineDuration) * 100;
  const trimEndPercent = (draft.playback.trimEnd / timelineDuration) * 100;
  const seekPercent = (seekValue / timelineDuration) * 100;
  const fullSeekPercent = (seekValue / timelineDuration) * 100;
  const freezePercent = draft.playback.freezeAt != null
    ? (draft.playback.freezeAt / timelineDuration) * 100
    : null;

  // 선수 포커스 crosshair 화면 좌표
  const crosshairScreenPos = useMemo(() => {
    const container = containerRef.current;
    if (!crosshairVideoPos || !container || !videoNativeSize) return null;
    const containerW = container.clientWidth || 390;
    const containerH = container.clientHeight || 600;
    const { displayW, displayH, offsetX, offsetY } = computeVideoRect({
      containerW,
      containerH,
      videoW: videoNativeSize.w,
      videoH: videoNativeSize.h,
    });
    return {
      left: offsetX + crosshairVideoPos.x * displayW,
      top: offsetY + crosshairVideoPos.y * displayH,
    };
  }, [crosshairVideoPos, videoNativeSize]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0f]">
      {/* ─── 영상 영역 ────────────────────────────────────────── */}
      <div
        ref={(element) => {
          containerRef.current = element;
        }}
        data-testid="single-clip-focus-target"
        className="relative w-full overflow-hidden bg-black"
        style={{
          aspectRatio: String(previewAspectRatio),
          maxHeight: "62dvh",
          minHeight: "220px",
          touchAction: spotlightPicking ? "none" : spotlight ? "none" : "manipulation",
          cursor: spotlightPicking ? "crosshair" : "default",
        }}
        onClick={handleVideoClick}
        onPointerMove={handleVideoPointerMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "contain",
            transform: videoTransform,
            transformOrigin: "center center",
            opacity: showIntro ? 0.08 : 1,
            pointerEvents: "none",
            transition: "opacity 0.2s ease",
          }}
        />

        {showIntro && playerData ? (
          <div className="pointer-events-none absolute inset-0 z-[18]">
            <IntroCard data={playerData} animate />
          </div>
        ) : null}

        {playerData?.name && adjustedSpotlight ? (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              transform: videoTransform,
              transformOrigin: "center center",
            }}
          >
            <VideoOverlay
              spotlight={adjustedSpotlight}
              player={{
                name: playerData.name,
                position: playerData.position,
              }}
              freezeMode={freezeActive || isFreezing}
              zoomLevel={zoom}
              showWhileZoom
              highlightStyle="soft_ring"
            />
          </div>
        ) : null}

        {/* 선수 선택 모드 오버레이 */}
        {spotlightPicking ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-20 bg-black/30" />
            <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center">
              <div className="rounded-2xl border border-white/15 bg-black/65 px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[13px] font-bold text-white">강조할 선수를 탭해요</p>
                <p className="mt-0.5 text-[11px] text-white/55">손가락으로 선수 위를 터치</p>
              </div>
            </div>
            {crosshairScreenPos ? (
              <div
                className="pointer-events-none absolute z-30"
                style={{
                  left: crosshairScreenPos.left - 40,
                  top: crosshairScreenPos.top - 40,
                  width: 80,
                  height: 80,
                }}
              >
                {/* 외부 링 */}
                <div className="absolute inset-0 rounded-full border-2 border-[#d8b36a]/80" />
                {/* 내부 채움 */}
                <div className="absolute inset-[34px] rounded-full bg-[#d8b36a]" />
                {/* 십자선 */}
                <div className="absolute left-1/2 top-2 h-5 w-px -translate-x-1/2 bg-[#d8b36a]/60" />
                <div className="absolute bottom-2 left-1/2 h-5 w-px -translate-x-1/2 bg-[#d8b36a]/60" />
                <div className="absolute left-2 top-1/2 h-px w-5 -translate-y-1/2 bg-[#d8b36a]/60" />
                <div className="absolute right-2 top-1/2 h-px w-5 -translate-y-1/2 bg-[#d8b36a]/60" />
              </div>
            ) : null}
          </>
        ) : null}

        {/* 선수 선택됨 배지 */}
        {!spotlightPicking && spotlight ? (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
              주인공 선택됨
            </span>
            {freezeAtSec != null ? (
              <span className="rounded-full border border-[#d8b36a]/30 bg-[#d8b36a]/12 px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a] backdrop-blur-sm">
                {formatTime(freezeAtSec)}
              </span>
            ) : null}
          </div>
        ) : null}

        {draft.overlay.showProfileCard || draft.overlay.showLowerThird ? (
          <OverlayPreviewGuide
            playerData={playerData}
            showLowerThird={draft.overlay.showLowerThird}
            showProfileCard={draft.overlay.showProfileCard}
          />
        ) : null}

        {isBuffering && isPlaying ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/15 border-t-white/80" />
          </div>
        ) : null}


        {/* ── 하단 오버레이: 시크바 ──────────────────────────── */}
        {videoNativeSize && !spotlightPicking ? (
          <div
            className="absolute inset-x-0 bottom-0 z-25 px-3 pb-2.5 pt-8"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)" }}
          >
            <div className="mb-1 flex justify-between px-0.5 text-[10px] tabular-nums text-white/55">
              <span>{formatTime(seekValue)}</span>
              <span>{formatTime(draft.sourceDurationSec)}</span>
            </div>
            <div
              ref={seekBarRef}
              className="relative h-1 cursor-pointer"
              onMouseDown={handleSeekBarPress}
              onTouchStart={handleSeekBarPress}
            >
              {/* 배경 트랙 */}
              <div className="absolute inset-0 rounded-full bg-white/20" />
              {/* 선택 구간 */}
              <div
                className="absolute inset-y-0 rounded-full bg-[#d8b36a]/50"
                style={{
                  left: `${trimStartPercent}%`,
                  width: `${trimEndPercent - trimStartPercent}%`,
                }}
              />
              {/* 재생 진행 */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/75"
                style={{ width: `${fullSeekPercent}%` }}
              />
              {/* 프리즈 마커 (별 + 선) */}
              {freezePercent != null && spotlight ? (
                <div
                  className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${freezePercent}%` }}
                >
                  <svg
                    className="absolute"
                    style={{ bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", filter: "drop-shadow(0 0 4px rgba(246,214,154,0.9))" }}
                    width="9" height="9" viewBox="0 0 24 24" fill="#f6d69a"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                  <div className="h-3 w-px rounded-full bg-[#f6d69a]" style={{ boxShadow: "0 0 3px rgba(246,214,154,0.7)" }} />
                </div>
              ) : null}
              {/* 플레이헤드 */}
              <div
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ left: `${seekPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── 재생 컨트롤 ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-white/[0.04] bg-[#0b0b0f] px-4 py-2.5">
        <button
          type="button"
          data-testid="single-clip-play-toggle"
          aria-label={ended ? "처음부터 다시 보기" : isPlaying ? "일시정지" : "재생"}
          onClick={togglePlayback}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8b36a] text-[#09090b] shadow-[0_0_14px_rgba(216,179,106,0.35)]"
        >
          {ended ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          ) : isPlaying ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1 text-[12px] tabular-nums text-white/55">
          {isPlaying ? "재생 중" : ended ? "재생 완료" : "일시정지"}
          {spotlight && draft.playback.freezeAt != null ? (
            <span
              data-testid="single-clip-freeze-value"
              className="ml-2 text-[#f6d69a]/70"
            >
              · {formatTime(draft.playback.freezeAt)}에 강조
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-[12px] font-semibold tabular-nums text-white/70">
          {formatTime(seekValue)}
          <span className="ml-1 text-white/30">/ {formatTime(seekMax)}</span>
        </div>
      </div>

      {/* ── 섹션: 선수 설정 ──────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#0b0b0f] px-3 pt-3.5 pb-3">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
          선수 설정
        </p>
        <div className="flex items-center gap-2">
          {!spotlight ? (
            <button
              type="button"
              data-testid="single-clip-pick-toggle"
              aria-label="선수 선택하기"
              onClick={() => onSpotlightPickingChange(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-white/70 transition-colors active:bg-white/10"
            >
              <span>🎯</span>
              <span>선수 선택</span>
            </button>
          ) : (
            <>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  data-testid="single-clip-pick-toggle"
                  aria-label="선수 다시 선택"
                  onClick={() => onSpotlightPickingChange(true)}
                  className="rounded-full border border-[#d8b36a]/40 bg-[#d8b36a]/10 px-3 py-2 text-[11px] font-semibold text-[#f6d69a] transition-colors active:bg-[#d8b36a]/20"
                >
                  🎯 다시
                </button>
                <button
                  type="button"
                  aria-label="선수 선택 지우기"
                  onClick={onClearSpotlight}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/55 transition-colors active:bg-white/10"
                >
                  ✕ 제거
                </button>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                <input
                  type="range"
                  min="1"
                  max="3.2"
                  step="0.1"
                  value={draft.playback.zoom}
                  onChange={(e) => onZoomChange(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: "#d8b36a" }}
                />
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-[#f6d69a]">
                  {draft.playback.zoom.toFixed(1)}×
                </span>
              </div>
            </>
          )}
        </div>
        {spotlight && freezeAtSec != null ? (
          <p className="mt-2 text-[10px] text-[#f6d69a]/60 tabular-nums">
            · {formatTime(freezeAtSec)}에 강조 프레임
          </p>
        ) : null}
      </div>

      {/* ── 섹션 1: 구간 설정 (trim-only) ────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#0b0b0f] px-3 pt-3.5 pb-3">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
          구간 설정
        </p>

        {/* 트림 타임라인 */}
        <div
          ref={onTimelineReady}
          data-testid="single-clip-edit-timeline"
          className="relative h-12 overflow-visible rounded-2xl bg-white/[0.05]"
        >
          {/* 비선택 영역 어둡게 */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-2xl bg-black/30"
            style={{ width: `${trimStartPercent}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 rounded-r-2xl bg-black/30"
            style={{ width: `${100 - trimEndPercent}%` }}
          />

          {/* 선택 구간 테두리 */}
          <div
            className="absolute inset-y-0 border-y-2 border-[#d8b36a]/60"
            style={{
              left: `${trimStartPercent}%`,
              width: `${trimEndPercent - trimStartPercent}%`,
            }}
          />

          {/* 프리즈 마커 (별 + 선) */}
          {freezePercent != null && spotlight ? (
            <div
              data-testid="single-clip-freeze-marker"
              className="absolute inset-y-2 z-20 -translate-x-1/2"
              style={{ left: `${freezePercent}%` }}
            >
              <div className="h-full w-px rounded-full bg-[#f6d69a]/80" style={{ boxShadow: "0 0 4px rgba(246,214,154,0.5)" }} />
              <svg
                className="absolute"
                style={{ bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", filter: "drop-shadow(0 0 5px rgba(246,214,154,1))" }}
                width="11" height="11" viewBox="0 0 24 24" fill="#f6d69a"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>
          ) : null}

          {/* 현재 위치 마커 */}
          <div
            className="pointer-events-none absolute inset-y-1.5 z-20 w-px -translate-x-1/2 rounded-full bg-white/60"
            style={{ left: `${(seekValue / timelineDuration) * 100}%` }}
          />

          {/* 트림 시작 핸들 */}
          <div
            data-testid="single-clip-trim-start-handle"
            data-timeline-handle="true"
            className="absolute inset-y-0 z-30 flex items-center"
            style={{ left: `calc(${trimStartPercent}% - 20px)`, width: 40 }}
            onMouseDown={(event) => {
              event.stopPropagation();
              onTrimHandlePress(event, "start");
            }}
            onTouchStart={(event) => {
              event.stopPropagation();
              onTrimHandlePress(event, "start");
            }}
          >
            <div
              className={`mx-auto flex h-10 w-6 items-center justify-center rounded-lg ${
                draggingTrimHandle === "start" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/85"
              }`}
            >
              <div className="flex gap-0.5">
                <div className="h-3.5 w-px rounded-full bg-[#09090b]" />
                <div className="h-3.5 w-px rounded-full bg-[#09090b]" />
              </div>
            </div>
          </div>

          {/* 트림 끝 핸들 */}
          <div
            data-testid="single-clip-trim-end-handle"
            data-timeline-handle="true"
            className="absolute inset-y-0 z-30 flex items-center"
            style={{ left: `calc(${trimEndPercent}% - 20px)`, width: 40 }}
            onMouseDown={(event) => {
              event.stopPropagation();
              onTrimHandlePress(event, "end");
            }}
            onTouchStart={(event) => {
              event.stopPropagation();
              onTrimHandlePress(event, "end");
            }}
          >
            <div
              className={`mx-auto flex h-10 w-6 items-center justify-center rounded-lg ${
                draggingTrimHandle === "end" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/85"
              }`}
            >
              <div className="flex gap-0.5">
                <div className="h-3.5 w-px rounded-full bg-[#09090b]" />
                <div className="h-3.5 w-px rounded-full bg-[#09090b]" />
              </div>
            </div>
          </div>
        </div>

        {/* 구간 정보 */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
          <span className="tabular-nums">{formatTime(draft.playback.trimStart)}</span>
          <span className="font-semibold text-white/50 tabular-nums">
            {Math.round((draft.playback.trimEnd - draft.playback.trimStart) * 10) / 10}초 선택
          </span>
          <span className="tabular-nums">{formatTime(draft.playback.trimEnd)}</span>
        </div>
      </div>

      {/* ── 섹션 2: 화면 정보 ────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#0b0b0f] px-3 pt-3.5 pb-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
          화면 정보
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="single-clip-profile-card-toggle"
            aria-pressed={draft.overlay.showProfileCard}
            onClick={() => onProfileCardToggle(!draft.overlay.showProfileCard)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center transition-colors ${
              draft.overlay.showProfileCard
                ? "border-[#d8b36a]/40 bg-[#d8b36a]/12 text-[#f6d69a]"
                : "border-white/[0.08] bg-white/[0.04] text-white/55"
            }`}
          >
            <span className="text-[18px]">🪪</span>
            <span className="text-[11px] font-semibold">시작 카드</span>
            <span className="text-[10px] opacity-55">재생 전 선수 소개</span>
          </button>
          <button
            type="button"
            data-testid="single-clip-lower-third-toggle"
            aria-pressed={draft.overlay.showLowerThird}
            onClick={() => onLowerThirdToggle(!draft.overlay.showLowerThird)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center transition-colors ${
              draft.overlay.showLowerThird
                ? "border-[#d8b36a]/40 bg-[#d8b36a]/12 text-[#f6d69a]"
                : "border-white/[0.08] bg-white/[0.04] text-white/55"
            }`}
          >
            <span className="text-[18px]">📝</span>
            <span className="text-[11px] font-semibold">하단 자막</span>
            <span className="text-[10px] opacity-55">이름 · 포지션 표시</span>
          </button>
        </div>
      </div>
    </div>
  );
}
