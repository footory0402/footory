/** BGM 카테고리 + 메타데이터 */

export interface BgmTrack {
  id: string;
  title: string;
  artist: string | null;
  category: BgmCategory;
  r2Key: string;
  durationSec: number;
}

export type BgmCategory = "epic" | "chill" | "hype" | "cinematic";

export const BGM_CATEGORIES: { id: BgmCategory; label: string; emoji: string }[] = [
  { id: "epic", label: "에픽", emoji: "🎬" },
  { id: "hype", label: "하이프", emoji: "🔥" },
  { id: "chill", label: "칠", emoji: "🌊" },
  { id: "cinematic", label: "시네마틱", emoji: "🎥" },
];
