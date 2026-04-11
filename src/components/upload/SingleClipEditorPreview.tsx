"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import IntroCard from "@/components/video/hud/IntroCard";
import type { HudPlayerData } from "@/components/video/hud/types";
import { FOCUS_ZOOM_PRESETS } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { screenToVideo } from "@/lib/spotlight-math";
import type { SingleClipEditingDraft } from "@/lib/single-clip-playback";
import { resolveUiVideoAspectRatio } from "@/lib/video-layout";
import { INTRO_SEQUENCE_DURATION_MS, shouldPlayIntroBeforeVideo } from "@/lib/intro-playback";

interface SingleClipEditorPreviewProps {
  videoSrc: string;
  draft: SingleClipEditingDraft;
  playerData: HudPlayerData | null;
  previewTime: number;
  spotlightPicking: boolean;
  focusPreviewVisible: boolean;
  overlayPreviewVisible: boolean;
  onFocusTargetReady?: (element: HTMLDivElement | null) => void;
  onZoomControlsReady?: (element: HTMLDivElement | null) => void;
  onSeekControlsReady?: (element: HTMLInputElement | null) => void;
  onPreviewTimeChange: (time: number) => void;
  onSpotlightChange: (spotlight: { x: number; y: number } | null) => void;
  onZoomChange: (zoom: number) => void;
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
        <div className="pointer-events-none absolute left-[6%] top-[8%] z-20 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/80">
          상단 카드
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-20 rounded-[20px] border border-dashed border-white/20 bg-black/25 px-3 py-2 backdrop-blur-sm">
        {showLowerThird && playerData ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#d8b36a] px-2 py-1 text-[10px] font-bold text-[#09090b]">
              {playerData.position || "선수"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">
                {playerData.name || "선수 정보"}
              </p>
              <p className="text-[10px] text-white/60">하단 안전 영역</p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] font-medium text-white/70">
            정보를 켜면 하단 안전 영역에 보여요
          </p>
        )}
      </div>
    </>
  );
}

