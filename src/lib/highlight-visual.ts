import type { PlaybackEffects } from "@/lib/playback-focus";

export type HighlightVisualStyle = "soft_ring" | "double_ring" | "bracket_light";

export const DEFAULT_HIGHLIGHT_VISUAL_STYLE: HighlightVisualStyle = "bracket_light";

export function resolveHighlightVisualStyle({
  effects,
  preferredStyle,
}: {
  effects?: PlaybackEffects | null;
  freezeMode?: boolean;
  preferredStyle?: HighlightVisualStyle | null;
}): HighlightVisualStyle {
  if (preferredStyle) return preferredStyle;
  if (effects?.eafc) return "bracket_light";
  return DEFAULT_HIGHLIGHT_VISUAL_STYLE;
}
