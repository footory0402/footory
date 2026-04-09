import type { EventTag } from "@/components/editor/video/types";

interface BasePayloadParams {
  clipId: string;
  videoUrl: string;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  tags: string[];
  thumbnailUrl: string | null;
}

interface ParentPayloadParams extends BasePayloadParams {
  childId: string;
}

interface GeneralPayloadParams extends BasePayloadParams {
  memo: string | null;
  trimStart: number;
  trimEnd: number | null;
  highlightStart: number;
  highlightEnd: number;
  spotlightX: number | null;
  spotlightY: number | null;
  freezeAt: number | null;
  eventTag: EventTag | null;
  effects: Record<string, unknown>;
  clientTrimmed: boolean;
}

export function buildParentUploadPayload(params: ParentPayloadParams) {
  return {
    child_id: params.childId,
    clip_id: params.clipId,
    video_url: params.videoUrl,
    duration_seconds: params.durationSeconds,
    file_size_bytes: params.fileSizeBytes,
    tags: params.tags,
    thumbnail_url: params.thumbnailUrl,
  };
}

export function buildGeneralUploadPayload(params: GeneralPayloadParams) {
  return {
    clip_id: params.clipId,
    video_url: params.videoUrl,
    duration_seconds: params.durationSeconds,
    file_size_bytes: params.fileSizeBytes,
    memo: params.memo,
    tags: params.tags,
    thumbnail_url: params.thumbnailUrl,
    highlight_start: params.highlightStart,
    highlight_end: params.highlightEnd,
    trim_start: params.trimStart,
    trim_end: params.trimEnd,
    spotlight_x: params.spotlightX,
    spotlight_y: params.spotlightY,
    freeze_at: params.freezeAt,
    event_tag: params.eventTag,
    effects: params.effects,
    client_trimmed: params.clientTrimmed,
  };
}
