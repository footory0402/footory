import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type") ?? "all";

  if (!q || q.length < 1) {
    return NextResponse.json({ players: [], teams: [] });
  }

  const supabase = await createClient();
  const isHandleSearch = q.startsWith("@");
  const keyword = isHandleSearch ? q.slice(1) : q;
  const pattern = `%${keyword}%`;

  let players: unknown[] = [];
  let teams: unknown[] = [];

  if (type === "all" || type === "player") {
    let query = supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, city, birth_year")
      .limit(20);

    if (isHandleSearch) {
      query = query.ilike("handle", pattern);
    } else {
      query = query.or(`name.ilike.${pattern},handle.ilike.${pattern}`);
    }

    const { data } = await query;

    // K8: 코치 리뷰 있는 영상 소유자 → 검색 결과 상위 노출
    const rawPlayers = data ?? [];
    if (rawPlayers.length > 0) {
      const playerIds = rawPlayers.map((p) => (p as { id: string }).id);
      // Step 1: find clips owned by these players that have coach reviews
      const { data: reviewedClipRows } = await supabase
        .from("clips")
        .select("owner_id")
        .in("owner_id", playerIds)
        .not("id", "is", null);

      // Step 2: check which of those clip_ids have reviews
      const clipIds = (reviewedClipRows ?? []).map((c) => (c as { owner_id: string }).owner_id);
      let reviewedOwners = new Set<string>();
      if (clipIds.length > 0) {
        const { data: clipsWithReviews } = await supabase
          .from("coach_reviews")
          .select("clip_id, clips(owner_id)")
          .in("clip_id", clipIds);
        reviewedOwners = new Set<string>(
          (clipsWithReviews ?? [])
            .map((r) => {
              const row = r as unknown as { clips?: { owner_id: string } | null };
              return row.clips?.owner_id;
            })
            .filter((id): id is string => !!id)
        );
      }

      players = [...rawPlayers].sort((a, b) => {
        const aId = (a as { id: string }).id;
        const bId = (b as { id: string }).id;
        return (reviewedOwners.has(bId) ? 1 : 0) - (reviewedOwners.has(aId) ? 1 : 0);
      });
    } else {
      players = rawPlayers;
    }
  }

  if (type === "all" || type === "team") {
    const { data } = await supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, team_members(count)")
      .ilike("name", pattern)
      .limit(20);

    teams = (data ?? []).map((t) => {
      const { team_members, ...rest } = t as Record<string, unknown>;
      const members = team_members as { count: number }[] | undefined;
      return { ...rest, member_count: members?.[0]?.count ?? 0 };
    });
  }

  return NextResponse.json({ players, teams });
}
