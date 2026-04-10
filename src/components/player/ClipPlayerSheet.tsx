"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";
import type { HudPlayerData } from "@/components/video/hud/types";
import { DEFAULT_HUD_CONFIG } from "@/components/video/hud/types";
import dynamic from "next/dynamic";
import { useBackClose } from "@/hooks/useBackClose";
import { useSpotlightZoom } from "@/hooks/useSpotlightZoom";
import ClipActionsSheet from "@/components/player/ClipActionsSheet";
import { clampPan } from "@/lib/spotlight-math";
import { resolveFocusZoom } from "@/lib/focus-zoom";
import type { PlaybackEffects } from "@/lib/playback-focus";
import { hasPlaybackFocus, resolvePlaybackSpotlight, sanitizeTrackingPoints } from "@/lib/playback-focus";
import {
  resolveSingleClipPlaybackWindow,
  type SingleClipPlaybackContract,
} from "@/lib/single-clip-playback";
import {
  buildFallbackHudPlayerData,
  buildHudPlayerData,
  getCachedPlayerCard,
  preloadPlayerCard,
} from "@/lib/player-card-client";

const IntroCard = dynamic(() => import("@/components/video/hud/IntroCard"), { ssr: false });
const HudOverlay = dynamic(() => import("@/components/video/hud/HudOverlay"), { ssr: false });

function getVideoErrorMessage(code: number): { message: string; retryable: boolean } {
  switch (code) {
    case 2: return { message: "네트워크 오류로 영상을 불러올 수 없습니다", retryable: true };
    case 3: return { message: "영상 파일이 손상되어 재생할 수 없습니다", retryable: false };
    case 4: return { message: "지원하지 않는 영상 형식입니다", retryable: true };
    default: return { message: "영상을 불러올 수 없습니다", retryable: true };
  }
}

export interface PlayableClip extends SingleClipPlaybackContract {
  effects?: PlaybackEffects | null;
}

