"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import { resolveFocusZoom } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import type { PlaybackEffects } from "@/lib/playback-focus";
import { hasPlaybackFocus, resolvePlaybackSpotlight, sanitizeTrackingPoints } from "@/lib/playback-focus";

interface HighlightShareClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  effects?: PlaybackEffects | null;
  playerName: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
}

interface HighlightSharePlayerClientProps {
  clip: HighlightShareClip;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function HighlightSharePlayerClient({
  clip,
}: HighlightSharePlayerClientProps) {
  const FREEZE_HOLD_MS = 1500;
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeFiredRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.durationSeconds ?? 0);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const focusZoom = resolveFocusZoom(clip.effects?.focusZoom);
  const spotlight =
    clip.spotlightX != null && clip.spotlightY != null
      ? { x: clip.spotlightX, y: clip.spotlightY }
      : null;
  const trackingPoints = sanitizeTrackingPoints(clip.effects?.trackingPoints);
  const activeSpotlight = resolvePlaybackSpotlight({
    spotlight,
    trackingMode: clip.effects?.trackingMode,
    trackingPoints,
    time: (clip.trimStart ?? 0) + currentTime,
  });
  const hasFocusTarget = hasPlaybackFocus(spotlight, clip.effects?.trackingMode, trackingPoints);

  const {
    adjustedSpotlight,
    animateZoomTo,
    cancelZoomAnimation,
    pan,
    resetTransform,
    syncZoomTo,
    zoom,
    zoomRef,
  } = useSpotlightZoom({
    videoRef,
    videoNativeSize,
    spotlight: activeSpotlight,
  });

  const cancelFocusAnimation = useCallback(() => {
    cancelZoomAnimation();
  }, [cancelZoomAnimation]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const trimStart = clip.trimStart ?? 0;
      const trimEnd = clip.trimEnd ?? video.duration ?? clip.durationSeconds ?? 0;

      setVideoNativeSize({ w: video.videoWidth || 1, h: video.videoHeight || 1 });
      setDuration(Math.max(0, trimEnd - trimStart));
      if (trimStart > 0) video.currentTime = trimStart;
      video.play().catch(() => {});
    };

    const handleTimeUpdate = () => {
      const trimStart = clip.trimStart ?? 0;
      const trimEnd = clip.trimEnd ?? video.duration ?? 0;
      const elapsed = Math.max(0, video.currentTime - trimStart);
      setCurrentTime(elapsed);

      if (trimEnd > 0 && video.currentTime >= trimEnd) {
        video.currentTime = trimEnd;
        video.pause();
        setEnded(true);
        return;
      }

      if (
        clip.freezeAt != null &&
        hasFocusTarget &&
        !freezeFiredRef.current &&
        !video.paused &&
        video.currentTime >= clip.freezeAt
      ) {
        const freezeSpotlight = resolvePlaybackSpotlight({
          spotlight,
          trackingMode: clip.effects?.trackingMode,
          trackingPoints,
          time: clip.freezeAt,
        });
        if (!freezeSpotlight) return;

        freezeFiredRef.current = true;
        video.pause();
        setIsFreezing(true);
        setIsFocusMode(true);
        animateZoomTo(freezeSpotlight.x, freezeSpotlight.y, focusZoom, 250);
        freezeTimerRef.current = setTimeout(() => {
          freezeTimerRef.current = null;
          setIsFreezing(false);
          video.play().catch(() => {});
        }, FREEZE_HOLD_MS);
      }
    };

    const handlePlay = () => {
      setPaused(false);
      setEnded(false);
    };

    const handlePause = () => {
      if (!isFreezing) setPaused(true);
    };

    const handleEnded = () => {
      setEnded(true);
      setPaused(true);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [clip, isFreezing, animateZoomTo, focusZoom, hasFocusTarget, spotlight, trackingPoints]);

