"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeVideoRect,
  spotlightToPan,
  type PanValue,
  type SpotlightCoord,
} from "@/lib/spotlight-math";

interface UseSpotlightZoomOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoNativeSize: { w: number; h: number } | null;
  spotlight: SpotlightCoord | null;
}

export function useSpotlightZoom({
  videoRef,
  videoNativeSize,
  spotlight,
}: UseSpotlightZoomOptions) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanValue>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<PanValue>({ x: 0, y: 0 });
  const rafIdRef = useRef(0);

  const setTransform = useCallback((nextZoom: number, nextPan: PanValue) => {
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const cancelZoomAnimation = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  const resetTransform = useCallback(() => {
    cancelZoomAnimation();
    setTransform(1, { x: 0, y: 0 });
  }, [cancelZoomAnimation, setTransform]);

  const animateZoomTo = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,
    durationMs: number,
    onDone?: () => void,
  ) => {
    const video = videoRef.current;
    if (!video) return;

    const containerW = video.offsetWidth || 390;
    const containerH = video.offsetHeight || 844;
    const videoW = video.videoWidth || videoNativeSize?.w || 1;
    const videoH = video.videoHeight || videoNativeSize?.h || 1;
    const startZoom = zoomRef.current;
    const startPan = { ...panRef.current };
    const targetPan = targetZoom <= 1
      ? { x: 0, y: 0 }
      : spotlightToPan(
          { x: targetX, y: targetY },
          { containerW, containerH, videoW, videoH },
          targetZoom,
        );

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number) => (
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    );
    const easing = targetZoom < startZoom ? easeInOutCubic : easeOutCubic;
    const startTime = performance.now();

    cancelZoomAnimation();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / durationMs, 1);
      const eased = easing(t);
      const nextZoom = startZoom + (targetZoom - startZoom) * eased;
      const nextPan = {
        x: startPan.x + (targetPan.x - startPan.x) * eased,
        y: startPan.y + (targetPan.y - startPan.y) * eased,
      };

      setTransform(nextZoom, nextPan);

      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      rafIdRef.current = 0;
      onDone?.();
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [cancelZoomAnimation, setTransform, videoNativeSize, videoRef]);

  const syncZoomTo = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,
  ) => {
    const video = videoRef.current;
    if (!video) return;

    const containerW = video.offsetWidth || 390;
    const containerH = video.offsetHeight || 844;
    const videoW = video.videoWidth || videoNativeSize?.w || 1;
    const videoH = video.videoHeight || videoNativeSize?.h || 1;
    const nextPan = targetZoom <= 1
      ? { x: 0, y: 0 }
      : spotlightToPan(
          { x: targetX, y: targetY },
          { containerW, containerH, videoW, videoH },
          targetZoom,
        );

    cancelZoomAnimation();
    setTransform(targetZoom, nextPan);
  }, [cancelZoomAnimation, setTransform, videoNativeSize, videoRef]);

  const adjustedSpotlight = useMemo(() => {
    if (!spotlight) return null;
    if (!videoNativeSize) return spotlight;

    const video = videoRef.current;
    const containerW = video?.offsetWidth ?? 390;
    const containerH = video?.offsetHeight ?? 844;
    const { displayW, displayH, offsetX, offsetY } = computeVideoRect({
      containerW,
      containerH,
      videoW: videoNativeSize.w,
      videoH: videoNativeSize.h,
    });

    return {
      x: (offsetX + spotlight.x * displayW) / containerW,
      y: (offsetY + spotlight.y * displayH) / containerH,
    };
  }, [spotlight, videoNativeSize, videoRef]);

  useEffect(() => () => cancelZoomAnimation(), [cancelZoomAnimation]);

  return {
    adjustedSpotlight,
    animateZoomTo,
    cancelZoomAnimation,
    pan,
    panRef,
    resetTransform,
    setTransform,
    syncZoomTo,
    zoom,
    zoomRef,
  };
}
