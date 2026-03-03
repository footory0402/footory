import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Update counts
  const [{ data: myProfile }, { data: targetProfile }] = await Promise.all([
    supabase.from("profiles").select("following_count").eq("id", user.id).single(),
    supabase.from("profiles").select("followers_count").eq("id", targetId).single(),
  ]);
  await Promise.all([
    supabase.from("profiles").update({ following_count: (myProfile?.following_count ?? 0) + 1 }).eq("id", user.id),
    supabase.from("profiles").update({ followers_count: (targetProfile?.followers_count ?? 0) + 1 }).eq("id", targetId),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId) return NextResponse.json({ error: "Invalid target" }, { status: 400 });

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update counts (decrement, floor at 0)
  await Promise.all([
    supabase.from("profiles").select("following_count").eq("id", user.id).single().then(({ data }) => {
      return supabase.from("profiles").update({ following_count: Math.max((data?.following_count ?? 1) - 1, 0) }).eq("id", user.id);
    }),
    supabase.from("profiles").select("followers_count").eq("id", targetId).single().then(({ data }) => {
      return supabase.from("profiles").update({ followers_count: Math.max((data?.followers_count ?? 1) - 1, 0) }).eq("id", targetId);
    }),
  ]);

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