  useEffect(() => {
    if (!activeSpotlight || !hasFocusTarget || !isFocusMode || isFreezing) return;
    syncZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom);
  }, [activeSpotlight, focusZoom, hasFocusTarget, isFocusMode, isFreezing, syncZoomTo]);

  useEffect(() => {
    freezeFiredRef.current = false;
    resetTransform();
    setPaused(false);
    setEnded(false);
    setCurrentTime(0);
    setIsFocusMode(hasFocusTarget);
    setIsFreezing(false);

    return () => {
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = null;
      }
      cancelFocusAnimation();
    };
  }, [clip.id, cancelFocusAnimation, hasFocusTarget, resetTransform]);

  useEffect(() => {
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || isFreezing) return;

    if (ended) {
      const trimStart = clip.trimStart ?? 0;
      video.currentTime = trimStart;
      setEnded(false);
      video.play().catch(() => {});
      return;
    }

    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, [clip.trimStart, ended, isFreezing]);

  const toggleFocus = useCallback(() => {
    if (!activeSpotlight || !hasFocusTarget) return;

    if (zoomRef.current > 1) {
      animateZoomTo(0.5, 0.5, 1, 400, () => {
        setIsFocusMode(false);
      });
      return;
    }

    animateZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom, 400, () => {
      setIsFocusMode(true);
    });
  }, [activeSpotlight, animateZoomTo, focusZoom, hasFocusTarget, zoomRef]);

  const handleSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const trimStart = clip.trimStart ?? 0;
    video.currentTime = trimStart + ratio * duration;
  }, [clip.trimStart, duration]);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const videoTransform = zoom > 1
    ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`
    : undefined;

  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden"
        style={{
          borderRadius: 16,
          background: "#0D0D10",
          aspectRatio: videoNativeSize ? `${videoNativeSize.w} / ${videoNativeSize.h}` : "9 / 16",
          maxHeight: "75vh",
        }}
      >
        {clip.thumbnailUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${clip.thumbnailUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px) brightness(0.35)",
              transform: "scale(1.08)",
            }}
          />
        )}

        <video
          ref={videoRef}
          src={clip.videoUrl}
          poster={clip.thumbnailUrl ?? undefined}
          playsInline
          preload="auto"
          muted={isMuted}
          autoPlay
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "contain",
            transform: videoTransform,
            transformOrigin: "center center",
          }}
          onClick={togglePlayback}
        />

        {clip.playerName && adjustedSpotlight && (
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
                name: clip.playerName,
                position: clip.playerPosition,
                birthYear: clip.playerBirthYear,
              }}
              effects={clip.effects}
              freezeMode={isFreezing}
              zoomLevel={zoom}
            />
          </div>
        )}

        {paused && !isFreezing && (
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
        )}

        {isBuffering && !paused && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-[3px] border-white/20 border-t-white/80 animate-spin" />
          </div>
        )}

        {hasFocusTarget && (isFreezing || isFocusMode || zoom > 1.05) && (
          <div className="absolute left-3 top-3 z-[21] flex gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: isFocusMode || zoom > 1 ? "rgba(212,168,83,0.18)" : "rgba(0,0,0,0.55)",
                border: isFocusMode || zoom > 1 ? "1px solid rgba(212,168,83,0.35)" : "1px solid rgba(255,255,255,0.08)",
                color: isFocusMode || zoom > 1 ? "#D4A853" : "#FAFAFA",
              }}
            >
              자동 확대 {focusZoom.toFixed(1)}x
            </span>
          </div>
        )}
      </div>

      <div
        className="mt-3 w-full"
        style={{
          background: "#1C1C22",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "14px 16px",
        }}
      >
        <div
          className="h-2 cursor-pointer overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}
          onClick={handleSeek}
          role="slider"
          aria-label="재생 위치"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #D4A853 0%, #F5E6B8 100%)",
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[12px] text-white/55">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={togglePlayback}
            className="rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#FAFAFA",
            }}
          >
            {paused ? (ended ? "다시 보기" : "재생") : "일시정지"}
          </button>

          {hasFocusTarget && (
            <button
              onClick={toggleFocus}
              className="rounded-full px-4 py-2 text-[12px] font-semibold"
              style={{
                background: isFocusMode || zoom > 1 ? "rgba(212,168,83,0.18)" : "rgba(255,255,255,0.08)",
                border: isFocusMode || zoom > 1 ? "1px solid rgba(212,168,83,0.35)" : "1px solid rgba(255,255,255,0.08)",
                color: isFocusMode || zoom > 1 ? "#D4A853" : "#FAFAFA",
              }}
            >
              {isFocusMode || zoom > 1 ? "전체 화면 보기" : "주인공 포커스 보기"}
            </button>
          )}

          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (videoRef.current) videoRef.current.muted = nextMuted;
            }}
            className="rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#FAFAFA",
            }}
          >
            {isMuted ? "소리 켜기" : "음소거"}
          </button>
        </div>
      </div>
    </div>
  );
}
