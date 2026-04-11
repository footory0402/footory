export const DEFAULT_EDITOR_ZOOM = 1;
export const DEFAULT_FOCUS_ZOOM = 2.1;
export const DEFAULT_FREEZE_HOLD_MS = 2000;

export const FOCUS_ZOOM_PRESETS = [
  { label: "원본", description: "1.0x", value: DEFAULT_EDITOR_ZOOM },
  { label: "기본", description: "2.1x", value: DEFAULT_FOCUS_ZOOM },
  { label: "가깝게", description: "2.5x", value: 2.5 },
] as const;

export function resolveFocusZoom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? value
    : DEFAULT_FOCUS_ZOOM;
}
