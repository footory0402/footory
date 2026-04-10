import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  normalizeHighlightPublishState,
  resolvePublishTransition,
} from "@/lib/publish-state";

/**
 * GET /api/highlights/[id] — 릴 상세 (클립 데이터 포함)
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id } = await params;

    const { data: highlight } = await supabase
      .from("highlights")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (!highlight) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // 클립 데이터 fetch
    const { data: clips } = await supabase
      .from("clips")
      .select("id, video_url, thumbnail_url, duration_seconds, duration_sec, highlight_start, highlight_end, spotlight_x, spotlight_y, freeze_at, trim_start, trim_end, slowmo_start, slowmo_end, slowmo_speed, bgm_id, effects, memo")
      .in("id", highlight.clip_ids);

    // clip_ids 순서대로 정렬
    const clipsMap = new Map((clips ?? []).map((c) => [c.id, c]));
    const orderedClips = highlight.clip_ids
      .map((cid: string) => clipsMap.get(cid))
      .filter(Boolean);

    return NextResponse.json({
      highlight: {
        ...highlight,
        status: normalizeHighlightPublishState(highlight.status),
      },
      clips: orderedClips,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/highlights/[id] — 릴 수정 (제목, 클립 순서)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id } = await params;

    const body = await req.json();
    const { title, clipIds, status, action } = body as {
      title?: string;
      clipIds?: string[];
      status?: "draft" | "published" | "rendering" | "failed";
      action?: "publish" | "unpublish";
    };

    const { data: currentHighlight } = await supabase
      .from("highlights")
      .select("id, status")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (!currentHighlight) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (clipIds !== undefined) {
      if (clipIds.length < 2) {
        return NextResponse.json({ error: "최소 2개 클립이 필요합니다" }, { status: 400 });
      }
      updates.clip_ids = clipIds;
    }
    if (status !== undefined) updates.status = status;
    if (action === "publish") updates.status = "published";
    if (action === "unpublish") updates.status = "draft";

    const { data, error } = await supabase
      .from("highlights")
      .update(updates)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "수정 실패" }, { status: 500 });
    }

    const nextStatus = normalizeHighlightPublishState((updates.status as string | undefined) ?? data.status);
    return NextResponse.json({
      highlight: {
        ...data,
        status: nextStatus,
      },
      transition: resolvePublishTransition({
        previous: normalizeHighlightPublishState(currentHighlight.status),
        next: nextStatus,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/highlights/[id] — 릴 삭제
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id } = await params;

    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
