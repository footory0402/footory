import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Follow recommendation algorithm
 * Priority:
 *  1. Same team members (not following)
 *  2. Friends of friends (mutual connections)
 *  3. Same region + position
 *  4. Popular players in same age group
 *  5. This week's MVP candidates
 */
export async function getFollowRecommendations(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<string[]> {
  // Get current user's profile
  const { data: me } = await supabase
    .from("profiles")
    .select("id, position, city, birth_year")
    .eq("id", userId)
    .single();

  if (!me) return [];

  // Get users I already follow
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = new Set((following ?? []).map((f) => f.following_id));
  followingIds.add(userId); // Exclude self

  const recommended: Map<string, number> = new Map(); // profileId → score

  // 1. Same team members
  const { data: myTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", userId)
    .in("role", ["admin", "member"]);

  if (myTeams && myTeams.length > 0) {
    const teamIds = myTeams.map((t) => t.team_id);
    const { data: teammates } = await supabase
      .from("team_members")
      .select("profile_id")
      .in("team_id", teamIds)
      .in("role", ["admin", "member"])
      .neq("profile_id", userId)
      .limit(20);

    for (const t of teammates ?? []) {
      if (!followingIds.has(t.profile_id)) {
        recommended.set(t.profile_id, (recommended.get(t.profile_id) ?? 0) + 50);
      }
    }
  }

  // 2. Friends of friends
  if (following && following.length > 0) {
    const myFollowingIds = following.map((f) => f.following_id).slice(0, 20);
    const { data: fof } = await supabase
      .from("follows")
      .select("following_id")
      .in("follower_id", myFollowingIds)
      .limit(50);

    for (const f of fof ?? []) {
      if (!followingIds.has(f.following_id)) {
        recommended.set(f.following_id, (recommended.get(f.following_id) ?? 0) + 30);
      }
    }
  }

  // 3. Same region + position
  if (me.city || me.position) {
    let query = supabase
      .from("profiles")
      .select("id")
      .neq("id", userId)
      .eq("role", "player")
      .limit(20);

    if (me.city) query = query.eq("city", me.city);
    if (me.position) query = query.eq("position", me.position);

    const { data: nearby } = await query;
    for (const p of nearby ?? []) {
      if (!followingIds.has(p.id)) {
        recommended.set(p.id, (recommended.get(p.id) ?? 0) + 20);
      }
    }
  }

  // 4. Popular players in same age group
  if (me.birth_year) {
    const { data: sameAge } = await supabase
      .from("profiles")
      .select("id, followers_count")
      .eq("role", "player")
      .gte("birth_year", me.birth_year - 2)
      .lte("birth_year", me.birth_year + 2)
      .neq("id", userId)
      .order("followers_count", { ascending: false })
      .limit(15);

    for (const p of sameAge ?? []) {
      if (!followingIds.has(p.id)) {
        recommended.set(p.id, (recommended.get(p.id) ?? 0) + 10);
      }
    }
  }

  // 5. This week's MVP candidates
  const mondayDate = getMondayDate();
  const { data: mvpCandidates } = await supabase
    .from("weekly_votes")
    .select("clip_id, clips!inner(owner_id)")
    .eq("week_start", mondayDate)
    .limit(10);

  for (const v of mvpCandidates ?? []) {
    const ownerId = (v.clips as unknown as { owner_id: string })?.owner_id;
    if (ownerId && !followingIds.has(ownerId)) {
      recommended.set(ownerId, (recommended.get(ownerId) ?? 0) + 15);
    }
  }

  // Sort by score and return top N
  return Array.from(recommended.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

function getMondayDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}
