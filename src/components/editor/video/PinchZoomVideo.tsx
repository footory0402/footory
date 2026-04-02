"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";

interface PinchZoomVideoProps {
  videoSrc: string;
  currentTime: number;
  /** 마커 위치 (0-1 normalized) */
  markerX?: number;
  markerY?: number;
  /** 영상 위 탭 시 좌표 전달 (0-1 normalized, 줌 보정된 원본 좌표) */
  onTap: (x: number, y: number) => void;
  /** 마커 드래그 종료 시 좌표 전달 */
  onMarkerDrag?: (x: number, y: number) => void;
  /** 마커 삭제 */
  onMarkerClear?: () => void;
  /** 최대 높이 (기본값: "60vh") */
  maxHeight?: string;
}

const MAX_ZOOM = 5;
const MIN_ZOOM = 1;

export default function PinchZoomVideo({
  videoSrc,
  currentTime,
  markerX,
  markerY,
  onTap,
  onMarkerDrag,
  onMarkerClear,
  maxHeight = "60vh",
}: PinchZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);

  // Touch tracking
  const touchState = useRef<{
    type: "none" | "pan" | "pinch" | "marker-drag";
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
    }
  }, []);

  // Sync video time
  useEffect(() => {
    const v = videoRef.current;
    if (v && Math.abs(v.currentTime - currentTime) > 0.05) {
      v.currentTime = currentTime;
    }
  }, [currentTime]);

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
    if (!videoDims) return "16/9"; // fallback before metadata
    return `${videoDims.w}/${videoDims.h}`;
  }, [videoDims]);

  /** 컨테이너 내 실제 영상 렌더링 영역 계산 (object-contain 보정) */
  const getVideoRect = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return null;

    const cRect = container.getBoundingClientRect();
    const cW = cRect.width;
    const cH = cRect.height;
    const vW = video?.videoWidth || cW;
    const vH = video?.videoHeight || cH;

    const containerAR = cW / cH;
    const videoAR = vW / vH;

    let renderW: number, renderH: number, offsetX: number, offsetY: number;

    if (videoAR > containerAR) {
      renderW = cW;
      renderH = cW / videoAR;
      offsetX = 0;
      offsetY = (cH - renderH) / 2;
    } else {
      renderH = cH;
      renderW = cH * videoAR;
      offsetX = (cW - renderW) / 2;
      offsetY = 0;
    }

    return { renderW, renderH, offsetX, offsetY, cRect };
  }, []);

  const clampPan = useCallback((px: number, py: number, z: number) => {
    const maxPan = ((z - 1) / z) * 50;
    return {
      x: Math.max(-maxPan, Math.min(maxPan, px)),
      y: Math.max(-maxPan, Math.min(maxPan, py)),
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

  /** 화면 터치 좌표 → 원본 영상 좌표 (0-1) */
  const screenToVideo = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const vr = getVideoRect();
    if (!vr) return null;
    const { renderW, renderH, offsetX, offsetY, cRect } = vr;

    // 실제 영상 렌더 영역 기준 상대 좌표 (0-1)
    const relX = (clientX - cRect.left - offsetX) / renderW;
    const relY = (clientY - cRect.top - offsetY) / renderH;

    // 줌 + 패닝 보정: 화면 좌표 → 원본 좌표
    const videoX = (relX - 0.5) / zoom - pan.x / 100 + 0.5;
    const videoY = (relY - 0.5) / zoom - pan.y / 100 + 0.5;

    if (videoX < 0 || videoX > 1 || videoY < 0 || videoY > 1) return null;
    return { x: videoX, y: videoY };
  }, [zoom, pan, getVideoRect]);

  /** 마커의 화면 좌표 계산 (컨테이너 기준 px) */
  const getMarkerScreenPos = useCallback(() => {
    if (markerX == null || markerY == null) return null;
    const vr = getVideoRect();
    if (!vr) return null;
    const { renderW, renderH, offsetX, offsetY } = vr;

    const sx = offsetX + ((markerX - 0.5 + pan.x / 100) * zoom + 0.5) * renderW;
    const sy = offsetY + ((markerY - 0.5 + pan.y / 100) * zoom + 0.5) * renderH;

    return { left: sx, top: sy };
  }, [markerX, markerY, zoom, pan, getVideoRect]);

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

      // Check if touching existing marker for drag
      if (markerX != null && markerY != null) {
        const mPos = getMarkerScreenPos();
        if (mPos) {
          const container = containerRef.current;
          if (container) {
            const cRect = container.getBoundingClientRect();
            const mx = cRect.left + mPos.left;
            const my = cRect.top + mPos.top;
            const dist = Math.hypot(t.clientX - mx, t.clientY - my);
            if (dist < 40) {
              ts.type = "marker-drag";
              return;
            }
          }
        }
      }

      ts.type = zoom > 1 ? "pan" : "none";
    }
  }, [zoom, pan, markerX, markerY, getMarkerScreenPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (ts.type === "pinch" && e.touches.length === 2) {
      const dist = getTouchDist(e);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ts.startZoom * (dist / ts.startDist)));

      // Focal point zoom: keep pinch midpoint fixed
      const mid = getTouchMid(e);
      const vr = getVideoRect();
      if (vr) {
        const { renderW, renderH, offsetX, offsetY, cRect } = vr;
        // Pinch 시작 시 중심점의 영상 내 상대 좌표
        const midRelX = (ts.pinchMidX - cRect.left - offsetX) / renderW;
        const midRelY = (ts.pinchMidY - cRect.top - offsetY) / renderH;

        // 줌 변화에 따른 팬 보정 (포컬 포인트 유지)
        const zoomRatio = newZoom / ts.startZoom;
        const newPanX = ts.startPanX + (midRelX - 0.5) * (1 - 1 / zoomRatio) * 100 / newZoom;
        const newPanY = ts.startPanY + (midRelY - 0.5) * (1 - 1 / zoomRatio) * 100 / newZoom;

        // 손가락 이동에 따른 팬 추가
        const dragPanX = ((mid.x - ts.pinchMidX) / renderW) * 100 / newZoom;
        const dragPanY = ((mid.y - ts.pinchMidY) / renderH) * 100 / newZoom;

        const clamped = clampPan(newPanX + dragPanX, newPanY + dragPanY, newZoom);
        setPan(clamped);
      }

      setZoom(newZoom);
      if (newZoom <= 1.05) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
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
      setPan(newPan);
    } else if (ts.type === "marker-drag" && e.touches.length === 1) {
      ts.moved = true;
      const t = e.touches[0];
      const pos = screenToVideo(t.clientX, t.clientY);
      if (pos) onMarkerDrag?.(pos.x, pos.y);
    } else if (ts.type === "none" && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - ts.startX;
      const dy = t.clientY - ts.startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) ts.moved = true;
    }
  }, [zoom, clampPan, screenToVideo, onMarkerDrag, getVideoRect]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (!ts.moved && ts.type !== "pinch") {
      const now = Date.now();
      if (now - ts.lastTapTime < 300) {
        // Double tap → reset zoom
        setZoom(1);
        setPan({ x: 0, y: 0 });
        ts.lastTapTime = 0;
      } else {
        ts.lastTapTime = now;
        // Single tap → set marker
        const pos = screenToVideo(ts.startX, ts.startY);
        if (pos) onTap(pos.x, pos.y);
      }
    }

    ts.type = "none";
    ts.moved = false;
  }, [screenToVideo, onTap]);

  // Zoom button handlers
  const handleZoomIn = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, z + 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleZoomReset = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomOut = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z - 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const hasMarker = markerX != null && markerY != null;

  // Marker screen position (recalculated on zoom/pan/containerSize changes)
  const markerPos = useMemo(() => {
    if (!hasMarker) return null;
    // containerSize dependency triggers recalc on resize
    void containerSize;
    return getMarkerScreenPos();
  }, [hasMarker, getMarkerScreenPos, containerSize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black rounded-xl"
      style={{
        aspectRatio: containerAspect,
        maxHeight,
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video frame (paused) */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`,
          transformOrigin: "center center",
          transition: zoom === 1 ? "transform 0.2s ease-out" : undefined,
        }}
      />

      {/* Broadcast-style marker */}
      {hasMarker && markerPos && (
        <div
          className="absolute"
          style={{
            left: markerPos.left,
            top: markerPos.top,
            pointerEvents: "none",
          }}
        >
          {/* 원형 하이라이트 */}
          <div
            style={{
              position: "absolute",
              width: 72,
              height: 72,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(212,168,83,0.2) 0%, rgba(212,168,83,0.06) 55%, transparent 75%)",
              animation: "broadcast-circle-in 0.25s ease-out forwards",
            }}
          />
          {/* 삼각형 마커 */}
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, calc(-100% - 6px))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "broadcast-drop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            {/* 컴팩트 라벨 */}
            <div
              style={{
                background: "rgba(10,10,14,0.88)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(212,168,83,0.35)",
                borderRadius: 16,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: "#FAFAFA",
                marginBottom: 4,
                whiteSpace: "nowrap",
              }}
            >
              선수 위치
            </div>
            <svg width="20" height="12" viewBox="0 0 20 12"
              style={{ filter: "drop-shadow(0 0 5px rgba(212,168,83,0.7))" }}
            >
              <polygon points="10,12 0,0 20,0" fill="#D4A853" />
            </svg>
          </div>
          {/* X 삭제 버튼 (pointer-events 복원) */}
          <button
            className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/70 active:text-red-400"
            style={{
              top: -36,
              left: 14,
              border: "1px solid rgba(255,255,255,0.15)",
              pointerEvents: "auto",
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onMarkerClear?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClear?.();
            }}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Zoom controls (Instagram style) */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold text-white/80 active:scale-90 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onTouchEnd={handleZoomOut}
          onClick={handleZoomOut}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </button>
        <button
          className="flex h-8 min-w-[40px] items-center justify-center rounded-full px-2 text-[12px] font-stat font-bold tabular-nums text-white/90 active:scale-90 pointer-events-auto"
          style={{ background: zoom > 1 ? "rgba(212,168,83,0.3)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", border: zoom > 1 ? "1px solid rgba(212,168,83,0.4)" : "none" }}
          onTouchEnd={handleZoomReset}
          onClick={handleZoomReset}
        >
          {zoom.toFixed(1)}x
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold text-white/80 active:scale-90 pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onTouchEnd={handleZoomIn}
          onClick={handleZoomIn}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Tap hint (no marker set) */}
      {!hasMarker && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] text-white/60"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          >
            <svg className="h-4 w-4 text-accent/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            탭하여 선수 위치 표시
          </div>
        </div>
      )}
    </div>
  );
}
