"use client";

import { useRef, useState, useCallback, useEffect, useMemo, type ChangeEvent } from "react";
import { clampPan, computeVideoRect, screenToVideo } from "@/lib/spotlight-math";

interface PinchZoomVideoProps {
  videoSrc: string;
  currentTime: number;
  minTime?: number;
  maxTime?: number;
  onTimeChange?: (time: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** 줌/패닝 상태 변경 시 호출 (DecorateView에서 "이대로 설정" 버튼 활성화에 사용) */
  onZoomChange?: (zoom: number, pan: { x: number; y: number }) => void;
  /** 영상 위를 직접 눌러 선수 좌표를 지정할 때 사용 */
  onTapSpotlight?: (spot: { x: number; y: number }) => void;
  /** 재생 중 탭으로 선수를 지정할 때 현재 프레임에서 일시정지 */
  pauseOnSpotlightTap?: boolean;
  /** 현재 선택된 선수 좌표 표시 */
  selectedSpotlight?: { x: number; y: number } | null;
  /** 재생 컨트롤 표시 */
  enablePlaybackControls?: boolean;
  /** 재생 컨트롤 위치 */
  playbackControlsPosition?: "overlay" | "below";
  /** 최대 높이 (기본값: "60vh") */
  maxHeight?: string;
  testId?: string;
}

const MAX_ZOOM = 5;
const MIN_ZOOM = 1;

export default function PinchZoomVideo({
  videoSrc,
  currentTime,
  minTime = 0,
  maxTime,
  onTimeChange,
  onPlayingChange,
  onZoomChange,
  onTapSpotlight,
  pauseOnSpotlightTap = false,
  selectedSpotlight,
  enablePlaybackControls = false,
  playbackControlsPosition = "overlay",
  maxHeight = "60vh",
  testId,
}: PinchZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const suppressClickRef = useRef(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  // Touch tracking
  const touchState = useRef<{
    type: "none" | "pan" | "pinch";
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startZoom: number;
    startDist: number;
    pinchMidX: number;
    pinchMidY: number;
    lastTapTime: number;
    moved: boolean;
  }>({
    type: "none",
    startX: 0, startY: 0,
    startPanX: 0, startPanY: 0,
    startZoom: 1, startDist: 0,
    pinchMidX: 0, pinchMidY: 0,
    lastTapTime: 0, moved: false,
  });

  // Track video dimensions
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v && v.videoWidth && v.videoHeight) {
      setVideoDims({ w: v.videoWidth, h: v.videoHeight });
      setVideoDuration(v.duration || 0);
    }
  }, []);

  // Sync video time
  useEffect(() => {
    const v = videoRef.current;
    if (v && (v.paused || !enablePlaybackControls) && Math.abs(v.currentTime - currentTime) > 0.05) {
      v.currentTime = currentTime;
    }
  }, [currentTime, enablePlaybackControls]);

  // ResizeObserver for container size tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Dynamic aspect ratio from video
  const containerAspect = useMemo(() => {
    if (!videoDims) return "16/9";
    return `${videoDims.w}/${videoDims.h}`;
  }, [videoDims]);

  // 컨테이너 내 실제 영상 렌더링 영역 계산 (object-contain 보정)
  const getVideoRect = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return null;

    const cRect = container.getBoundingClientRect();
    const cW = cRect.width;
    const cH = cRect.height;
    const vW = video?.videoWidth || cW;
    const vH = video?.videoHeight || cH;
    const rect = computeVideoRect({
      containerW: cW,
      containerH: cH,
      videoW: vW,
      videoH: vH,
    });

    return {
      ...rect,
      renderW: rect.displayW,
      renderH: rect.displayH,
      cRect,
      cW,
      cH,
      vW,
      vH,
    };
  }, []);

  const getTouchDist = (e: React.TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const getTouchMid = (e: React.TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  };

  const handleSpotlightTap = useCallback((spot: { x: number; y: number }) => {
    const video = videoRef.current;
    if (pauseOnSpotlightTap && video && !video.paused) {
      video.pause();
      onTimeChange?.(video.currentTime);
    }
    onTapSpotlight?.(spot);
  }, [onTapSpotlight, onTimeChange, pauseOnSpotlightTap]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playbackEnd = maxTime ?? video.duration ?? videoDuration;
      if (playbackEnd > 0 && video.currentTime >= playbackEnd - 0.05) {
        video.currentTime = minTime;
        onTimeChange?.(minTime);
      } else if (video.currentTime < minTime) {
        video.currentTime = minTime;
        onTimeChange?.(minTime);
      }
      video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [maxTime, minTime, onTimeChange, videoDuration]);

  const handlePlaybackPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    togglePlayback();
  }, [togglePlayback]);

  const playbackEnd = maxTime ?? videoDuration;
  const playbackDuration = Math.max(0, playbackEnd - minTime);
  const visibleCurrentTime = Math.max(0, Math.min(currentTime, playbackEnd || currentTime) - minTime);
  const seekRatio = playbackDuration > 0
    ? Math.max(0, Math.min(1, visibleCurrentTime / playbackDuration))
    : 0;
  const controlsBelowVideo = enablePlaybackControls && playbackControlsPosition === "below";

  const seekTo = useCallback((nextTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const playbackStart = minTime;
    const playbackEnd = maxTime ?? video.duration ?? videoDuration;
    const clamped = Math.max(playbackStart, Math.min(playbackEnd, nextTime));
    video.currentTime = clamped;
    onTimeChange?.(clamped);
  }, [maxTime, minTime, onTimeChange, videoDuration]);

  const handleSeekRatio = useCallback((ratio: number) => {
    if (playbackDuration <= 0) return;
    seekTo(minTime + playbackDuration * Math.max(0, Math.min(1, ratio)));
  }, [minTime, playbackDuration, seekTo]);

  const handleSeekInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const ratio = Number(e.target.value) / 1000;
    handleSeekRatio(ratio);
  }, [handleSeekRatio]);

  const handleStepTime = useCallback((delta: number) => (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    seekTo(currentTime + delta);
  }, [currentTime, seekTo]);

  // zoom/pan 변경 후 상위에 알림
  const updateZoom = useCallback((newZoom: number, newPan: { x: number; y: number }) => {
    setZoom(newZoom);
    setPan(newPan);
    queueMicrotask(() => {
      onZoomChange?.(newZoom, newPan);
    });
  }, [onZoomChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (e.touches.length === 2) {
      ts.type = "pinch";
      ts.startDist = getTouchDist(e);
      ts.startZoom = zoom;
      ts.startPanX = pan.x;
      ts.startPanY = pan.y;
      const mid = getTouchMid(e);
      ts.pinchMidX = mid.x;
      ts.pinchMidY = mid.y;
      ts.moved = true;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      ts.startX = t.clientX;
      ts.startY = t.clientY;
      ts.startPanX = pan.x;
      ts.startPanY = pan.y;
      ts.moved = false;
      ts.type = zoom > 1 ? "pan" : "none";
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (ts.type === "pinch" && e.touches.length === 2) {
      const dist = getTouchDist(e);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ts.startZoom * (dist / ts.startDist)));

      const vr = getVideoRect();
      if (vr) {
        const { renderW, renderH, offsetX, offsetY, cRect } = vr;
        // 핀치 시작점 기준으로 포컬 포인트 유지
        const midRelX = (ts.pinchMidX - cRect.left - offsetX) / renderW;
        const midRelY = (ts.pinchMidY - cRect.top - offsetY) / renderH;
        const zoomRatio = newZoom / ts.startZoom;
        const newPanX = ts.startPanX + (midRelX - 0.5) * (1 - 1 / zoomRatio) * 100 / newZoom;
        const newPanY = ts.startPanY + (midRelY - 0.5) * (1 - 1 / zoomRatio) * 100 / newZoom;

        // 손가락 이동에 따른 추가 패닝
        const mid = getTouchMid(e);
        const dragPanX = ((mid.x - ts.pinchMidX) / renderW) * 100 / newZoom;
        const dragPanY = ((mid.y - ts.pinchMidY) / renderH) * 100 / newZoom;

        if (newZoom <= 1.05) {
          updateZoom(1, { x: 0, y: 0 });
        } else {
          const clamped = clampPan(newPanX + dragPanX, newPanY + dragPanY, newZoom);
          updateZoom(newZoom, clamped);
        }
      } else {
        if (newZoom <= 1.05) updateZoom(1, { x: 0, y: 0 });
        else updateZoom(newZoom, clampPan(ts.startPanX, ts.startPanY, newZoom));
      }
    } else if (ts.type === "pan" && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - ts.startX;
      const dy = t.clientY - ts.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ts.moved = true;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPan = clampPan(
        ts.startPanX + (dx / rect.width) * 100,
        ts.startPanY + (dy / rect.height) * 100,
        zoom,
      );
      updateZoom(zoom, newPan);
    } else if (ts.type === "none" && e.touches.length === 1) {
      const t = e.touches[0];
      if (Math.abs(t.clientX - ts.startX) > 8 || Math.abs(t.clientY - ts.startY) > 8) {
        ts.moved = true;
      }
    }
  }, [zoom, updateZoom, getVideoRect]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    // 더블탭 → zoom 리셋
    if (!ts.moved && ts.type !== "pinch") {
      const now = Date.now();
      if (now - ts.lastTapTime < 300) {
        updateZoom(1, { x: 0, y: 0 });
        ts.lastTapTime = 0;
      } else {
        ts.lastTapTime = now;
        if (onTapSpotlight && e.changedTouches.length === 1) {
          const vr = getVideoRect();
          if (vr) {
            const point = screenToVideo(
              e.changedTouches[0].clientX,
              e.changedTouches[0].clientY,
              vr.cRect,
              {
                containerW: vr.cW,
                containerH: vr.cH,
                videoW: vr.vW,
                videoH: vr.vH,
              },
              zoom,
              pan,
            );
            if (point) {
              suppressClickRef.current = true;
              handleSpotlightTap(point);
            }
          }
        }
      }
    }

    ts.type = "none";
    ts.moved = false;
  }, [getVideoRect, handleSpotlightTap, onTapSpotlight, pan, updateZoom, zoom]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!onTapSpotlight) return;
    const vr = getVideoRect();
    if (!vr) return;
    const point = screenToVideo(
      e.clientX,
      e.clientY,
      vr.cRect,
      {
        containerW: vr.cW,
        containerH: vr.cH,
        videoW: vr.vW,
        videoH: vr.vH,
      },
      zoom,
      pan,
    );
    if (point) handleSpotlightTap(point);
  }, [getVideoRect, handleSpotlightTap, onTapSpotlight, pan, zoom]);

  const spotlightStyle = useMemo(() => {
    if (!selectedSpotlight || !containerSize || !videoDims) return null;
    const rect = computeVideoRect({
      containerW: containerSize.w,
      containerH: containerSize.h,
      videoW: videoDims.w,
      videoH: videoDims.h,
    });
    const baseX = rect.offsetX + selectedSpotlight.x * rect.displayW;
    const baseY = rect.offsetY + selectedSpotlight.y * rect.displayH;
    return {
      left: containerSize.w / 2 + (baseX - containerSize.w / 2) * zoom + (pan.x / 100) * containerSize.w,
      top: containerSize.h / 2 + (baseY - containerSize.h / 2) * zoom + (pan.y / 100) * containerSize.h,
    };
  }, [containerSize, pan, selectedSpotlight, videoDims, zoom]);

  // Zoom button handlers
  const handleZoomIn = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = Math.min(MAX_ZOOM, parseFloat((zoom + 0.5).toFixed(1)));
    const newPan = clampPan(pan.x, pan.y, next);
    updateZoom(next, newPan);
  }, [pan, updateZoom, zoom]);

  const handleZoomReset = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updateZoom(1, { x: 0, y: 0 });
  }, [updateZoom]);

  const handleZoomOut = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = Math.max(MIN_ZOOM, parseFloat((zoom - 0.5).toFixed(1)));
    if (next <= 1) {
      updateZoom(1, { x: 0, y: 0 });
      return;
    }
    const newPan = clampPan(pan.x, pan.y, next);
    updateZoom(next, newPan);
  }, [pan, updateZoom, zoom]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const playbackEnd = maxTime ?? video.duration ?? videoDuration;
    if (playbackEnd > 0 && video.currentTime >= playbackEnd) {
      video.currentTime = playbackEnd;
      onTimeChange?.(playbackEnd);
      video.pause();
      return;
    }

    onTimeChange?.(video.currentTime);
  }, [maxTime, onTimeChange, videoDuration]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlayingChange?.(true);
  }, [onPlayingChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

  const controlsContent = enablePlaybackControls ? (
    <>
      <div
        className={controlsBelowVideo
          ? "pointer-events-auto rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3"
          : "pointer-events-none rounded-xl px-2.5 py-2.5"}
        style={controlsBelowVideo
          ? undefined
          : { background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 active:scale-90"
            onTouchEnd={handleStepTime(-0.2)}
            onClick={handleStepTime(-0.2)}
            aria-label="0.2초 뒤로"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17L6 12l5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(seekRatio * 1000)}
            onChange={handleSeekInput}
            className="h-2 w-full cursor-pointer accent-accent"
            aria-label="재생 위치 이동"
          />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 active:scale-90"
            onTouchEnd={handleStepTime(0.2)}
            onClick={handleStepTime(0.2)}
            aria-label="0.2초 앞으로"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" />
            </svg>
          </button>
        </div>
      </div>
      <div className={controlsBelowVideo ? "mt-2 flex items-center justify-end gap-1.5" : "absolute bottom-2.5 right-2.5 flex items-center gap-1.5"}>
        <button
          type="button"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/85 active:scale-90"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onTouchEnd={handlePlaybackPress}
          onClick={handlePlaybackPress}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div
          className="pointer-events-none rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/80"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          {formatTime(visibleCurrentTime)} / {formatTime(playbackDuration)}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl bg-black"
        style={{
          aspectRatio: containerAspect,
          maxHeight,
          touchAction: "none",
        }}
        data-testid={testId}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
      {/* 영상 */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={enablePlaybackControls ? handleVideoTimeUpdate : undefined}
        onPlay={handlePlay}
        onPause={handlePause}
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
          transformOrigin: "center center",
          transition: zoom === 1 ? "transform 0.2s ease-out" : undefined,
        }}
      />

      {/* 뷰파인더 오버레이: zoom > 1일 때 "이 영역이 재생됩니다" 표시 */}
      {zoom > 1 && (
        <div className="pointer-events-none absolute inset-0">
          {/* 골드 모서리 마크 */}
          {[
            { top: 12, left: 12, rotate: "0deg" },
            { top: 12, right: 12, rotate: "90deg" },
            { bottom: 12, right: 12, rotate: "180deg" },
            { bottom: 12, left: 12, rotate: "270deg" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                ...pos,
                width: 20,
                height: 20,
                transform: `rotate(${pos.rotate})`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 18 L2 2 L18 2" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
          {/* 안내 라벨 */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-accent"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(212,168,83,0.3)",
            }}
          >
            재생 시 이 구도로 확대됩니다
          </div>
        </div>
      )}

      {/* 확대 전 안내 힌트 */}
      {zoom === 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] text-white/60"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
            선수를 직접 누르거나 확대해서 미세 조정하세요
          </div>
        </div>
      )}

      {spotlightStyle && (
        <div
          className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2"
          style={spotlightStyle}
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-accent/70 bg-accent/15 shadow-[0_0_24px_rgba(212,168,83,0.25)]">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <div className="absolute inset-0 rounded-full border border-accent/40" />
          </div>
        </div>
      )}

      {!controlsBelowVideo && controlsContent}

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 active:scale-90 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onTouchEnd={handleZoomOut}
          onClick={handleZoomOut}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </button>
        <button
          className="flex h-8 min-w-[44px] items-center justify-center rounded-full px-2 text-[12px] font-bold tabular-nums text-white/90 active:scale-90 pointer-events-auto"
          style={{
            background: zoom > 1 ? "rgba(212,168,83,0.25)" : "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            border: zoom > 1 ? "1px solid rgba(212,168,83,0.4)" : "none",
            color: zoom > 1 ? "#D4A853" : "rgba(255,255,255,0.9)",
          }}
          onTouchEnd={handleZoomReset}
          onClick={handleZoomReset}
        >
          {zoom.toFixed(1)}x
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 active:scale-90 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onTouchEnd={handleZoomIn}
          onClick={handleZoomIn}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      </div>
      {controlsBelowVideo && <div className="mt-3">{controlsContent}</div>}
    </div>
  );
}

function formatTime(value: number) {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  const minute = Math.floor(safe / 60);
  const second = Math.floor(safe % 60);
  return `${minute}:${second.toString().padStart(2, "0")}`;
}
