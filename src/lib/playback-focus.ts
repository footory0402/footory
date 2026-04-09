import type { SpotlightCoord } from "@/lib/spotlight-math";

export type TrackingMode = "fixed" | "follow";

export interface TrackingPoint {
  time: number;
  x: number;
  y: number;
}

export interface PlaybackEffects {
  intro?: boolean;
  focusZoom?: number;
  color?: boolean;
  cinematic?: boolean;
  eafc?: boolean;
  trackingMode?: TrackingMode;
  trackingPoints?: TrackingPoint[];
}

interface ResolvePlaybackSpotlightOptions {
  spotlight: SpotlightCoord | null;
  trackingMode?: TrackingMode | null;
  trackingPoints?: TrackingPoint[] | null;
  time: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function sanitizeTrackingPoints(points?: TrackingPoint[] | null) {
  if (!Array.isArray(points)) return [] as TrackingPoint[];

  return points
    .filter((point) =>
      point &&
      Number.isFinite(point.time) &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
    )
    .map((point) => ({
      time: Math.max(0, point.time),
      x: clamp01(point.x),
      y: clamp01(point.y),
    }))
    .sort((a, b) => a.time - b.time);
}

export function resolveTrackingMode(
  trackingMode?: TrackingMode | null,
  trackingPoints?: TrackingPoint[] | null,
) {
  return trackingMode === "follow" && sanitizeTrackingPoints(trackingPoints).length >= 2
    ? "follow"
    : "fixed";
}

export function hasPlaybackFocus(
  spotlight: SpotlightCoord | null,
  trackingMode?: TrackingMode | null,
  trackingPoints?: TrackingPoint[] | null,
) {
  if (spotlight) return true;
  return resolveTrackingMode(trackingMode, trackingPoints) === "follow";
}

export function resolvePlaybackSpotlight({
  spotlight,
  trackingMode,
  trackingPoints,
  time,
}: ResolvePlaybackSpotlightOptions): SpotlightCoord | null {
  const mode = resolveTrackingMode(trackingMode, trackingPoints);
  const points = sanitizeTrackingPoints(trackingPoints);

  if (mode !== "follow" || points.length < 2) {
    return spotlight;
  }

  if (time <= points[0].time) {
    return { x: points[0].x, y: points[0].y };
  }

  const lastPoint = points[points.length - 1];
  if (time >= lastPoint.time) {
    return { x: lastPoint.x, y: lastPoint.y };
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (time < start.time || time > end.time) continue;

    const ratio = end.time === start.time
      ? 0
      : (time - start.time) / (end.time - start.time);

    return {
      x: clamp01(start.x + (end.x - start.x) * ratio),
      y: clamp01(start.y + (end.y - start.y) * ratio),
    };
  }

  return spotlight;
}
