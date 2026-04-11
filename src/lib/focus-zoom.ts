export const DEFAULT_FOCUS_ZOOM = 2.1;
export const DEFAULT_FREEZE_HOLD_MS = 2000;

export const FOCUS_ZOOM_PRESETS = [
  { label: "넓게 보기", description: "1.7x", value: 1.7 },
  { label: "기본", description: "2.1x", value: 2.1 },
  { label: "더 가깝게", description: "2.5x", value: 2.5 },
] as const;

export function resolveFocusZoom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? value
    : DEFAULT_FOCUS_ZOOM;
}
