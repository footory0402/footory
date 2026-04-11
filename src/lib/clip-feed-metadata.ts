import { resolveSingleClipPlayableDuration } from "@/lib/single-clip-playback";
import type { Json } from "@/lib/supabase/database";

export interface ClipFeedMetadataSource {
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  duration_sec?: number | null;
  memo?: string | null;
  spotlight_x?: number | null;
  spotlight_y?: number | null;
  freeze_at?: number | null;
  trim_start?: number | null;
  trim_end?: number | null;
  slowmo_start?: number | null;
  slowmo_end?: number | null;
  slowmo_speed?: number | null;
  bgm_id?: string | null;
  effects?: Json;
}

function roundToTenths(value: number) {
  return Number(value.toFixed(1));
}

export function buildClipFeedMetadata(
  clip: ClipFeedMetadataSource,
  tags: string[],
): { [key: string]: Json | undefined } {
  return {
    video_url: clip.video_url,
    thumbnail_url: clip.thumbnail_url,
    duration: roundToTenths(resolveSingleClipPlayableDuration(clip)),
    tags,
    memo: clip.memo ?? null,
    spotlight_x: clip.spotlight_x ?? null,
    spotlight_y: clip.spotlight_y ?? null,
    freeze_at: clip.freeze_at ?? null,
    trim_start: clip.trim_start ?? null,
    trim_end: clip.trim_end ?? null,
    slowmo_start: clip.slowmo_start ?? null,
    slowmo_end: clip.slowmo_end ?? null,
    slowmo_speed: clip.slowmo_speed ?? null,
    bgm_id: clip.bgm_id ?? null,
    effects: clip.effects ?? null,
  };
}
