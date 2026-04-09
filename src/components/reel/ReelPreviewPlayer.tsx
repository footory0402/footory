"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { HudPlayerData } from "@/components/video/hud/types";
import { resolveFocusZoom } from "@/lib/focus-zoom";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import type { PlaybackEffects } from "@/lib/playback-focus";
import { hasPlaybackFocus, resolvePlaybackSpotlight, sanitizeTrackingPoints } from "@/lib/playback-focus";
import {
  buildHudPlayerData,
  getCachedPlayerCard,
  preloadPlayerCard,
} from "@/lib/player-card-client";

const VideoOverlay = dynamic(() => import("@/components/video/VideoOverlay"), { ssr: false });
const IntroCard = dynamic(() => import("@/components/video/hud/IntroCard"), { ssr: false });

interface ReelClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration_seconds?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  effects?: PlaybackEffects | null;
  transition?: "cut" | "fade";
}

interface ReelPreviewPlayerProps {
  clips: ReelClip[];
  onClose: () => void;
}

export default function ReelPreviewPlayer({ clips, onClose }: ReelPreviewPlayerProps) {
  const INTRO_BLOCK_TIMEOUT_MS = 250;
  const INTRO_DURATION_MS = 2000;
  const FREEZE_HOLD_MS = 1500;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fading, setFading] = useState(false);
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  // Freeze frame
  const [isFreezing, setIsFreezing] = useState(false);
  const freezeFiredRef = useRef<Set<string>>(new Set());
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intro card
  const [introData, setIntroData] = useState<HudPlayerData | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(true);

  const clip = clips[index];
  const focusZoom = resolveFocusZoom(clip?.effects?.focusZoom);
  const totalDuration = clips.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const passedDuration = clips.slice(0, index).reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const spotlight =
    clip?.spotlightX != null && clip?.spotlightY != null
      ? { x: clip.spotlightX, y: clip.spotlightY }
      : null;
  const trackingPoints = sanitizeTrackingPoints(clip?.effects?.trackingPoints);
  const activeSpotlight = resolvePlaybackSpotlight({
    spotlight,
    trackingMode: clip?.effects?.trackingMode,
    trackingPoints,
    time: (clip?.trimStart ?? 0) + currentTime,
  });
  const hasFocusTarget = hasPlaybackFocus(spotlight, clip?.effects?.trackingMode, trackingPoints);

  const {
    adjustedSpotlight,
    animateZoomTo,
    cancelZoomAnimation,
    pan,
    resetTransform,
    syncZoomTo,
    zoom,
  } = useSpotlightZoom({
    videoRef,
    videoNativeSize,
    spotlight: activeSpotlight,
  });

  const cancelAutoFocus = useCallback(() => {
    cancelZoomAnimation();
  }, [cancelZoomAnimation]);

  const playIntro = useCallback(() => {
    setShowIntro(true);
    setIntroReady(false);
    window.setTimeout(() => {
      setShowIntro(false);
      setIntroReady(true);
      videoRef.current?.play().catch(() => {});
    }, INTRO_DURATION_MS);
  }, []);

  // 인트로 카드 로딩 — 마운트 시 1회
  useEffect(() => {
    let cancelled = false;
    const shouldShowIntro = clips[0]?.effects?.intro === true;
    const cached = getCachedPlayerCard();

    if (shouldShowIntro && cached?.card) {
      const hudData = buildHudPlayerData(cached);
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

    preloadPlayerCard()
      .then((res) => {
        if (cancelled || !res) return;
        const hudData = buildHudPlayerData(res);
        if (hudData) setIntroData(hudData);
      })
      .finally(() => {
        if (unblockTimer) window.clearTimeout(unblockTimer);
      });

    return () => {
      cancelled = true;
      if (unblockTimer) window.clearTimeout(unblockTimer);
    };
  }, [clips, playIntro]);

  // introReady가 되면 영상 재생
  useEffect(() => {
    if (introReady && !showIntro) {
      videoRef.current?.play().catch(() => {});
    }
  }, [introReady, showIntro]);

  useEffect(() => {
    if (!clip) return;
    cancelAutoFocus();
    resetTransform();
    setVideoNativeSize(null);
  }, [clip, cancelAutoFocus, resetTransform]);

  const goNext = useCallback(() => {
    if (index >= clips.length - 1) {
      setIndex(0);
      return;
    }
    const nextClip = clips[index + 1];
    if (clip?.transition === "fade") {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => i + 1);
        setFading(false);
        videoRef.current?.play().catch(() => {});
      }, 500);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, clips, clip]);

  // 클립 변경 시 비디오 초기화
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip) return;
    setIsFreezing(false);
    if (freezeTimerRef.current) { clearTimeout(freezeTimerRef.current); freezeTimerRef.current = null; }
    v.src = clip.videoUrl;
    v.load();
    const trimS = clip.trimStart ?? 0;
    const onLoaded = () => {
      setVideoNativeSize({ w: v.videoWidth || 1, h: v.videoHeight || 1 });
      if (trimS > 0) v.currentTime = trimS;
      if (introReady) v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, clip]);

  // timeupdate 핸들러
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip) return;
    const onTime = () => {
      const trimS = clip.trimStart ?? 0;
      const trimE = clip.trimEnd ?? v.duration ?? 0;
      if (trimE > 0 && v.currentTime >= trimE) {
        goNext();
        return;
      }
      const elapsed = Math.max(0, v.currentTime - trimS);
      setCurrentTime(elapsed);
      if (totalDuration > 0) {
        setTotalProgress((passedDuration + elapsed) / totalDuration);
      }
      // freeze frame
      if (
        clip.freezeAt != null &&
        hasFocusTarget &&
        !freezeFiredRef.current.has(clip.id) &&
        !v.paused &&
        v.currentTime >= clip.freezeAt
      ) {
        const freezeSpotlight = resolvePlaybackSpotlight({
          spotlight,
          trackingMode: clip.effects?.trackingMode,
          trackingPoints,
          time: clip.freezeAt,
        });
        if (!freezeSpotlight) return;

        freezeFiredRef.current.add(clip.id);
        v.pause();
        setIsFreezing(true);
        animateZoomTo(freezeSpotlight.x, freezeSpotlight.y, focusZoom, 250);
        freezeTimerRef.current = setTimeout(() => {
          freezeTimerRef.current = null;
          setIsFreezing(false);
          v.play().catch(() => {});
        }, FREEZE_HOLD_MS);
      }
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", () => setPaused(false));
    v.addEventListener("pause", () => setPaused(true));
    return () => {
      v.removeEventListener("timeupdate", onTime);
    };
  }, [index, clip, goNext, passedDuration, totalDuration, animateZoomTo, focusZoom, hasFocusTarget, spotlight, trackingPoints]);

  useEffect(() => {
    if (!activeSpotlight || !hasFocusTarget || isFreezing) return;
    syncZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom);
  }, [activeSpotlight, focusZoom, hasFocusTarget, isFreezing, syncZoomTo]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const effects = clip?.effects;

  const videoTransform = zoom > 1
    ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`
    : undefined;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 인트로 카드 오버레이 */}
      {showIntro && introData && (
        <div className="absolute inset-0 z-30">
          <IntroCard data={introData} />
        </div>
      )}

      {/* 닫기 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <span className="text-[11px] font-semibold text-white/70">{index + 1} / {clips.length}</span>
        </div>
      </div>

      {/* 전체 진행 바 */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full" style={{ width: `${totalProgress * 100}%`, background: "#D4A853", transition: "width 0.1s linear" }} />
      </div>

      {/* 비디오 */}
      <div className="relative flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          style={{
            opacity: fading ? 0 : 1,
            transition: fading ? "opacity 0.5s" : "none",
            transform: videoTransform,
            transformOrigin: "center center",
          }}
        />

        {/* 스포트라이트 오버레이 */}
        {adjustedSpotlight && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: videoTransform,
              transformOrigin: "center center",
            }}
          >
            <VideoOverlay
              spotlight={adjustedSpotlight}
              player={{ name: "" }}
              effects={effects ?? undefined}
              hideNametag
              freezeMode={isFreezing}
              zoomLevel={zoom}
            />
          </div>
        )}

        {/* 재생/일시정지 탭 */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          {paused && (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
