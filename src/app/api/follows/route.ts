import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rateLimit";

/** Count rows and update profile field */
async function syncFollowCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  targetId: string,
) {
  const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId),
  ]);

  await Promise.all([
    supabase.from("profiles").update({ following_count: followingCount ?? 0 }).eq("id", userId),
    supabase.from("profiles").update({ followers_count: followersCount ?? 0 }).eq("id", targetId),
  ]);
}

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfter } = checkRateLimit(`follows:${user.id}`, 60_000, 30);
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { targetId } = await req.json();
  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Check if already following
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already following" }, { status: 409 });
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync counts from actual follows rows
  await syncFollowCounts(supabase, user.id, targetId);

  // Send follow notification
  const { data: sender } = await supabase
    .from("profiles")
    .select("name, handle")
    .eq("id", user.id)
    .single();
  await createNotification(supabase, {
    userId: targetId,
    type: "follow",
    title: `${sender?.name ?? "누군가"}님이 팔로우했습니다`,
    referenceId: sender?.handle ?? user.id,
  });

  // E13: 맞팔 감지 — 상대방이 이미 나를 팔로우하면 '서로 팔로우!' 알림
  const { data: reverseFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", targetId)
    .eq("following_id", user.id)
    .maybeSingle();

  if (reverseFollow) {
    await createNotification(supabase, {
      userId: user.id,
      type: "follow",
      title: `${sender?.name ?? "누군가"}님과 서로 팔로우했어요!`,
      referenceId: sender?.handle ?? targetId,
      groupKey: `follow_back:${[user.id, targetId].sort().join(":")}`,
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!targetId) return NextResponse.json({ error: "Invalid target" }, { status: 400 });

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync counts from actual follows rows
  await syncFollowCounts(supabase, user.id, targetId);

  return NextResponse.json({ ok: true });
}

// GET /api/follows?type=followers|following&profileId=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? "followers";
  const profileId = req.nextUrl.searchParams.get("profileId") ?? user.id;

  if (type === "followers") {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, created_at, profiles!follows_follower_id_fkey(id, handle, name, avatar_url, level, position)")
      .eq("following_id", profileId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const items = (data ?? []).map((row) => ({
      ...(row.profiles as unknown as Record<string, unknown>),
      followedAt: row.created_at,
    }));

    return NextResponse.json({ items });
  } else {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id, created_at, profiles!follows_following_id_fkey(id, handle, name, avatar_url, level, position)")
      .eq("follower_id", profileId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const items = (data ?? []).map((row) => ({
      ...(row.profiles as unknown as Record<string, unknown>),
      followedAt: row.created_at,
    }));

    return NextResponse.json({ items });
  }
}
