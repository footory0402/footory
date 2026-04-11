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
import { DEFAULT_FREEZE_HOLD_MS, FOCUS_ZOOM_PRESETS } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { screenToVideo } from "@/lib/spotlight-math";
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
  onTimelinePress: (event: TimelinePointerEvent) => void;
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

function MiniToggleChip({
  label,
  active,
  onClick,
  testId,
  ariaLabel,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "border-[#d8b36a]/40 bg-[#d8b36a]/14 text-[#f6d69a]"
          : "border-white/[0.08] bg-white/[0.04] text-white/70"
      }`}
    >
      {label}
    </button>
  );
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
        <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-20 rounded-[20px] border border-dashed border-white/18 bg-black/25 px-3 py-2 backdrop-blur-sm">
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
  onTimelinePress,
  onTrimHandlePress,
  onSpotlightPickingChange,
  onClearSpotlight,
  onProfileCardToggle,
  onLowerThirdToggle,
}: SingleClipEditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const lastPinchZoomRef = useRef(draft.playback.zoom);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introPlayedRef = useRef(false);
  const restartFromTrimStartRef = useRef(false);
  const freezeTriggeredRef = useRef(false);
  const freezeHoldingRef = useRef(false);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
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

  useEffect(() => {
    if (!spotlightPicking) return;
    const video = videoRef.current;
    if (!video || video.paused) return;
    video.pause();
  }, [spotlightPicking]);

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

  const handleTap = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!spotlightPicking) {
        togglePlayback();
        return;
      }

      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video || !videoNativeSize) return;

      const spot = screenToVideo(
        event.clientX,
        event.clientY,
        container.getBoundingClientRect(),
        {
          containerW: container.clientWidth,
          containerH: container.clientHeight,
          videoW: videoNativeSize.w,
          videoH: videoNativeSize.h,
        },
        zoom,
        pan
      );

      if (!spot) return;
      video.pause();
      onPreviewTimeChange(video.currentTime);
      restartFromTrimStartRef.current = true;
      onSpotlightChange(spot);
    },
    [
      onPreviewTimeChange,
      onSpotlightChange,
      pan,
      spotlightPicking,
      togglePlayback,
      videoNativeSize,
      zoom,
    ]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
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
    [draft.playback.zoom, spotlight]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
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
    [onZoomChange]
  );

  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

  const seekMin = draft.playback.trimStart;
  const seekMax = draft.playback.trimEnd;
  const seekValue = Math.min(Math.max(previewTime, seekMin), seekMax);
  const videoTransform = zoom > 1 ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` : undefined;
  const previewAspectRatio = resolveUiVideoAspectRatio(videoNativeSize);
  const timelineDuration = Math.max(draft.sourceDurationSec, 0.1);
  const trimStartPercent = (draft.playback.trimStart / timelineDuration) * 100;
  const trimEndPercent = (draft.playback.trimEnd / timelineDuration) * 100;
  const playheadPercent = (seekValue / timelineDuration) * 100;
  const freezePercent = draft.playback.freezeAt != null
    ? (draft.playback.freezeAt / timelineDuration) * 100
    : null;
  const playButtonLabel = ended
    ? "처음부터 다시 보기"
    : isPlaying
      ? "미리보기 일시정지"
      : "미리보기 재생";

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0f]">
      <div
        ref={(element) => {
          containerRef.current = element;
        }}
        data-testid="single-clip-focus-target"
        className="relative w-full overflow-hidden bg-black"
        style={{
          aspectRatio: String(previewAspectRatio),
          maxHeight: "64dvh",
          minHeight: "220px",
          touchAction: spotlight ? "none" : "manipulation",
        }}
        onClick={handleTap}
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
              hideNametag
              freezeMode={freezeActive || isFreezing}
              zoomLevel={zoom}
              showWhileZoom
            />
          </div>
        ) : null}

        {spotlightPicking || spotlight ? (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
              {spotlightPicking ? "선수 선택 중" : "주인공 선택됨"}
            </span>
            {freezeAtSec != null && spotlight ? (
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
      </div>

      <div className="border-t border-white/[0.06] bg-[linear-gradient(180deg,rgba(216,179,106,0.04),rgba(11,11,15,0.96))] p-3">
        <div
          ref={onTimelineReady}
          data-testid="single-clip-edit-timeline"
          className="relative h-16 overflow-visible rounded-[20px] bg-white/[0.04]"
          onMouseDown={onTimelinePress}
          onTouchStart={onTimelinePress}
        >
          <div
            className="absolute inset-y-0 rounded-[16px] bg-[#d8b36a]/18"
            style={{
              left: `${trimStartPercent}%`,
              width: `${trimEndPercent - trimStartPercent}%`,
            }}
          />

          {freezePercent != null && spotlight ? (
            <div
              data-testid="single-clip-freeze-marker"
              className="absolute inset-y-2 z-20 -translate-x-1/2"
              style={{ left: `${freezePercent}%` }}
            >
              <div className="h-full w-[2px] rounded-full bg-[#f6d69a]/70" />
              <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-[#f6d69a] bg-[#09090b]" />
            </div>
          ) : null}

          <div
            className="absolute inset-y-1 z-20 w-[2px] -translate-x-1/2 rounded-full bg-white/90"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
          </div>

          <div
            data-testid="single-clip-trim-start-handle"
            data-timeline-handle="true"
            className="absolute inset-y-0 z-30 flex items-center justify-center"
            style={{ left: `calc(${trimStartPercent}% - 18px)`, width: 36 }}
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
              className={`flex h-10 w-5 items-center justify-center rounded-full ${
                draggingTrimHandle === "start" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/82"
              }`}
            >
              <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
            </div>
          </div>

          <div
            data-testid="single-clip-trim-end-handle"
            data-timeline-handle="true"
            className="absolute inset-y-0 z-30 flex items-center justify-center"
            style={{ left: `calc(${trimEndPercent}% - 18px)`, width: 36 }}
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
              className={`flex h-10 w-5 items-center justify-center rounded-full ${
                draggingTrimHandle === "end" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/82"
              }`}
            >
              <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-white/45">
          <span>{formatTime(0)}</span>
          <span>{formatTime(draft.sourceDurationSec)}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="single-clip-play-toggle"
            aria-label={playButtonLabel}
            onClick={togglePlayback}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8b36a] text-[#09090b]"
          >
            {ended ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            ) : isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/72">
            {formatTime(seekValue)} / {formatTime(seekMax)}
          </div>
          {spotlight ? (
            <div
              data-testid="single-clip-freeze-value"
              className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-[#f6d69a]"
            >
              {draft.playback.freezeAt != null ? formatTime(draft.playback.freezeAt) : "꺼짐"}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <MiniToggleChip
            label={spotlightPicking ? "선수 고르는 중" : "선수 선택"}
            active={spotlightPicking || !!spotlight}
            ariaLabel={spotlightPicking ? "선수 선택 끄기" : "선수 선택 켜기"}
            testId="single-clip-pick-toggle"
            onClick={() => onSpotlightPickingChange(!spotlightPicking)}
          />
          {spotlight ? (
            <button
              type="button"
              aria-label="선수 선택 지우기"
              onClick={onClearSpotlight}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white/72"
            >
              지우기
            </button>
          ) : null}
          <MiniToggleChip
            label="시작 카드"
            active={draft.overlay.showProfileCard}
            ariaLabel="프로필 카드 켜기"
            testId="single-clip-profile-card-toggle"
            onClick={() => onProfileCardToggle(!draft.overlay.showProfileCard)}
          />
          <MiniToggleChip
            label="아래 정보"
            active={draft.overlay.showLowerThird}
            ariaLabel="하단 정보 켜기"
            testId="single-clip-lower-third-toggle"
            onClick={() => onLowerThirdToggle(!draft.overlay.showLowerThird)}
          />
        </div>

        {spotlight ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {FOCUS_ZOOM_PRESETS.map((preset, index) => {
              const active = Math.abs(draft.playback.zoom - preset.value) < 0.05;
              return (
                <button
                  key={preset.value}
                  type="button"
                  data-testid={`single-clip-zoom-preset-${index}`}
                  aria-pressed={active}
                  onClick={() => onZoomChange(preset.value)}
                  className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
                    active
                      ? "border-[#d8b36a]/40 bg-[#d8b36a]/14 text-[#f6d69a]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/70"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
