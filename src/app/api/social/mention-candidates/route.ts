import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/social/mention-candidates?q=<query>&feedItemId=<id>
// Returns up to 8 mention candidates: following + same team + clip uploader
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const feedItemId = req.nextUrl.searchParams.get("feedItemId");

  // Collect candidate profile IDs
  const candidateIds = new Set<string>();

  // 1. Following IDs
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  for (const f of follows ?? []) candidateIds.add((f as { following_id: string }).following_id);

  // 2. Same team members
  const { data: myTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", user.id);

  if ((myTeams ?? []).length > 0) {
    const teamIds = (myTeams ?? []).map((t) => (t as { team_id: string }).team_id);
    const { data: teammates } = await supabase
      .from("team_members")
      .select("profile_id")
      .in("team_id", teamIds)
      .neq("profile_id", user.id);
    for (const t of teammates ?? []) candidateIds.add((t as { profile_id: string }).profile_id);
  }

  // 3. Feed item uploader
  if (feedItemId) {
    const { data: feedItem } = await supabase
      .from("feed_items")
      .select("profile_id")
      .eq("id", feedItemId)
      .single();
    if (feedItem && feedItem.profile_id !== user.id) {
      candidateIds.add(feedItem.profile_id);
    }
  }

  if (candidateIds.size === 0) {
    return NextResponse.json({ candidates: [] });
  }

  // Query profiles filtered by search term
  let query = supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, level, position")
    .in("id", [...candidateIds])
    .neq("id", user.id)
    .limit(8);

  if (q.trim()) {
    // filter by name or handle prefix
    query = query.or(`name.ilike.%${q}%,handle.ilike.%${q}%`);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ candidates: profiles ?? [] });
}
