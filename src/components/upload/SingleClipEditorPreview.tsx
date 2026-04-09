"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HudOverlay from "@/components/video/hud/HudOverlay";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import VideoOverlay from "@/components/video/VideoOverlay";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { screenToVideo } from "@/lib/spotlight-math";
import type { SingleClipEditingDraft } from "@/lib/single-clip-playback";

interface SingleClipEditorPreviewProps {
  videoSrc: string;
  draft: SingleClipEditingDraft;
  playerData: HudPlayerData | null;
  previewTime: number;
  spotlightPicking: boolean;
  onPreviewTimeChange: (time: number) => void;
  onSpotlightChange: (spotlight: { x: number; y: number } | null) => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function SingleClipEditorPreview({
  videoSrc,
  draft,
  playerData,
  previewTime,
  spotlightPicking,
  onPreviewTimeChange,
  onSpotlightChange,
}: SingleClipEditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const spotlight = draft.playback.spotlight;
  const freezeActive = draft.playback.freezeAt != null
    && Math.abs(draft.playback.freezeAt - previewTime) <= 0.35;

  const {
    adjustedSpotlight,
    pan,
    resetTransform,
    syncZoomTo,
    zoom,
  } = useSpotlightZoom({
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
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime < draft.playback.trimStart || video.currentTime > draft.playback.trimEnd) {
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

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (ended) {
      video.currentTime = draft.playback.trimStart;
      setEnded(false);
    }

    if (video.paused) {
      if (video.currentTime < draft.playback.trimStart || video.currentTime >= draft.playback.trimEnd) {
        video.currentTime = draft.playback.trimStart;
      }
      video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [draft.playback.trimEnd, draft.playback.trimStart, ended]);

  const handleTap = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
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
      pan,
    );

    if (!spot) return;
    video.pause();
    onPreviewTimeChange(video.currentTime);
    onSpotlightChange(spot);
  }, [onPreviewTimeChange, onSpotlightChange, pan, spotlightPicking, togglePlayback, videoNativeSize, zoom]);

  const seekMin = draft.playback.trimStart;
  const seekMax = draft.playback.trimEnd;
  const seekValue = Math.min(Math.max(previewTime, seekMin), seekMax);
  const videoTransform = zoom > 1
    ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`
    : undefined;
  const hudVisible = draft.overlay.showLowerThird && !!playerData;
  const overlayLabel = useMemo(() => {
    if (spotlightPicking) return "프리뷰를 눌러 선수를 지정하세요";
    if (!spotlight) return "주인공을 고르면 확대 재생이 함께 적용돼요";
    if (freezeActive) return "고정 화면 미리보기";
    return `자동 확대 ${draft.playback.zoom.toFixed(1)}x`;
  }, [draft.playback.zoom, freezeActive, spotlight, spotlightPicking]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0f]">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-black"
        style={{
          aspectRatio: videoNativeSize ? `${videoNativeSize.w} / ${videoNativeSize.h}` : "9 / 16",
          maxHeight: "56dvh",
        }}
        onClick={handleTap}
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
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white/85">
            한 장면 편집
          </span>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            spotlightPicking ? "bg-[#d8b36a] text-[#09090b]" : "bg-black/55 text-white/85"
          }`}>
            {overlayLabel}
          </span>
        </div>

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
              freezeMode={freezeActive}
              zoomLevel={zoom}
            />
          </div>
        ) : null}

        {hudVisible && playerData ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
            <HudOverlay data={playerData} config={DEFAULT_HUD_CONFIG} mode="docked" />
          </div>
        ) : null}

        {isBuffering && isPlaying ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/15 border-t-white/80" />
          </div>
        ) : null}

        {!isPlaying ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              {ended ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <div className="border-t border-white/[0.06] bg-[linear-gradient(180deg,rgba(216,179,106,0.08),rgba(11,11,15,0.95))] p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="rounded-full bg-[#d8b36a] px-4 py-2 text-[12px] font-bold text-[#09090b]"
          >
            {isPlaying ? "일시정지" : ended ? "다시 보기" : "재생"}
          </button>
          <div className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-text-2">
            구간 {formatTime(draft.playback.trimStart)} - {formatTime(draft.playback.trimEnd)}
          </div>
          <div className="rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-text-2">
            하이라이트 {formatTime(draft.playback.highlightStart)} - {formatTime(draft.playback.highlightEnd)}
          </div>
        </div>

        <div className="mt-4">
          <input
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
          <div className="mt-2 flex items-center justify-between text-[12px] text-white/55">
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(Math.max(0, seekMax - seekMin))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
