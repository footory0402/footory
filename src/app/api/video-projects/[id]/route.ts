import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import type { VideoProjectStatus } from "@/lib/video-projects";

function isProjectStatus(value: unknown): value is VideoProjectStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { id } = await params;

    const body = await req.json();
    const {
      markOpened = false,
      status,
      highlightId,
    } = body as {
      markOpened?: boolean;
      status?: VideoProjectStatus;
      highlightId?: string | null;
    };

    const updates: Record<string, unknown> = {};

    if (markOpened) {
      updates.last_opened_at = new Date().toISOString();
    }

    if (status !== undefined) {
      if (!isProjectStatus(status)) {
        return NextResponse.json({ error: "유효한 project status가 필요합니다." }, { status: 400 });
      }
      updates.status = status;
      updates.published_at = status === "published" ? new Date().toISOString() : null;
    }

    if (highlightId !== undefined) {
      updates.highlight_id = highlightId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from("video_projects")
      .update(updates)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json({ error: error?.message ?? "project update failed" }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
