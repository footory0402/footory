import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_HIGHLIGHTS_PER_PROFILE = 3;
const MAX_CLIPS_PER_REEL = 10;
const MAX_REEL_DURATION = 300; // 프론트엔드 MAX_DURATION과 동일 (5분)

/**
 * GET /api/highlights — 내 릴 목록
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { data: highlights } = await supabase
      .from("highlights")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (!highlights || highlights.length === 0) {
      return NextResponse.json({ highlights: [] });
    }

    // 첫 클립 썸네일 + 총 재생시간 조회 (최대 3개라 쿼리 부담 없음)
    const firstClipIds = highlights.map((h) => h.clip_ids[0]).filter(Boolean);
    const allClipIds = [...new Set(highlights.flatMap((h) => h.clip_ids))];

    const [{ data: firstClips }, { data: allClips }] = await Promise.all([
      supabase.from("clips").select("id, thumbnail_url").in("id", firstClipIds),
      supabase.from("clips").select("id, duration_seconds").in("id", allClipIds),
    ]);

    const thumbMap = new Map((firstClips ?? []).map((c) => [c.id, c.thumbnail_url]));
    const durMap = new Map((allClips ?? []).map((c) => [c.id, c.duration_seconds ?? 0]));

    const enriched = highlights.map((h) => ({
      ...h,
      thumbnail_url: thumbMap.get(h.clip_ids[0]) ?? null,
      total_duration: (h.clip_ids as string[]).reduce((s, id) => s + (durMap.get(id) ?? 0), 0),
    }));

    return NextResponse.json({ highlights: enriched });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/highlights — 릴 생성
 * Body: { clipIds: string[], title?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { allowed, retryAfter } = checkRateLimit(
      `highlights:${user.id}`,
      3_600_000,
      5
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const { clipIds, title } = body as {
      clipIds: string[];
      title?: string;
    };

    if (!clipIds || clipIds.length < 2) {
      return NextResponse.json(
        { error: "최소 2개 클립이 필요합니다" },
        { status: 400 }
      );
    }

    if (clipIds.length > MAX_CLIPS_PER_REEL) {
      return NextResponse.json(
        { error: `최대 ${MAX_CLIPS_PER_REEL}개 클립까지 가능합니다` },
        { status: 400 }
      );
    }

    // 프로필당 최대 3개 확인
    const { count } = await supabase
      .from("highlights")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if ((count ?? 0) >= MAX_HIGHLIGHTS_PER_PROFILE) {
      return NextResponse.json(
        { error: `하이라이트 릴은 최대 ${MAX_HIGHLIGHTS_PER_PROFILE}개까지 만들 수 있습니다` },
        { status: 400 }
      );
    }

    // 클립 소유권 + duration 확인
    const { data: clips } = await supabase
      .from("clips")
      .select("id, duration_seconds, rendered_url")
      .eq("owner_id", user.id)
      .in("id", clipIds);

    if (!clips || clips.length !== clipIds.length) {
      return NextResponse.json(
        { error: "일부 클립을 찾을 수 없습니다" },
        { status: 400 }
      );
    }

    const totalDuration = clips.reduce(
      (sum, c) => sum + (c.duration_seconds ?? 0),
      0
    );
    if (totalDuration > MAX_REEL_DURATION) {
      return NextResponse.json(
        { error: `총 길이가 ${MAX_REEL_DURATION}초를 초과합니다 (${totalDuration}초)` },
        { status: 400 }
      );
    }

    // 릴 생성
    const { data: highlight, error } = await supabase
      .from("highlights")
      .insert({
        owner_id: user.id,
        title: title ?? null,
        clip_ids: clipIds,
        status: "draft",
      })
      .select()
      .single();

    if (error || !highlight) {
      return NextResponse.json(
        { error: error?.message ?? "릴 생성 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ highlight }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