export default function SingleClipEditorPreview({
  videoSrc,
  draft,
  playerData,
  previewTime,
  spotlightPicking,
  focusPreviewVisible,
  overlayPreviewVisible,
  onFocusTargetReady,
  onZoomControlsReady,
  onSeekControlsReady,
  onPreviewTimeChange,
  onSpotlightChange,
  onZoomChange,
}: SingleClipEditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const lastPinchZoomRef = useRef(draft.playback.zoom);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introPlayedRef = useRef(false);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const spotlight = draft.playback.spotlight;
  const freezeActive =
    draft.playback.freezeAt != null && Math.abs(draft.playback.freezeAt - previewTime) <= 0.35;
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
    };

    const handlePlay = () => {
      setEnded(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
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
  }, [draft.playback.trimEnd, draft.playback.trimStart, onPreviewTimeChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || Math.abs(video.currentTime - previewTime) <= 0.05) return;
    video.currentTime = previewTime;
  }, [previewTime]);

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
      if (
        video.currentTime < draft.playback.trimStart ||
        video.currentTime >= draft.playback.trimEnd
      ) {
        video.currentTime = draft.playback.trimStart;
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
  }, [draft.overlay.showProfileCard, draft.playback.trimEnd, draft.playback.trimStart, ended, playerData, showIntro]);

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

  const applyZoom = useCallback(
    (nextZoom: number) => {
      const rounded = Number(Math.min(3.2, Math.max(1, nextZoom)).toFixed(1));
      if (Math.abs(rounded - draft.playback.zoom) < 0.05) return;
      onZoomChange(rounded);
    },
    [draft.playback.zoom, onZoomChange]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!focusPreviewVisible || !spotlight || event.touches.length !== 2) {
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
    [draft.playback.zoom, focusPreviewVisible, spotlight]
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
  const activeZoomPreset = FOCUS_ZOOM_PRESETS.find(
    (preset) => Math.abs(preset.value - draft.playback.zoom) < 0.05
  );
  const helperText = useMemo(() => {
    if (focusPreviewVisible && spotlightPicking) {
      return spotlight
        ? "다른 선수를 누르면 바로 바뀌어요."
        : "주인공을 한 번 누르면 바로 가깝게 보여줘요.";
    }
    if (focusPreviewVisible && spotlight) {
      return activeZoomPreset
        ? `${activeZoomPreset.label}로 주인공이 더 잘 보여요.`
        : `${draft.playback.zoom.toFixed(1)}x로 주인공을 더 잘 보이게 해요.`;
    }
    if (focusPreviewVisible) {
      return "주인공을 고르면 바로 확대돼요.";
    }
    if (overlayPreviewVisible) {
      return "정보는 하단 안전 영역에만 보여요.";
    }
    return "구간만 확인하고 다음으로 가세요.";
  }, [
    draft.playback.zoom,
    focusPreviewVisible,
    overlayPreviewVisible,
    activeZoomPreset,
    spotlight,
    spotlightPicking,
  ]);

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
          touchAction: focusPreviewVisible && spotlight ? "none" : "auto",
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

        {focusPreviewVisible && playerData?.name && adjustedSpotlight ? (
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
              freezeMode={freezeActive}
              zoomLevel={zoom}
              showWhileZoom
            />
          </div>
        ) : null}

        {focusPreviewVisible ? (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
              {spotlight ? "주인공 선택됨" : "선수를 한 번 눌러주세요"}
            </span>
            {spotlight ? (
              <span className="rounded-full border border-[#d8b36a]/30 bg-[#d8b36a]/12 px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a] backdrop-blur-sm">
                {activeZoomPreset ? `${activeZoomPreset.label}` : `재생도 ${draft.playback.zoom.toFixed(1)}x`}
              </span>
            ) : null}
          </div>
        ) : null}

        {overlayPreviewVisible ? (
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

        {!isPlaying && !spotlightPicking ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              {ended ? (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] bg-[linear-gradient(180deg,rgba(216,179,106,0.05),rgba(11,11,15,0.96))] p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className="rounded-full bg-[#d8b36a] px-4 py-2 text-[12px] font-bold text-[#09090b]"
          >
            {isPlaying ? "일시정지" : ended ? "다시 보기" : "재생"}
          </button>
          <div className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-text-2">
            {formatTime(seekValue)} / {formatTime(seekMax)}
          </div>
          <div className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-text-2">
            구간 {formatTime(draft.playback.trimStart)} - {formatTime(draft.playback.trimEnd)}
          </div>
        </div>

        {focusPreviewVisible ? (
          <div
            ref={onZoomControlsReady}
            data-testid="single-clip-zoom-controls"
            className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-3 py-3"
          >
            <div>
              <p className="text-[12px] font-semibold text-text-1">
                {spotlight ? "재생할 때도 이 구도로 보여요" : "먼저 선수를 한 번 눌러주세요"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-text-3">
                {spotlight
                  ? "먼저 쉬운 정도를 고르고, 필요하면 두 손가락으로 조금만 맞추세요."
                  : "주인공을 고르면 자동으로 가까이 보여줘요."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="확대 줄이기"
                disabled={!spotlight || draft.playback.zoom <= 1}
                onClick={() => applyZoom(draft.playback.zoom - 0.2)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/85 disabled:opacity-30"
              >
                −
              </button>
              <button
                type="button"
                aria-label="확대 초기화"
                disabled={!spotlight}
                onClick={() => applyZoom(1)}
                className="min-w-[56px] rounded-full border border-[#d8b36a]/20 bg-[#d8b36a]/10 px-3 py-2 text-[12px] font-bold text-[#f6d69a] disabled:opacity-30"
              >
                {draft.playback.zoom.toFixed(1)}x
              </button>
              <button
                type="button"
                aria-label="확대 늘리기"
                disabled={!spotlight}
                onClick={() => applyZoom(draft.playback.zoom + 0.2)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/85 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        {focusPreviewVisible && spotlight ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {FOCUS_ZOOM_PRESETS.map((preset) => {
              const selected = Math.abs(draft.playback.zoom - preset.value) < 0.05;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => applyZoom(preset.value)}
                  className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? "border-[#d8b36a]/35 bg-[#d8b36a]/12 text-[#f6d69a]"
                      : "border-white/[0.06] bg-white/[0.03] text-text-2"
                  }`}
                >
                  <p className="text-[12px] font-semibold">{preset.label}</p>
                  <p className="mt-1 text-[11px] opacity-80">{preset.description}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4">
          <input
            ref={onSeekControlsReady}
            type="range"
            min={seekMin}
            max={seekMax}
            step={0.1}
            value={seekValue}
            onChange={(event) => {
              const video = videoRef.current;
              const nextValue = Number(event.target.value);
              if (video) {
                video.currentTime = nextValue;
              }
              onPreviewTimeChange(nextValue);
            }}
            className="w-full accent-[#d8b36a]"
            aria-label="편집 미리보기 이동"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-white/60">
            <span>{formatTime(seekMin)}</span>
            <p className="flex-1 text-center">{helperText}</p>
            <span>{formatTime(seekMax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
