export const DEFAULT_FOCUS_ZOOM = 1.8;

export const FOCUS_ZOOM_PRESETS = [
  { label: "부드럽게", description: "1.4x", value: 1.4 },
  { label: "표준", description: "1.8x", value: 1.8 },
  { label: "강하게", description: "2.2x", value: 2.2 },
] as const;

export function resolveFocusZoom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? value
    : DEFAULT_FOCUS_ZOOM;
}
