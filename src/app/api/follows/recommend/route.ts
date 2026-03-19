import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getFollowRecommendations } from "@/lib/follow-recommend";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
