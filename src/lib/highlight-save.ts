import {
  type SingleClipEditingDraft,
  markSingleClipDraftPersisted,
  resolveSingleClipEditingPatch,
} from "@/lib/single-clip-playback";
import { saveVideoProject, VideoProjectStorageUnavailableError } from "@/lib/video-projects";

interface SaveSingleClipDraftParams {
  draft: SingleClipEditingDraft;
}

interface PublishSingleClipDraftParams {
  draft: SingleClipEditingDraft;
  clipId: string;
  existingTags?: string[];
}

interface PublishSingleClipDraftResult {
  connectionLabel: string;
  publishTransition: "published" | "republished";
  featuredLinkFailed?: boolean;
}

async function readJsonSafe(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

export async function saveSingleClipDraft({
  draft,
}: SaveSingleClipDraftParams): Promise<SingleClipEditingDraft> {
  try {
    const result = await saveVideoProject<SingleClipEditingDraft>({
      projectId: draft.projectId,
      kind: "single_clip",
      status: "draft",
      clipId: draft.clipId,
      payload: draft,
    });

    return markSingleClipDraftPersisted(draft, {
      projectId: result.project.id,
      projectStatus: "draft",
      savedAt: result.project.updated_at,
    });
  } catch (error) {
    if (error instanceof VideoProjectStorageUnavailableError) {
      return draft;
    }

    throw error;
  }
}

export async function publishSingleClipDraft({
  draft,
  clipId,
  existingTags = [],
}: PublishSingleClipDraftParams): Promise<PublishSingleClipDraftResult> {
  const patchBody: Record<string, unknown> = resolveSingleClipEditingPatch(draft);

  if (draft.saveTarget.profileTarget === "tag_portfolio") {
    if (!draft.saveTarget.portfolioTagName) {
      throw new Error("포트폴리오 태그를 선택해주세요.");
    }

    patchBody.tags = [...new Set([...existingTags, draft.saveTarget.portfolioTagName])];
  }

  const patchRes = await fetch(`/api/clips/${clipId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchBody),
  });

  if (!patchRes.ok) {
    const body = await readJsonSafe(patchRes);
    throw new Error(String(body.error ?? "클립 저장에 실패했습니다."));
  }

  try {
    await saveVideoProject<SingleClipEditingDraft>({
      projectId: draft.projectId,
      kind: "single_clip",
      status: "published",
      clipId,
      payload: draft,
    });
  } catch (error) {
    if (!(error instanceof VideoProjectStorageUnavailableError)) {
      throw error;
    }
  }

  if (draft.saveTarget.profileTarget === "featured_candidate") {
    const featuredRes = await fetch("/api/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clip_id: clipId }),
    });

    if (!featuredRes.ok) {
      const body = await readJsonSafe(featuredRes);
      const message = String(body.error ?? "대표 후보 연결에 실패했습니다.");
      if (!message.includes("이미 Featured")) {
        return {
          connectionLabel: "클립",
          publishTransition: "published",
          featuredLinkFailed: true,
        };
      }

      return {
        connectionLabel: "프로필 Featured",
        publishTransition: "republished",
      };
    }

    return {
      connectionLabel: "프로필 Featured",
      publishTransition: "published",
    };
  }

  const alreadyTagged = draft.saveTarget.portfolioTagName != null
    && existingTags.includes(draft.saveTarget.portfolioTagName);

  return {
    connectionLabel: `${draft.saveTarget.portfolioTagName} 포트폴리오`,
    publishTransition: alreadyTagged ? "republished" : "published",
  };
}
