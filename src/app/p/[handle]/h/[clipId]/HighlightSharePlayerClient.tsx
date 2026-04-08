"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CaptionOverlay from "@/components/video/CaptionOverlay";
import VideoOverlay from "@/components/video/VideoOverlay";
import type { Caption } from "@/stores/upload-store";
import { resolveFocusZoom } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";

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
  slowmoStart?: number | null;
  slowmoEnd?: number | null;
  slowmoSpeed?: number | null;
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
    focusZoom?: number;
    captions?: Caption[];
  } | null;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const {
    adjustedSpotlight,
    animateZoomTo,
    cancelZoomAnimation,
    pan,
    resetTransform,
    zoom,
    zoomRef,
  } = useSpotlightZoom({
    videoRef,
    videoNativeSize,
    spotlight,
  });

  const cancelFocusAnimation = useCallback(() => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
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

      const slowmoStart = clip.slowmoStart;
      const slowmoEnd = clip.slowmoEnd;
      const slowmoSpeed = clip.slowmoSpeed ?? 0.5;
      if (slowmoStart != null && slowmoEnd != null) {
        const inSlowmo = video.currentTime >= slowmoStart && video.currentTime < slowmoEnd;
        if (inSlowmo && video.playbackRate !== slowmoSpeed) video.playbackRate = slowmoSpeed;
        if (!inSlowmo && video.playbackRate !== 1) video.playbackRate = 1;
      }

      if (
        clip.freezeAt != null &&
        clip.spotlightX != null &&
        !freezeFiredRef.current &&
        !video.paused &&
        video.currentTime >= clip.freezeAt
      ) {
        freezeFiredRef.current = true;
        video.pause();
        setIsFreezing(true);
        freezeTimerRef.current = setTimeout(() => {
          setIsFreezing(false);
          freezeTimerRef.current = null;
          video.play().catch(() => {});
        }, 1000);
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
  }, [clip, isFreezing]);

  useEffect(() => {
    freezeFiredRef.current = false;
    resetTransform();
    setPaused(false);
    setEnded(false);
    setCurrentTime(0);
    setIsFocusMode(false);
    setIsFreezing(false);

    return () => {
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = null;
      }
      cancelFocusAnimation();
    };
  }, [clip.id, cancelFocusAnimation, resetTransform]);

  useEffect(() => {
    if (clip.spotlightX == null || clip.spotlightY == null || !videoNativeSize) return;

    focusTimerRef.current = setTimeout(() => {
      animateZoomTo(clip.spotlightX ?? 0.5, clip.spotlightY ?? 0.5, focusZoom, 450, () => {
        setIsFocusMode(true);
      });
    }, 450);

    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [animateZoomTo, clip.spotlightX, clip.spotlightY, focusZoom, videoNativeSize]);

  useEffect(() => {
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
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
    if (clip.spotlightX == null || clip.spotlightY == null) return;

    if (zoomRef.current > 1) {
      animateZoomTo(0.5, 0.5, 1, 400, () => {
        setIsFocusMode(false);
      });
      return;
    }

    animateZoomTo(clip.spotlightX, clip.spotlightY, focusZoom, 400, () => {
      setIsFocusMode(true);
    });
  }, [animateZoomTo, clip.spotlightX, clip.spotlightY, focusZoom]);

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
            filter: clip.effects?.color ? "saturate(1.2) contrast(1.05) brightness(1.02)" : undefined,
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

        {clip.effects?.captions && clip.effects.captions.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-[11]">
            <CaptionOverlay
              captions={clip.effects.captions}
              currentTime={currentTime}
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

        {clip.spotlightX != null && clip.spotlightY != null && (
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

          {clip.spotlightX != null && clip.spotlightY != null && (
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
