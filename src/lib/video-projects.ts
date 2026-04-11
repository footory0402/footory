import type { Json } from "@/lib/supabase/database";
import type { SingleClipEditingDraft } from "@/lib/single-clip-playback";
import type { ReelClipItem } from "@/components/reel/ClipOrderEditor";

export type VideoProjectKind = "single_clip" | "reel_highlight";
export type VideoProjectStatus = "draft" | "published" | "archived";

export interface ReelHighlightDraftPayload {
  title: string;
  clipIds: string[];
  items: ReelClipItem[];
}

export interface VideoProjectRecord<TPayload = Json> {
  id: string;
  kind: VideoProjectKind;
  status: VideoProjectStatus;
  clip_id: string | null;
  highlight_id: string | null;
  title: string | null;
  payload: TPayload;
  last_opened_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SingleClipProjectResponse {
  project: VideoProjectRecord<SingleClipEditingDraft> | null;
  clip: {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    duration_sec: number | null;
    trim_start: number | null;
    trim_end: number | null;
    highlight_start: number | null;
    highlight_end: number | null;
    spotlight_x: number | null;
    spotlight_y: number | null;
    freeze_at: number | null;
    effects?: {
      intro?: boolean;
      showLowerThird?: boolean;
      focusZoom?: number;
    } | null;
    tags: string[];
  } | null;
}

export interface ReelProjectResponse {
  project: VideoProjectRecord<ReelHighlightDraftPayload> | null;
}

interface VideoProjectMutationResult {
  project: VideoProjectRecord | null;
}

let videoProjectStorageAvailable = true;

export class VideoProjectStorageUnavailableError extends Error {
  constructor(message = "임시 저장은 지금 사용할 수 없어요.") {
    super(message);
    this.name = "VideoProjectStorageUnavailableError";
  }
}

export function isVideoProjectStorageUnavailableMessage(message: string) {
  return /video_projects|schema cache|relation .*video_projects/i.test(message);
}

async function readJsonSafe<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

export async function saveVideoProject<TPayload>({
  projectId,
  kind,
  status = "draft",
  clipId,
  highlightId,
  title,
  payload,
}: {
  projectId?: string | null;
  kind: VideoProjectKind;
  status?: VideoProjectStatus;
  clipId?: string | null;
  highlightId?: string | null;
  title?: string | null;
  payload: TPayload;
}) {
  if (!videoProjectStorageAvailable) {
    throw new VideoProjectStorageUnavailableError();
  }

  const response = await fetch("/api/video-projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      kind,
      status,
      clipId,
      highlightId,
      title,
      payload,
    }),
  });

  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "드래프트 저장에 실패했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      throw new VideoProjectStorageUnavailableError();
    }
    throw new Error(message);
  }

  return readJsonSafe<{ project: VideoProjectRecord<TPayload> }>(response);
}

export async function loadLatestSingleClipProject() {
  if (!videoProjectStorageAvailable) return null;

  const response = await fetch("/api/video-projects?kind=single_clip&latest=1&status=draft");
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "최근 single clip draft를 불러오지 못했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      return null;
    }
    throw new Error(message);
  }

  const result = await readJsonSafe<SingleClipProjectResponse & { unavailable?: boolean }>(response);
  if (result.unavailable || !result.project) {
    videoProjectStorageAvailable = false;
    return null;
  }

  return result;
}

export async function loadSingleClipProjectByClipId(clipId: string) {
  if (!videoProjectStorageAvailable) return null;

  const response = await fetch(`/api/video-projects?kind=single_clip&latest=1&status=draft&clipId=${encodeURIComponent(clipId)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "single clip draft를 불러오지 못했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      return null;
    }
    throw new Error(message);
  }

  const result = await readJsonSafe<SingleClipProjectResponse & { unavailable?: boolean }>(response);
  if (result.unavailable || !result.project) {
    videoProjectStorageAvailable = false;
    return null;
  }

  return result;
}

export async function loadLatestReelProject() {
  if (!videoProjectStorageAvailable) return null;

  const response = await fetch("/api/video-projects?kind=reel_highlight&latest=1&status=draft");
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "최근 reel draft를 불러오지 못했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      return null;
    }
    throw new Error(message);
  }

  const result = await readJsonSafe<ReelProjectResponse & { unavailable?: boolean }>(response);
  if (result.unavailable || !result.project) {
    videoProjectStorageAvailable = false;
    return null;
  }

  return result;
}

export async function markVideoProjectOpened(projectId: string): Promise<VideoProjectMutationResult> {
  if (!videoProjectStorageAvailable) {
    return { project: null };
  }

  const response = await fetch(`/api/video-projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markOpened: true }),
  });

  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "draft 열기 상태를 기록하지 못했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      return { project: null };
    }
    throw new Error(message);
  }

  return readJsonSafe<VideoProjectMutationResult>(response);
}

export async function markVideoProjectPublished({
  projectId,
  highlightId,
}: {
  projectId: string;
  highlightId?: string | null;
}): Promise<VideoProjectMutationResult> {
  if (!videoProjectStorageAvailable) {
    return { project: null };
  }

  const response = await fetch(`/api/video-projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "published",
      highlightId: highlightId ?? null,
    }),
  });

  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    const message = body.error ?? "project publish 상태 저장에 실패했습니다.";
    if (isVideoProjectStorageUnavailableMessage(message)) {
      videoProjectStorageAvailable = false;
      return { project: null };
    }
    throw new Error(message);
  }

  return readJsonSafe<VideoProjectMutationResult>(response);
}
