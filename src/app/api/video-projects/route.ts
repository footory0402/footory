import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import type { Json } from "@/lib/supabase/database";
import {
  isVideoProjectStorageUnavailableMessage,
  type VideoProjectKind,
  type VideoProjectStatus,
} from "@/lib/video-projects";

function isProjectKind(value: string | null): value is VideoProjectKind {
  return value === "single_clip" || value === "reel_highlight";
}

function isProjectStatus(value: unknown): value is VideoProjectStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const kindParam = req.nextUrl.searchParams.get("kind");
    if (!isProjectKind(kindParam)) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }

    const clipId = req.nextUrl.searchParams.get("clipId");
    const highlightId = req.nextUrl.searchParams.get("highlightId");
    const statusParam = req.nextUrl.searchParams.get("status");

    let query = supabase
      .from("video_projects")
      .select("*")
      .eq("owner_id", user.id)
      .eq("kind", kindParam)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (clipId) query = query.eq("clip_id", clipId);
    if (highlightId) query = query.eq("highlight_id", highlightId);
    if (isProjectStatus(statusParam)) {
      query = query.eq("status", statusParam);
    }

    const { data: projects, error } = await query;
    if (error) {
      if (isVideoProjectStorageUnavailableMessage(error.message)) {
        return NextResponse.json({ project: null, clip: null, unavailable: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const project = projects?.[0] ?? null;
    if (!project) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (kindParam === "single_clip" && project.clip_id) {
      const [{ data: clip }, { data: tags }] = await Promise.all([
        supabase
          .from("clips")
          .select("id, video_url, thumbnail_url, duration_seconds, duration_sec, trim_start, trim_end, highlight_start, highlight_end, spotlight_x, spotlight_y, freeze_at, effects")
          .eq("id", project.clip_id)
          .single(),
        supabase
          .from("clip_tags")
          .select("tag_name")
          .eq("clip_id", project.clip_id),
      ]);

      const clipWithTags = clip
        ? {
            ...clip,
            tags: (tags ?? []).map((tag) => tag.tag_name),
          }
        : null;
      return NextResponse.json({ project, clip: clipWithTags });
    }

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const body = await req.json();
    const {
      projectId,
      kind,
      status = "draft",
      clipId = null,
      highlightId = null,
      title = null,
      payload,
    } = body as {
      projectId?: string | null;
      kind?: VideoProjectKind;
      status?: VideoProjectStatus;
      clipId?: string | null;
      highlightId?: string | null;
      title?: string | null;
      payload?: Json;
    };

    if (!kind || !isProjectKind(kind)) {
      return NextResponse.json({ error: "유효한 project kind가 필요합니다." }, { status: 400 });
    }

    if (!isProjectStatus(status)) {
      return NextResponse.json({ error: "유효한 project status가 필요합니다." }, { status: 400 });
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "project payload가 필요합니다." }, { status: 400 });
    }

    if (kind === "single_clip" && !clipId) {
      return NextResponse.json({ error: "single clip draft에는 clipId가 필요합니다." }, { status: 400 });
    }

    const basePayload = {
      owner_id: user.id,
      kind,
      status,
      clip_id: clipId,
      highlight_id: highlightId,
      title,
      payload,
      last_opened_at: new Date().toISOString(),
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    if (projectId) {
      const { data: updated, error } = await supabase
        .from("video_projects")
        .update(basePayload)
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: error?.message ?? "project update failed" }, { status: 500 });
      }

      return NextResponse.json({ project: updated });
    }

    let existingQuery = supabase
      .from("video_projects")
      .select("*")
      .eq("owner_id", user.id)
      .eq("kind", kind)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (clipId) existingQuery = existingQuery.eq("clip_id", clipId);
    if (highlightId) existingQuery = existingQuery.eq("highlight_id", highlightId);

    const { data: existingProjects } = await existingQuery;
    const existing = existingProjects?.[0] ?? null;

    if (existing) {
      const { data: updated, error } = await supabase
        .from("video_projects")
        .update(basePayload)
        .eq("id", existing.id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: error?.message ?? "project update failed" }, { status: 500 });
      }

      return NextResponse.json({ project: updated });
    }

    const { data: created, error } = await supabase
      .from("video_projects")
      .insert(basePayload)
      .select()
      .single();

    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "project create failed" }, { status: 500 });
    }

    return NextResponse.json({ project: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
