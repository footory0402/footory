import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

// GET /api/feed/[id]/comments — list comments for a feed item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, profiles!comments_user_id_fkey(id, handle, name, avatar_url, level, position)")
    .eq("feed_item_id", feedItemId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = (data ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    userId: c.user_id,
    profile: c.profiles as unknown as Record<string, unknown>,
  }));

  return NextResponse.json({ comments });
}

// POST /api/feed/[id]/comments — add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ feed_item_id: feedItemId, user_id: user.id, content: content.trim() })
    .select("id, content, created_at, user_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification to feed item owner
  const { data: feedItem } = await supabase
    .from("feed_items")
    .select("profile_id")
    .eq("id", feedItemId)
    .single();

  if (feedItem && feedItem.profile_id !== user.id) {
    const { data: sender } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    await createNotification(supabase, {
      userId: feedItem.profile_id,
      type: "comment",
      title: `${sender?.name ?? "누군가"}님이 댓글을 남겼습니다`,
      body: content.trim().slice(0, 100),
      referenceId: feedItemId,
    });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}

// DELETE /api/feed/[id]/comments — delete own comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const { error, count } = await supabase
    .from("comments")
    .delete({ count: "exact" })
    .eq("id", commentId)
    .eq("feed_item_id", feedItemId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
