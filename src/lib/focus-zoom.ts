export const DEFAULT_FOCUS_ZOOM = 1.8;
export const DEFAULT_FREEZE_HOLD_MS = 1800;

export const FOCUS_ZOOM_PRESETS = [
  { label: "넓게 보기", description: "1.4x", value: 1.4 },
  { label: "가깝게 보기", description: "1.8x", value: 1.8 },
  { label: "더 가까이 보기", description: "2.2x", value: 2.2 },
] as const;

export function resolveFocusZoom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? value
    : DEFAULT_FOCUS_ZOOM;
}
