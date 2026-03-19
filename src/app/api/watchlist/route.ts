import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { canUseWatchlist } from "@/lib/permissions";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !canUseWatchlist(profile.role, profile.is_verified)) {
      return NextResponse.json(
        { error: "인증된 코치/스카우터만 워치리스트를 사용할 수 있습니다" },
        { status: 403 }
      );
    }

    // 워치리스트 기본 조회
    const { data: watchlist, error } = await supabase
      .from("scout_watchlist")
      .select("id, scout_id, player_id, note, notify_on_upload, created_at")
      .eq("scout_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const playerIds = (watchlist ?? []).map((w) => w.player_id);
    if (playerIds.length === 0) return NextResponse.json({ watchlist: [] });

    // 플레이어 정보 조회
    const { data: players } = await supabase
      .from("profiles")
      .select("id, name, handle, avatar_url, position")
      .in("id", playerIds);

    const playersMap = Object.fromEntries((players ?? []).map((p) => [p.id, p]));

    // 최근 클립 날짜 조회
    const { data: clips } = await supabase
      .from("clips")
      .select("owner_id, created_at")
      .in("owner_id", playerIds)
      .order("created_at", { ascending: false });

    const lastClipMap: Record<string, string> = {};
    for (const c of clips ?? []) {
      if (!lastClipMap[c.owner_id]) lastClipMap[c.owner_id] = c.created_at;
    }

    const enriched = (watchlist ?? []).map((item) => ({
      ...item,
      player: playersMap[item.player_id] ?? null,
      last_clip_at: lastClipMap[item.player_id] ?? null,
    }));

    return NextResponse.json({ watchlist: enriched });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    // 인증 코치/스카우터 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified")
      .eq("id", user.id)
      .single();

    if (!profile || !canUseWatchlist(profile.role, profile.is_verified)) {
      return NextResponse.json(
        { error: "인증된 코치/스카우터만 워치리스트를 사용할 수 있습니다" },
        { status: 403 }
      );
    }

    const { player_id, note, notify_on_upload } = await req.json();

    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    if (player_id === user.id) {
      return NextResponse.json({ error: "본인을 추가할 수 없습니다" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scout_watchlist")
      .upsert(
        {
          scout_id: user.id,
          player_id,
          note: note ?? null,
          notify_on_upload: notify_on_upload ?? false,
        },
        { onConflict: "scout_id,player_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
