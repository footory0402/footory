"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import type { HudPlayerData } from "@/components/video/hud/types";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { screenToVideo } from "@/lib/spotlight-math";
import type { SingleClipEditingDraft } from "@/lib/single-clip-playback";

interface SingleClipEditorPreviewProps {
  videoSrc: string;
  draft: SingleClipEditingDraft;
  playerData: HudPlayerData | null;
  previewTime: number;
  spotlightPicking: boolean;
  focusPreviewVisible: boolean;
  overlayPreviewVisible: boolean;
  onPreviewTimeChange: (time: number) => void;
  onSpotlightChange: (spotlight: { x: number; y: number } | null) => void;
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
          재생 전 카드 표시
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-20 rounded-[20px] border border-dashed border-white/20 bg-black/25 px-3 py-2 backdrop-blur-sm">
        {showLowerThird && playerData ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#d8b36a] px-2 py-1 text-[10px] font-bold text-[#09090b]">
              {playerData.position || "선수"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">{playerData.name || "선수 정보"}</p>
              <p className="text-[10px] text-white/60">아래 영역에만 보여요</p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] font-medium text-white/70">정보를 켜면 아래에만 보여요</p>
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

  useEffect(() => {
    if (!spotlightPicking) return;
    const video = videoRef.current;
    if (!video || video.paused) return;
    video.pause();
  }, [spotlightPicking]);

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
  const helperText = useMemo(() => {
    if (focusPreviewVisible && spotlightPicking) {
      return "선수를 한 번 눌러주세요.";
    }
    if (focusPreviewVisible && spotlight) {
      return `${draft.playback.zoom.toFixed(1)}x로 따라가요.`;
    }
    if (focusPreviewVisible) {
      return "주인공을 고르면 확대돼요.";
    }
    if (overlayPreviewVisible) {
      return "정보는 아래에만 보여요.";
    }
    return "필요한 구간만 바로 확인하세요.";
  }, [draft.playback.zoom, focusPreviewVisible, overlayPreviewVisible, spotlight, spotlightPicking]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0f]">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-black"
        style={{
          aspectRatio: videoNativeSize ? `${videoNativeSize.w} / ${videoNativeSize.h}` : "16 / 9",
          maxHeight: "64dvh",
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
            />
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
