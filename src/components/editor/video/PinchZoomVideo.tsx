"use client";

import { useRef, useState, useCallback, useEffect } from "react";

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
}

export default function PinchZoomVideo({
  videoSrc,
  currentTime,
  markerX,
  markerY,
  onTap,
  onMarkerDrag,
  onMarkerClear,
}: PinchZoomVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Touch tracking
  const touchState = useRef<{
    type: "none" | "pan" | "pinch" | "marker-drag";
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startZoom: number;
    startDist: number;
    lastTapTime: number;
    moved: boolean;
  }>({
    type: "none",
    startX: 0, startY: 0,
    startPanX: 0, startPanY: 0,
    startZoom: 1, startDist: 0,
    lastTapTime: 0, moved: false,
  });

  // Sync video time
  useEffect(() => {
    const v = videoRef.current;
    if (v && Math.abs(v.currentTime - currentTime) > 0.05) {
      v.currentTime = currentTime;
    }
  }, [currentTime]);

  const clampPan = useCallback((px: number, py: number, z: number) => {
    const maxPan = ((z - 1) / z) * 50; // percent-based clamping
    return {
      x: Math.max(-maxPan, Math.min(maxPan, px)),
      y: Math.max(-maxPan, Math.min(maxPan, py)),
    };
  }, []);

  const getTouchDist = (e: React.TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  /** 화면 터치 좌표 → 원본 영상 좌표 (0-1) */
  const screenToVideo = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();

    // Container 내 상대 좌표 (0-1)
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    // 줌 + 패닝 보정: 화면 좌표 → 원본 좌표
    // transform: scale(zoom) translate(pan.x%, pan.y%) 의 역변환
    const videoX = (relX - 0.5) / zoom - pan.x / 100 + 0.5;
    const videoY = (relY - 0.5) / zoom - pan.y / 100 + 0.5;

    if (videoX < 0 || videoX > 1 || videoY < 0 || videoY > 1) return null;
    return { x: videoX, y: videoY };
  }, [zoom, pan]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (e.touches.length === 2) {
      // Pinch start
      ts.type = "pinch";
      ts.startDist = getTouchDist(e);
      ts.startZoom = zoom;
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
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          // Marker screen position
          const mx = ((markerX - 0.5 + pan.x / 100) * zoom + 0.5) * rect.width + rect.left;
          const my = ((markerY - 0.5 + pan.y / 100) * zoom + 0.5) * rect.height + rect.top;
          const dist = Math.hypot(t.clientX - mx, t.clientY - my);
          if (dist < 40) {
            ts.type = "marker-drag";
            return;
          }
        }
      }

      ts.type = zoom > 1 ? "pan" : "none";
    }
  }, [zoom, pan, markerX, markerY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const ts = touchState.current;

    if (ts.type === "pinch" && e.touches.length === 2) {
      const dist = getTouchDist(e);
      const newZoom = Math.max(1, Math.min(3, ts.startZoom * (dist / ts.startDist)));
      setZoom(newZoom);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
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
  }, [zoom, clampPan, screenToVideo, onMarkerDrag]);

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

  const hasMarker = markerX != null && markerY != null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: "16/9", touchAction: "none" }}
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
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`,
          transformOrigin: "center center",
          transition: zoom === 1 ? "transform 0.2s ease-out" : undefined,
        }}
      />

      {/* Marker ring */}
      {hasMarker && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${((markerX! - 0.5 + pan.x / 100) * zoom + 0.5) * 100}%`,
            top: `${((markerY! - 0.5 + pan.y / 100) * zoom + 0.5) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "3px solid #D4A853",
              background: "radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)",
              boxShadow: "0 0 20px rgba(212,168,83,0.3)",
              animation: "overlay-ring-in 0.2s ease-out",
            }}
          />
          {/* Clear button */}
          <button
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/70 active:text-red-400 pointer-events-auto"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onMarkerClear?.();
            }}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Arrow */}
          <div
            className="text-center text-[10px] text-accent"
            style={{ marginTop: 2, filter: "drop-shadow(0 0 4px rgba(212,168,83,0.6))" }}
          >
            ▼
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div
        className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[11px] text-white/60"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        🔍 {zoom.toFixed(1)}x
      </div>

      {/* Tap hint (no marker set) */}
      {!hasMarker && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-2xl px-4 py-2 text-[12px] text-white/50"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            영상 위를 탭하여 주인공 위치를 표시하세요
          </div>
        </div>
      )}
    </div>
  );
}
