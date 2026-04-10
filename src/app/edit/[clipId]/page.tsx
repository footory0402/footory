"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import HighlightSuggestionReview from "@/components/upload/HighlightSuggestionReview";
import { resolveFocusZoom } from "@/lib/focus-zoom";
import { createSingleClipEditingDraft, type SingleClipEditingDraft } from "@/lib/single-clip-playback";
import { applySingleClipDraftToUploadStore } from "@/lib/single-clip-store-sync";
import { loadSingleClipProjectByClipId, markVideoProjectOpened } from "@/lib/video-projects";
import { useUploadStore } from "@/stores/upload-store";

interface ClipEditingResponse {
  clip?: {
    id: string;
    video_url: string;
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
    tags?: string[];
  };
  error?: string;
}

type EditableClip = NonNullable<ClipEditingResponse["clip"]>;

export default function ClipEditPage() {
  const { clipId } = useParams<{ clipId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const file = useUploadStore((state) => state.file);
  const storeClipId = useUploadStore((state) => state.clipId);
  const editorDraft = useUploadStore((state) => state.editorDraft);
  const setEditorDraft = useUploadStore((state) => state.setEditorDraft);

  const matchingDraft = editorDraft?.clipId === clipId ? editorDraft : null;

  const [draft, setDraft] = useState<SingleClipEditingDraft | null>(matchingDraft);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || storeClipId !== clipId) {
      setLocalVideoUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setLocalVideoUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [clipId, file, storeClipId]);

  useEffect(() => {
    if (!projectId) return;

    void markVideoProjectOpened(projectId).catch(() => {
      // no-op
    });
  }, [projectId]);

  useEffect(() => {
    if (!matchingDraft) return;

    const nextDraft = projectId && !matchingDraft.projectId
      ? { ...matchingDraft, projectId }
      : matchingDraft;

    setDraft(nextDraft);
    setEditorDraft(nextDraft);
    setError(null);

    if (localVideoUrl) {
      setVideoSrc(localVideoUrl);
      setLoading(false);
      return;
    }

    setVideoSrc((current) => current);
  }, [localVideoUrl, matchingDraft, projectId, setEditorDraft]);

  useEffect(() => {
    if (matchingDraft && (localVideoUrl || videoSrc)) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const latestProject = await loadSingleClipProjectByClipId(clipId);
        const restoredDraft = latestProject?.project && latestProject.clip
          ? {
              ...latestProject.project.payload,
              projectId: latestProject.project.id,
              projectStatus: latestProject.project.status === "published" ? "published" : "draft",
              lastSavedAt: latestProject.project.updated_at,
            } satisfies SingleClipEditingDraft
          : null;

        let clip: EditableClip | null = latestProject?.clip
          ? {
              ...latestProject.clip,
              highlight_start: null,
              highlight_end: null,
              spotlight_x: null,
              spotlight_y: null,
              freeze_at: null,
              effects: null,
            }
          : null;

        if (!clip) {
          const response = await fetch(`/api/clips/${clipId}`);
          const body = await response.json().catch(() => ({})) as ClipEditingResponse;

          if (!response.ok || !body.clip) {
            throw new Error(body.error ?? "편집할 영상을 불러오지 못했습니다.");
          }

          clip = body.clip;
        }

        if (!clip) {
          throw new Error("편집할 영상을 불러오지 못했습니다.");
        }

        const durationSec = clip.duration_sec ?? clip.duration_seconds ?? restoredDraft?.sourceDurationSec ?? 0;
        const baseDraft = restoredDraft ?? createSingleClipEditingDraft({
          clipId: clip.id,
          sourceDurationSec: durationSec,
          trimStart: clip.trim_start ?? 0,
          trimEnd: clip.trim_end ?? durationSec,
          highlightStart: clip.highlight_start ?? clip.trim_start ?? 0,
          highlightEnd: clip.highlight_end ?? clip.trim_end ?? durationSec,
          spotlight: clip.spotlight_x != null && clip.spotlight_y != null
            ? { x: clip.spotlight_x, y: clip.spotlight_y }
            : null,
          freezeAt: clip.freeze_at,
          zoom: resolveFocusZoom(clip.effects?.focusZoom),
          showProfileCard: clip.effects?.intro !== false,
          showLowerThird: clip.effects?.showLowerThird ?? true,
        });
        const hydratedDraft = projectId && !baseDraft.projectId
          ? { ...baseDraft, projectId }
          : baseDraft;

        if (cancelled) return;

        applySingleClipDraftToUploadStore({
          store: useUploadStore.getState(),
          draft: hydratedDraft,
          clipId: clip.id,
          durationSec,
          tags: clip.tags ?? [],
        });
        setDraft(hydratedDraft);
        setVideoSrc(localVideoUrl ?? clip.video_url);
        setLoading(false);
      } catch (fetchError) {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : "편집 화면을 열지 못했습니다.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    clipId,
    localVideoUrl,
    matchingDraft,
    projectId,
    setEditorDraft,
    videoSrc,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#070709]">
        <p className="text-sm text-text-3">편집 화면을 불러오는 중이에요...</p>
      </div>
    );
  }

  if (!draft || !videoSrc) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#070709] px-4 text-center">
        <p className="text-sm font-semibold text-text-1">편집 화면에 들어갈 수 없어요</p>
        <p className="text-sm text-text-3">{error ?? "영상 정보를 다시 확인해주세요."}</p>
        <button
          type="button"
          onClick={() => router.push("/upload")}
          className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-bg"
        >
          영상 올리기로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <HighlightSuggestionReview
      key={`${draft.clipId}:${draft.projectId ?? "draft"}`}
      draft={draft}
      videoSrc={videoSrc}
      onReset={() => router.push("/upload")}
    />
  );
}
