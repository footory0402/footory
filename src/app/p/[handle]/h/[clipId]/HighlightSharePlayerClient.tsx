"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import VideoOverlay from "@/components/video/VideoOverlay";
import IntroCard from "@/components/video/hud/IntroCard";
import { DEFAULT_HUD_CONFIG, type HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_FREEZE_HOLD_MS, resolveFocusZoom } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import { hasPlaybackFocus, resolvePlaybackSpotlight, sanitizeTrackingPoints } from "@/lib/playback-focus";
import {
  resolveSingleClipPlaybackWindow,
  resolveSingleClipFreezePoint,
  type SingleClipPlaybackContract,
} from "@/lib/single-clip-playback";
import { resolveUiVideoAspectRatio } from "@/lib/video-layout";
import {
  buildFallbackHudPlayerData,
  buildHudPlayerData,
  getCachedPlayerCard,
  preloadPlayerCard,
} from "@/lib/player-card-client";
import { INTRO_SEQUENCE_DURATION_MS } from "@/lib/intro-playback";

const HudOverlay = dynamic(() => import("@/components/video/hud/HudOverlay"), { ssr: false });

interface HighlightShareClip extends SingleClipPlaybackContract {
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
  const INTRO_BLOCK_TIMEOUT_MS = 250;
  const INTRO_DURATION_MS = INTRO_SEQUENCE_DURATION_MS;
  const FREEZE_HOLD_MS = DEFAULT_FREEZE_HOLD_MS;
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeFiredRef = useRef(false);
  const introTimerRef = useRef<number | null>(null);
  const introPlayedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.duration ?? 0);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(clip.effects?.intro !== true);
  const [introData, setIntroData] = useState<HudPlayerData | null>(null);
  const focusZoom = resolveFocusZoom(clip.effects?.focusZoom);
  const spotlight = useMemo(
    () => (
      clip.spotlightX != null && clip.spotlightY != null
        ? { x: clip.spotlightX, y: clip.spotlightY }
        : null
    ),
    [clip.spotlightX, clip.spotlightY],
  );
  const trackingPoints = useMemo(
    () => sanitizeTrackingPoints(clip.effects?.trackingPoints),
    [clip.effects?.trackingPoints],
  );
  const activeSpotlight = useMemo(() => resolvePlaybackSpotlight({
    spotlight,
    trackingMode: clip.effects?.trackingMode,
    trackingPoints,
    time: (clip.trimStart ?? 0) + currentTime,
  }), [clip.effects?.trackingMode, clip.trimStart, currentTime, spotlight, trackingPoints]);
  const hasFocusTarget = hasPlaybackFocus(spotlight, clip.effects?.trackingMode, trackingPoints);
  const hasHud = !!introData && introReady && !showIntro && clip.effects?.showLowerThird !== false;

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

  const playIntro = useCallback(() => {
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    const video = videoRef.current;
    const { trimStartSec } = resolveSingleClipPlaybackWindow(clip, video?.duration);
    introPlayedRef.current = true;
    if (video) {
      video.pause();
      video.currentTime = trimStartSec;
    }
    setEnded(false);
    setPaused(false);
    setShowIntro(true);
    setIntroReady(false);
    introTimerRef.current = window.setTimeout(() => {
      introTimerRef.current = null;
      setShowIntro(false);
      setIntroReady(true);
      videoRef.current?.play().catch(() => {});
    }, INTRO_DURATION_MS);
  }, [INTRO_DURATION_MS, clip]);

  useEffect(() => {
    const fallbackIntro = buildFallbackHudPlayerData(clip);
    introPlayedRef.current = false;
    setShowIntro(false);
    setIntroReady(clip.effects?.intro !== true);
    if (clip.effects?.intro === true && fallbackIntro) {
      setIntroData(fallbackIntro);
      playIntro();
    }
  }, [clip, playIntro]);

  useEffect(() => {
    let cancelled = false;
    const fallbackIntro = buildFallbackHudPlayerData(clip);
    const cached = getCachedPlayerCard(clip.profileId);
    const shouldShowIntro = clip.effects?.intro === true;

    if (fallbackIntro) setIntroData(fallbackIntro);

    if (shouldShowIntro && cached?.card) {
      const hudData = buildHudPlayerData(cached) ?? fallbackIntro;
      if (hudData) {
        setIntroData(hudData);
        playIntro();
      }
    }

    const needsIntroFetchFallback = !(shouldShowIntro && cached?.card);
    const unblockTimer = needsIntroFetchFallback
      ? window.setTimeout(() => {
          if (!cancelled) setIntroReady(true);
        }, INTRO_BLOCK_TIMEOUT_MS)
      : null;

    preloadPlayerCard(clip.profileId)
      .then((res) => {
        if (cancelled) return;
        const hudData = buildHudPlayerData(res) ?? fallbackIntro;
        if (hudData) setIntroData(hudData);
      })
      .finally(() => {
        if (unblockTimer) window.clearTimeout(unblockTimer);
      });

    return () => {
      cancelled = true;
      if (unblockTimer) window.clearTimeout(unblockTimer);
    };
  }, [clip, playIntro]);

  useEffect(() => () => {
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (introReady && !showIntro) {
      videoRef.current?.play().catch(() => {});
    }
  }, [introReady, showIntro]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const { trimStartSec, durationSec } = resolveSingleClipPlaybackWindow(clip, video.duration);

      setVideoNativeSize({ w: video.videoWidth || 1, h: video.videoHeight || 1 });
      setDuration(durationSec);
      if (trimStartSec > 0) video.currentTime = trimStartSec;
      if (clip.effects?.intro === true && introData) {
        playIntro();
        return;
      }
      if (introReady) video.play().catch(() => {});
    };

    const handleTimeUpdate = () => {
      const { trimStartSec, trimEndSec } = resolveSingleClipPlaybackWindow(clip, video.duration);
      const { freezeAtSec } = resolveSingleClipFreezePoint(clip, video.duration);
      const elapsed = Math.max(0, video.currentTime - trimStartSec);
      setCurrentTime(elapsed);

      if (trimEndSec > 0 && video.currentTime >= trimEndSec) {
        video.currentTime = trimEndSec;
        video.pause();
        setEnded(true);
        return;
      }

      if (
        freezeAtSec != null &&
        hasFocusTarget &&
        !freezeFiredRef.current &&
        !video.paused &&
        video.currentTime >= freezeAtSec
      ) {
        const freezeSpotlight = resolvePlaybackSpotlight({
          spotlight,
          trackingMode: clip.effects?.trackingMode,
          trackingPoints,
          time: freezeAtSec,
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
  }, [FREEZE_HOLD_MS, clip, introData, introReady, isFreezing, animateZoomTo, focusZoom, hasFocusTarget, playIntro, spotlight, trackingPoints]);

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
    setShowIntro(false);
    setIntroReady(clip.effects?.intro !== true);

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
      const { trimStartSec } = resolveSingleClipPlaybackWindow(clip);
      video.currentTime = trimStartSec;
      setEnded(false);
      if (clip.effects?.intro === true && introData) {
        introPlayedRef.current = false;
        playIntro();
        return;
      }
      video.play().catch(() => {});
      return;
    }

    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, [clip, ended, introData, isFreezing, playIntro]);

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
    const { trimStartSec } = resolveSingleClipPlaybackWindow(clip);
    video.currentTime = trimStartSec + ratio * duration;
  }, [clip, duration]);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const isPortraitVideo = videoNativeSize ? videoNativeSize.h > videoNativeSize.w : false;
  const hudCompact = isPortraitVideo;
  const uiAspectRatio = resolveUiVideoAspectRatio(videoNativeSize);
  const playerMaxHeight = hasHud
    ? (isPortraitVideo ? "58vh" : "68vh")
    : "75vh";
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
          aspectRatio: String(uiAspectRatio),
          maxHeight: playerMaxHeight,
          minHeight: 220,
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
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "contain",
            opacity: showIntro ? 0 : 1,
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

        {showIntro && introData ? (
          <div className="absolute inset-0 z-[60] bg-black">
            <IntroCard data={introData} animate />
          </div>
        ) : null}

      </div>

      {hasHud ? (
        <div className="mt-2 overflow-hidden rounded-[14px] border border-white/[0.07]">
          <HudOverlay
            data={introData!}
            config={{ ...DEFAULT_HUD_CONFIG, goalCount: 0 }}
            mode="docked"
            compact={hudCompact}
          />
        </div>
      ) : null}

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
