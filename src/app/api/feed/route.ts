import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor"); // ISO timestamp

  // Get who I follow
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (followRows ?? []).map((r) => r.following_id);
  const feedOwners = [user.id, ...followingIds];

  let query = supabase
    .from("feed_items")
    .select("*")
    .in("profile_id", feedOwners)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: items, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!items || items.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null, profiles: {} });
  }

  // Fetch profiles for all feed owners
  const profileIds = [...new Set(items.map((i) => i.profile_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, level, position")
    .in("id", profileIds);

  const profileMap: Record<string, typeof profiles extends (infer T)[] | null ? T : never> = {};
  profiles?.forEach((p) => { profileMap[p.id] = p; });

  // Fetch kudos counts
  const itemIds = items.map((i) => i.id);
  const { data: kudosCounts } = await supabase
    .from("kudos")
    .select("feed_item_id")
    .in("feed_item_id", itemIds);

  const kudosMap: Record<string, number> = {};
  kudosCounts?.forEach((k) => {
    kudosMap[k.feed_item_id] = (kudosMap[k.feed_item_id] ?? 0) + 1;
  });

  // Check which items the current user has kudos'd
  const { data: myKudos } = await supabase
    .from("kudos")
    .select("feed_item_id")
    .eq("user_id", user.id)
    .in("feed_item_id", itemIds);

  const myKudosSet = new Set(myKudos?.map((k) => k.feed_item_id));

  // Fetch comment counts
  const { data: commentCounts } = await supabase
    .from("comments")
    .select("feed_item_id")
    .in("feed_item_id", itemIds);

  const commentMap: Record<string, number> = {};
  commentCounts?.forEach((c) => {
    commentMap[c.feed_item_id] = (commentMap[c.feed_item_id] ?? 0) + 1;
  });

  // Get team memberships for profiles
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("profile_id, teams(name)")
    .in("profile_id", profileIds);

  const teamMap: Record<string, string> = {};
  teamMembers?.forEach((tm) => {
    const teamName = (tm.teams as unknown as { name: string })?.name;
    if (teamName) teamMap[tm.profile_id] = teamName;
  });

  const enrichedItems = items.map((item) => {
    const profile = profileMap[item.profile_id];
    return {
      ...item,
      playerName: profile?.name ?? "Unknown",
      playerHandle: profile?.handle ?? "",
      playerAvatarUrl: profile?.avatar_url ?? null,
      playerLevel: profile?.level ?? 1,
      playerPosition: profile?.position ?? "MF",
      teamName: teamMap[item.profile_id] ?? null,
      kudosCount: kudosMap[item.id] ?? 0,
      hasKudos: myKudosSet.has(item.id),
      commentCount: commentMap[item.id] ?? 0,
    };
  });

  const nextCursor = items.length === PAGE_SIZE
    ? items[items.length - 1].created_at
    : null;

  return NextResponse.json({ items: enrichedItems, nextCursor });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, reference_id, metadata } = body;

  const { data, error } = await supabase
    .from("feed_items")
    .insert({
      profile_id: user.id,
      type,
      reference_id: reference_id ?? null,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ feedItem: data }, { status: 201 });
}
