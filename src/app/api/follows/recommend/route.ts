import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowRecommendations } from "@/lib/follow-recommend";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recommendedIds = await getFollowRecommendations(supabase, user.id, 10);

  if (recommendedIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, level, position, city, followers_count, mvp_count, mvp_tier")
    .in("id", recommendedIds);

  // Maintain recommendation order
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const items = recommendedIds
    .map((id) => profileMap.get(id))
    .filter(Boolean);

  return NextResponse.json({ items });
}