interface ClipPlayerSheetProps {
  clips: PlayableClip[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
  onHighlightEdit?: (clipId: string) => void;
}

export default function ClipPlayerSheet({
  clips: clipsProp,
  initialIndex = 0,
  onClose,
  onDelete,
  onEditTags,
  onShare,
  onHighlightEdit,
}: ClipPlayerSheetProps) {
  const INTRO_BLOCK_TIMEOUT_MS = 250;
  const INTRO_DURATION_MS = 1400;
  const FREEZE_HOLD_MS = 1500;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localClips, setLocalClips] = useState(clipsProp);
  const [index, setIndex] = useState(initialIndex);
  const clips = localClips;

  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [playCount, setPlayCount] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // 위아래 스와이프
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null; startPanX: number; startPanY: number } | null>(null);

  // 핀치 줌 (Instagram-style)
  const pinchRef = useRef<{ startDist: number; startZoom: number; startPanX: number; startPanY: number; midX: number; midY: number } | null>(null);
  const lastTapRef = useRef(0);

  // 자동 포커스 모드
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isAutoZoomingRef = useRef(false);

  // View count tracking: 3초 재생 후 1회만 호출
  const viewTrackedRef = useRef<Set<string>>(new Set());
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;
  const effects = clip?.effects ?? null;
  const focusZoom = resolveFocusZoom(effects?.focusZoom);
  const touchHandled = useRef(false);
  const spotlight =
    clip?.spotlightX != null && clip?.spotlightY != null
      ? { x: clip.spotlightX, y: clip.spotlightY }
      : null;
  const trackingPoints = useMemo(
    () => sanitizeTrackingPoints(effects?.trackingPoints),
    [effects?.trackingPoints],
  );
  const activeSpotlight = useMemo(
    () => resolvePlaybackSpotlight({
      spotlight,
      trackingMode: effects?.trackingMode,
      trackingPoints,
      time: (clip?.trimStart ?? 0) + currentTime,
    }),
    [clip?.trimStart, currentTime, effects?.trackingMode, spotlight, trackingPoints],
  );
  const hasFocusTarget = hasPlaybackFocus(spotlight, effects?.trackingMode, trackingPoints);

  // Intro card overlay
  const [showIntro, setShowIntro] = useState(false);
  const [introData, setIntroData] = useState<HudPlayerData | null>(null);
  const introShownRef = useRef<Set<string>>(new Set());
  const introEnabledRef = useRef(false);
  const [introReady, setIntroReady] = useState(true);
  // 영상 실제 해상도 (letterbox 보정에 사용)
  const [videoNativeSize, setVideoNativeSize] = useState<{ w: number; h: number } | null>(null);
  const {
    adjustedSpotlight,
    animateZoomTo: animateSpotlightZoom,
    cancelZoomAnimation,
    pan,
    panRef,
    resetTransform,
    setTransform,
    syncZoomTo,
    zoom,
    zoomRef,
  } = useSpotlightZoom({
    videoRef,
    videoNativeSize,
    spotlight: activeSpotlight,
  });

  // Freeze frame state
  const [isFreezing, setIsFreezing] = useState(false);
  const freezeFiredRef = useRef<Set<string>>(new Set());
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 닫기 애니메이션
  const [closing, setClosing] = useState(false);
  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 250);
  }, [closing, onClose]);

  // 뒤로가기로 영상 플레이어 닫기
  useBackClose(!closing, handleClose);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const playIntro = useCallback((clipId: string) => {
    introShownRef.current.add(clipId);
    setShowIntro(true);
    window.setTimeout(() => {
      setShowIntro(false);
    }, INTRO_DURATION_MS);
  }, []);

  // Load intro card data — 느리면 이번 세션에서는 재생을 막지 않음
  useEffect(() => {
    let cancelled = false;
    const currentClip = clipsProp[initialIndex];
    const canShowIntro = currentClip?.effects?.intro === true;
    const cached = getCachedPlayerCard();
    const fallbackIntro = buildFallbackHudPlayerData(currentClip ?? {});

    if (fallbackIntro) setIntroData(fallbackIntro);

    if (canShowIntro && cached?.card) {
      const cachedData = buildHudPlayerData(cached);
      if (cachedData && currentClip) {
        setIntroData(cachedData);
        introEnabledRef.current = true;
        playIntro(currentClip.id);
      }
    }

    const needsIntroFetchFallback = !(canShowIntro && cached?.card);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex, playIntro, clipsProp]);

  // 인트로 종료 후 영상 재생 시작
  useEffect(() => {
    if (introReady && !showIntro && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introReady, showIntro]);

  // rAF 기반 줌 애니메이션 (targetX/Y: 0-1 정규화된 영상 내 좌표)
  const animateZoomTo = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,
    durationMs: number,
    onDone?: () => void,
  ) => {
    isAutoZoomingRef.current = true;
    animateSpotlightZoom(targetX, targetY, targetZoom, durationMs, () => {
      isAutoZoomingRef.current = false;
      onDone?.();
    });
  }, [animateSpotlightZoom]);

  // Reset on clip change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setEnded(false);
    setVideoError(null);
    setRetryCount(0);
    setShowControls(true);
    setIsFreezing(false);
    setIsFocusMode(hasFocusTarget);
    setVideoNativeSize(null);
    if (freezeTimerRef.current) { clearTimeout(freezeTimerRef.current); freezeTimerRef.current = null; }
    scheduleHide();

    // Show intro for subsequent clips (introData already loaded)
    if (introEnabledRef.current && clip?.effects?.intro === true && introData && clip && !introShownRef.current.has(clip.id)) {
      playIntro(clip.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFocusTarget, index, introData, playIntro, clip]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const currentClip = clips[index];
      const { trimStartSec, trimEndSec, durationSec } = resolveSingleClipPlaybackWindow(
        currentClip ?? { duration: null, trimStart: null, trimEnd: null },
        v.duration,
      );

      // trim 구간 끝 → 정지 (탭하면 처음부터 다시 재생)
      if (trimEndSec > 0 && v.currentTime >= trimEndSec) {
        v.currentTime = trimEndSec;
        v.pause();
        setProgress(1);
        setCurrentTime(durationSec);
        setEnded(true);
        return;
      }

      const elapsed = Math.max(0, v.currentTime - trimStartSec);
      setCurrentTime(elapsed);
      setDuration(durationSec);
      setProgress(durationSec > 0 ? elapsed / durationSec : 0);

      // Freeze frame detection
      if (
        currentClip?.freezeAt != null &&
        hasPlaybackFocus(
          currentClip.spotlightX != null && currentClip.spotlightY != null
            ? { x: currentClip.spotlightX, y: currentClip.spotlightY }
            : null,
          currentClip.effects?.trackingMode,
          sanitizeTrackingPoints(currentClip.effects?.trackingPoints),
        ) &&
        !freezeFiredRef.current.has(currentClip.id) &&
        !v.paused &&
        v.currentTime >= currentClip.freezeAt
      ) {
        const freezeSpotlight = resolvePlaybackSpotlight({
          spotlight: currentClip.spotlightX != null && currentClip.spotlightY != null
            ? { x: currentClip.spotlightX, y: currentClip.spotlightY }
            : null,
          trackingMode: currentClip.effects?.trackingMode,
          trackingPoints: sanitizeTrackingPoints(currentClip.effects?.trackingPoints),
          time: currentClip.freezeAt,
        });
        if (!freezeSpotlight) return;

        freezeFiredRef.current.add(currentClip.id);
        v.pause();
        setIsFreezing(true);
        setIsFocusMode(true);
        animateZoomTo(
          freezeSpotlight.x,
          freezeSpotlight.y,
          resolveFocusZoom(currentClip.effects?.focusZoom),
          250,
        );
        freezeTimerRef.current = setTimeout(() => {
          freezeTimerRef.current = null;
          setIsFreezing(false);
          v.play().catch(() => {});
        }, FREEZE_HOLD_MS);
      }
    };
    const onPlay = () => {
      setPaused(false); setEnded(false); scheduleHide(); setPlayCount((c) => c + 1);
      // View count: 3초 후 API 호출 (클립당 1회)
      const currentClip = clips[index];
      if (currentClip && !viewTrackedRef.current.has(currentClip.id)) {
        if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
        viewTimerRef.current = setTimeout(() => {
          if (!viewTrackedRef.current.has(currentClip.id)) {
            viewTrackedRef.current.add(currentClip.id);
            fetch(`/api/clips/${currentClip.id}/view`, { method: "POST" }).catch(() => {});
          }
        }, 3000);
      }
    };
    const onPause = () => {
      setPaused(true); setShowControls(true);
      // 일시정지 시 타이머 취소 (3초 미달)
      if (viewTimerRef.current) { clearTimeout(viewTimerRef.current); viewTimerRef.current = null; }
    };
    const onLoaded = () => {
      const currentClip = clips[index];
      const { trimStartSec, durationSec } = resolveSingleClipPlaybackWindow(
        currentClip ?? { duration: null, trimStart: null, trimEnd: null },
        v.duration,
      );
      if (trimStartSec > 0) v.currentTime = trimStartSec;
      setDuration(durationSec);
      if (v.videoWidth && v.videoHeight) {
        setVideoNativeSize({ w: v.videoWidth, h: v.videoHeight });
      }
    };
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    const onEnded = () => {
      setEnded(true);
      setPaused(true);
      setShowControls(true);
      setProgress(1);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      if (viewTimerRef.current) { clearTimeout(viewTimerRef.current); viewTimerRef.current = null; }
    };
  }, [scheduleHide, index, animateZoomTo]);

  useEffect(() => {
    if (!clip || !activeSpotlight || !hasFocusTarget || !isFocusMode || isFreezing) return;
    syncZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom);
  }, [activeSpotlight, clip, focusZoom, hasFocusTarget, isFocusMode, isFreezing, syncZoomTo]);

  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    // 프리즈 중에는 탭 무시
    if (isFreezing) return;
    // 영상 끝난 상태 → 처음부터 다시 재생
    if (ended) {
      const currentClip = clips[index];
      const { trimStartSec } = resolveSingleClipPlaybackWindow(
        currentClip ?? { duration: null, trimStart: null, trimEnd: null },
      );
      v.currentTime = trimStartSec;
      setEnded(false);
      setProgress(0);
      setCurrentTime(0);
      v.play().catch(() => {});
      setPaused(false);
      setShowControls(true);
      scheduleHide();
      return;
    }
    if (v.paused) { v.play().catch(() => {}); setPaused(false); setShowControls(true); scheduleHide(); }
    else { v.pause(); setPaused(true); setShowControls(true); }
  }, [scheduleHide, isFreezing, ended, clips, index]);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v || !clip || retryCount >= 3) return;
    setRetryCount((c) => c + 1);
    setVideoError(null);
    const sep = clip.videoUrl.includes("?") ? "&" : "?";
    v.src = `${clip.videoUrl}${sep}t=${Date.now()}`;
    v.load();
  }, [retryCount, clip]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) {
      const { trimStartSec } = resolveSingleClipPlaybackWindow(
        clip ?? { duration: null, trimStart: null, trimEnd: null },
      );
      videoRef.current.currentTime = trimStartSec + ratio * duration;
    }
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // 줌 리셋 (클립 변경 시)
  useEffect(() => {
    isAutoZoomingRef.current = false;
    cancelZoomAnimation();
    resetTransform();
    setIsFocusMode(false);
    pinchRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cancelZoomAnimation, resetTransform]);

  useEffect(() => () => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
  }, []);

  const getTouchDist = (e: React.TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  // 위아래 스와이프 + 핀치 줌 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    // 자동 줌 진행 중 사용자가 터치하면 즉시 취소 (현재 interpolated 값 유지)
    if (isAutoZoomingRef.current) {
      isAutoZoomingRef.current = false;
      cancelZoomAnimation();
    }
    if (e.touches.length === 2) {
      // 핀치 줌 시작 — 진행 중인 스와이프 상태 초기화 (레이스 컨디션 방지)
      pinchRef.current = {
        startDist: getTouchDist(e),
        startZoom: zoom,
        startPanX: pan.x,
        startPanY: pan.y,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      swipeStart.current = null;
      setSwiping(false);
      setSwipeY(0);
      return;
    }
    if (e.touches.length !== 1 || isFreezing) return;
    const t = e.touches[0];
    if (zoom > 1) {
      // 줌 상태에서는 패닝 — 시작 시점 pan 좌표를 저장해 드리프트 방지
      swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: "h", startPanX: pan.x, startPanY: pan.y };
    } else {
      swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null, startPanX: 0, startPanY: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 핀치 줌 진행
    if (pinchRef.current && e.touches.length === 2) {
      if (isAutoZoomingRef.current) return; // 자동 줌 중 핀치 차단
      const dist = getTouchDist(e);
      const newZoom = Math.max(1, Math.min(4, pinchRef.current.startZoom * (dist / pinchRef.current.startDist)));
      setTransform(newZoom, newZoom <= 1 ? { x: 0, y: 0 } : panRef.current);
      if (newZoom <= 1) setIsFocusMode(false);
      return;
    }
    if (!swipeStart.current) return;

    // 줌 상태에서 1손가락 패닝 — 터치 시작 시점의 pan 기준으로 계산해 드리프트 방지
    if (zoom > 1 && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - swipeStart.current.x;
      const dy = t.clientY - swipeStart.current.y;
      // 데드존: 8px 이상 움직여야 패닝 시작 (탭 시 미세 흔들림 방지)
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      const basePanX = pinchRef.current?.startPanX ?? swipeStart.current.startPanX;
      const basePanY = pinchRef.current?.startPanY ?? swipeStart.current.startPanY;
      const newPan = clampPan(
        basePanX + (dx / window.innerWidth) * 100,
        basePanY + (dy / window.innerHeight) * 100,
        zoom,
      );
      setTransform(zoom, newPan);
      return;
    }

    // 줌 없을 때 기존 스와이프
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeStart.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeStart.current.locked = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      } else return;
    }
    if (swipeStart.current.locked === "v") {
      setSwiping(true);
      setSwipeY(dy);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 핀치 줌 끝
    if (pinchRef.current && e.touches.length === 0) {
      if (zoom <= 1.05) resetTransform();
      pinchRef.current = null;
      return;
    }
    if (!swipeStart.current) return;

    // 줌 상태: 탭/더블탭 처리 — swiping 여부와 관계없이 네비게이션 차단 (레이스 컨디션 방지)
    if (zoom > 1) {
      if (swiping) {
        // animateZoomTo가 스와이프 도중 완료되어 zoom>1이 된 경우 — 스와이프 상태만 초기화
        setSwipeY(0);
        setSwiping(false);
      } else {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          resetTransform();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
          handleTap();
        }
      }
      swipeStart.current = null;
      return;
    }

    if (swipeStart.current.locked === "v" && swiping) {
      const elapsed = Date.now() - swipeStart.current.time;
      const velocity = Math.abs(swipeY) / elapsed;
      if (swipeY < -60 || (swipeY < 0 && velocity > 0.3)) {
        if (hasNext) goToClip(index + 1);
      } else if (swipeY > 60 || (swipeY > 0 && velocity > 0.3)) {
        if (velocity > 0.5 && !hasPrev) {
          handleClose();
        } else if (hasPrev) {
          goToClip(index - 1);
        } else if (velocity > 0.5) {
          handleClose();
        }
      }
      setSwipeY(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      // 더블탭: spotlight 있으면 선수 위치 기준, 없으면 1x ↔ 2x 토글
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (zoomRef.current > 1) {
          // 현재 줌 상태 → 1x로 리셋 (easeInOutCubic으로 스윙 방지, 450ms)
          animateZoomTo(0.5, 0.5, 1, 450);
          setIsFocusMode(false);
        } else if (activeSpotlight) {
          // spotlight 있음 → 현재 선수 위치로 2x 줌
          animateZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom, 350);
          setIsFocusMode(true);
        } else {
          // spotlight 없음 → 그냥 2x
          animateZoomTo(0.5, 0.5, focusZoom, 350);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        handleTap();
      }
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 300);
    }
    swipeStart.current = null;
  };

  const handleDeleteConfirmed = useCallback(async (clipId: string): Promise<boolean> => {
    if (!onDelete) return false;
    const ok = await onDelete(clipId);
    if (ok) {
      setShowActions(false);
      const remaining = localClips.filter((c) => c.id !== clipId);
      if (remaining.length === 0) { handleClose(); return true; }
      const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
      setLocalClips(remaining);
      setIndex(nextIndex);
    }
    return ok;
  }, [onDelete, localClips, index, onClose]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!clip?.videoUrl) return null;

  // 스와이프 다운 닫기 판정 (첫 클립에서 아래로 스와이프)
  const isDismissSwipe = swiping && swipeY > 0 && !hasPrev;
  const dismissProgress = isDismissSwipe ? Math.min(swipeY / 300, 1) : 0;

  // HUD 하단 고정 바 높이 (골드라인 2px + 1행 ~62px + 2행 ~39px = ~103px, 여유분 포함)
  const HUD_BAR_HEIGHT = 112;
  // seekbar + 시간 표시 높이 (h-11=44px + 시간22px + 패딩약9px)
  const SEEKBAR_HEIGHT = 75;
  const hasHud = !!introData && introReady && !showIntro && effects?.showLowerThird !== false;

  // 영상과 동일한 transform (zoom/pan/swipe) - overlay가 영상 위치를 따라가도록
  const videoTransform = zoom > 1
    ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`
    : (swiping && !isDismissSwipe)
      ? `translateY(${swipeY * 0.35}px) scale(${1 - Math.min(Math.abs(swipeY) / 800, 0.03)})`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      style={{
        touchAction: "none",
        animation: !swiping
          ? closing
            ? "fullscreen-player-out 0.25s ease-in forwards"
            : "fullscreen-player-in 0.25s ease-out"
          : "none",
        transform: isDismissSwipe
          ? `translateY(${swipeY}px) scale(${1 - dismissProgress * 0.08})`
          : undefined,
        opacity: isDismissSwipe ? 1 - dismissProgress * 0.3 : undefined,
        borderRadius: isDismissSwipe ? `${dismissProgress * 16}px` : undefined,
        transition: !swiping
          ? "transform 0.3s ease-out, opacity 0.3s ease-out, border-radius 0.3s ease-out"
          : "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 블러 배경 (가로 영상 처리) ── */}
      {clip.thumbnailUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${clip.thumbnailUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) brightness(0.35)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* ── 인트로 카드 오버레이 ── */}
      {showIntro && introData && (
        <div
          className="pointer-events-none absolute left-4 right-4 z-[60]"
          style={{
            top: "calc(env(safe-area-inset-top, 16px) + 60px)",
            animation: "fullscreen-player-fade-in 0.35s ease-out",
          }}
        >
          <div className="mx-auto w-full max-w-[360px]">
            <div
              className="rounded-[28px] border px-4 py-4 backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, rgba(7,7,9,0.92) 0%, rgba(18,18,22,0.84) 58%, ${introData.accentColor}22 100%)`,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 18px 40px rgba(0,0,0,0.34), 0 0 24px ${introData.accentColor}14`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-[66px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                  style={{ border: `1px solid ${introData.accentColor}33`, background: "rgba(255,255,255,0.05)" }}
                >
                  {introData.photoUrl && !introData.photoUrl.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={introData.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#09090b]"
                      style={{ background: introData.accentColor }}
                    >
                      {introData.position || "PLAYER"}
                    </span>
                    <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                      {introData.club}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[18px] font-bold text-white">{introData.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/68">
                    {introData.number ? <span>등번호 {introData.number}</span> : null}
                    {introData.birthDate ? <span>{introData.birthDate}년생</span> : null}
                    {introData.height ? <span>{introData.height}cm</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 영상 ── */}
      {!videoError && (
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.videoUrl}
          playsInline
          preload="auto"
          muted={isMuted}
          controlsList="nofullscreen nodownload nopictureinpicture"
          disablePictureInPicture
          poster={clip.thumbnailUrl || undefined}
          className="absolute inset-x-0 top-0 z-10 w-full"
          style={{
            height: hasHud ? `calc(100% - env(safe-area-inset-bottom, 16px) - ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT}px)` : "100%",
            objectFit: "contain",
            opacity: introReady ? 1 : 0,
            transition: zoom === 1 ? "opacity 0.3s ease, transform 0.2s ease-out" : "opacity 0.3s ease",
            transform: zoom > 1
              ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`
              : swiping ? `translateY(${swipeY * 0.2}px)` : undefined,
            transformOrigin: "center center",
          }}
          onClick={(e) => { e.preventDefault(); if (!touchHandled.current) handleTap(); }}
        />
      )}

      {/* ── 축구 중계 스타일 마커 오버레이 ── */}
      {clip.playerName && introReady && !showIntro && adjustedSpotlight && (
        <div
          className="absolute inset-x-0 top-0 z-[45] pointer-events-none"
          style={{
            height: hasHud ? `calc(100% - env(safe-area-inset-bottom, 16px) - ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT}px)` : "100%",
            transform: videoTransform,
            transformOrigin: "center center",
          }}
        >
          <VideoOverlay
            key={clip.id}
            spotlight={adjustedSpotlight}
            player={{
              name: clip.playerName,
              position: clip.playerPosition,
              birthYear: clip.playerBirthYear,
              teamName: clip.teamName,
            }}
            effects={effects}
            hideNametag={!!introData}
            freezeMode={isFreezing}
            zoomLevel={zoom}
          />
        </div>
      )}

      {/* ── HUD 하단 고정 바 — seekbar 위에 위치 (영상→선수정보→시간 순서) ── */}
      {hasHud && (
        <div
          className="absolute inset-x-0 z-[44] pointer-events-none"
          style={{ bottom: `calc(env(safe-area-inset-bottom, 16px) + ${SEEKBAR_HEIGHT}px)` }}
        >
          <HudOverlay
            data={introData!}
            config={{ ...DEFAULT_HUD_CONFIG, goalCount: 0 }}
            mode="docked"
          />
        </div>
      )}

      {/* ── HUD 상단 브랜드 바 — 컨트롤 숨겨질 때만 ── */}
      {hasHud && (
        <div
          className="absolute inset-0 z-[44] pointer-events-none"
          style={{ opacity: !showControls ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <div
            className="absolute inset-x-0 flex items-center justify-center py-2"
            style={{
              top: "calc(env(safe-area-inset-top, 16px) + 44px)",
              background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          >
            <span
              className="text-[12px] font-bold tracking-[5px] text-white/80"
              style={{ fontFamily: "var(--font-brand, 'Rajdhani', sans-serif)" }}
            >
              FOOTORY
            </span>
            <span className="ml-2 text-[9px] tracking-[2px] text-white/30">
              HIGHLIGHT
            </span>
          </div>
        </div>
      )}

      {/* ── 에러 UI ── */}
      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-center text-[13px] text-white/70 px-8">{videoError.message}</p>
          {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
            <button onClick={handleRetry} className="rounded-lg bg-white/10 px-4 py-2 text-[12px] text-white active:bg-white/20">
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* ── 줌 인디케이터 — 좌측 상단 (닫기 버튼 아래) ── */}
      {zoom > 1 && (
        <div
          className="absolute z-50 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white/70 backdrop-blur-sm"
          style={{ top: "calc(env(safe-area-inset-top, 16px) + 60px)", left: "16px" }}
        >
          {zoom.toFixed(1)}x
        </div>
      )}

      {/* ── 일시정지/재시작 오버레이 (프리즈 중에는 숨김) ── */}
      {paused && !isFreezing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/10">
            {ended ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
        </div>
      )}

      {/* ── 버퍼링 스피너 ── */}
      {isBuffering && !paused && !isFreezing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-[3px] border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

      {/* ── 상단 헤더 — 뒤로가기는 항상 표시 ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-2"
        style={{
          background: showControls ? "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" : "none",
          transition: "background 0.3s",
        }}
      >
        <button
          onClick={handleClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-black/70 active:scale-95 transition-transform"
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label="닫기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {clips.length > 1 && (
          <span className="ml-3 font-stat text-[12px] text-white/70" style={{ opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>{index + 1} / {clips.length}</span>
        )}

      </div>

      {/* ── 우측 액션 버튼 — 항상 표시 (TikTok/Reels 스타일) ── */}
      <div className="absolute right-4 z-40 flex flex-col items-center gap-5" style={{
        bottom: hasHud ? `calc(env(safe-area-inset-bottom, 16px) + ${HUD_BAR_HEIGHT + SEEKBAR_HEIGHT + 24}px)` : "128px",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: showControls ? "auto" : "none",
      }}>
        {/* 선수 포커스 토글 */}
        {hasFocusTarget && introReady && (
          <button
            onClick={() => {
              if (isFocusMode || zoom > 1) {
                animateZoomTo(0.5, 0.5, 1, 400);
                setIsFocusMode(false);
              } else if (activeSpotlight) {
                animateZoomTo(activeSpotlight.x, activeSpotlight.y, focusZoom, 400);
                setIsFocusMode(true);
              }
            }}
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm text-white"
              style={{
                background: isFocusMode || zoom > 1 ? "rgba(212,168,83,0.3)" : "rgba(0,0,0,0.40)",
                border: isFocusMode || zoom > 1 ? "1px solid rgba(212,168,83,0.5)" : "1px solid transparent",
              }}
            >
              {isFocusMode || zoom > 1 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <span className="text-[10px]" style={{ color: isFocusMode || zoom > 1 ? "#D4A853" : "rgba(255,255,255,0.6)" }}>
              {isFocusMode || zoom > 1 ? "전체" : "선수"}
            </span>
          </button>
        )}
        {/* 소리 토글 */}
        <button
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
              </svg>
            )}
          </div>
          <span className="text-[10px] text-white/60">{isMuted ? "음소거" : "소리"}</span>
        </button>
        {onShare && (
          <button onClick={() => onShare(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-accent/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">공유</span>
          </button>
        )}
        {onHighlightEdit && (
          <button onClick={() => onHighlightEdit(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-accent active:bg-accent/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <span className="text-[10px] text-accent/80">하이라이트</span>
          </button>
        )}
        {onEditTags && (
          <button onClick={() => onEditTags(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">편집</span>
          </button>
        )}
        {(onDelete || onShare || onEditTags || onHighlightEdit) && (
          <button onClick={() => setShowActions(true)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </div>
            <span className="text-[10px] text-white/60">더보기</span>
          </button>
        )}
      </div>

      {/* ── 하단 정보 + seekbar — 항상 맨 아래 (HUD 없을 때는 화면 최하단) ── */}
      <div
        className="absolute left-0 right-0 z-[45] px-4"
        style={{
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          background: hasHud
            ? "linear-gradient(to top, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.6) 60%, transparent 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* 태그 표시 (선수명은 VideoOverlay 네임태그에서 표시) */}
        {clip.tag && (
          <div className="mb-3 pr-16">
            <p className="text-[12px] text-white/60">{clip.tag}</p>
          </div>
        )}

        {/* Seekbar — 터치 영역 44px, thumb 16px */}
        <div
          className="relative h-11 flex items-center cursor-pointer mb-0.5"
          onClick={handleSeek}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => { e.stopPropagation(); handleSeek(e); }}
        >
          <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute h-4 w-4 rounded-full bg-accent shadow-[0_0_6px_rgba(212,168,83,0.4)]"
            style={{ left: `calc(${progress * 100}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between font-stat text-[13px] text-white/60 pb-1">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── 클립 액션 시트 ── */}
      {showActions && clip && (
        <ClipActionsSheet
          clipId={clip.id}
          onClose={() => setShowActions(false)}
          onDelete={handleDeleteConfirmed}
          onShare={onShare}
          onEditTags={onEditTags}
          onHighlightEdit={onHighlightEdit}
        />
      )}

      {/* ── 클립 도트 ── */}
      {clips.length > 1 && clips.length <= 12 && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5"
        >
          {clips.map((_, i) => (
            <button
              key={i}
              onClick={() => goToClip(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? "h-5 w-1.5 bg-accent"
                  : "h-1.5 w-1.5 bg-white/30 active:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
