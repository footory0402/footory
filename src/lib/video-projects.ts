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
  project: VideoProjectRecord<SingleClipEditingDraft>;
  clip: {
    id: string;
    video_url: string;
    duration_seconds: number | null;
    duration_sec: number | null;
    trim_start: number | null;
    trim_end: number | null;
    tags: string[];
  } | null;
}

export interface ReelProjectResponse {
  project: VideoProjectRecord<ReelHighlightDraftPayload>;
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
    throw new Error(body.error ?? "드래프트 저장에 실패했습니다.");
  }

  return readJsonSafe<{ project: VideoProjectRecord<TPayload> }>(response);
}

export async function loadLatestSingleClipProject() {
  const response = await fetch("/api/video-projects?kind=single_clip&latest=1&status=draft");
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    throw new Error(body.error ?? "최근 single clip draft를 불러오지 못했습니다.");
  }

  return readJsonSafe<SingleClipProjectResponse>(response);
}

export async function loadLatestReelProject() {
  const response = await fetch("/api/video-projects?kind=reel_highlight&latest=1&status=draft");
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    throw new Error(body.error ?? "최근 reel draft를 불러오지 못했습니다.");
  }

  return readJsonSafe<ReelProjectResponse>(response);
}

export async function markVideoProjectOpened(projectId: string) {
  const response = await fetch(`/api/video-projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markOpened: true }),
  });

  if (!response.ok) {
    const body = await readJsonSafe<{ error?: string }>(response);
    throw new Error(body.error ?? "draft 열기 상태를 기록하지 못했습니다.");
  }

  return readJsonSafe<{ project: VideoProjectRecord }>(response);
}

export async function markVideoProjectPublished({
  projectId,
  highlightId,
}: {
  projectId: string;
  highlightId?: string | null;
}) {
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
    throw new Error(body.error ?? "project publish 상태 저장에 실패했습니다.");
  }

  return readJsonSafe<{ project: VideoProjectRecord }>(response);
}
