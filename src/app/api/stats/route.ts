import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { MEASUREMENTS, AGE_STAT_BOUNDS, getAgeGroup, getStatWarning } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyLinkedParents } from "@/lib/notifications";

export async function GET() {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // Fetch stats ordered by most recent
  const { data: stats, error } = await supabase
    .from("stats")
    .select("*")
    .eq("profile_id", user.id)
    .order("recorded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stats: stats ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { allowed, retryAfter } = checkRateLimit(`stats:${user.id}`, 60_000, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body = await request.json();
  const { statType, value, evidenceClipId } = body;

  // Validate stat type
  const measurement = MEASUREMENTS.find((m) => m.id === statType);
  if (!measurement) {
    return NextResponse.json({ error: "Invalid stat type" }, { status: 400 });
  }

  if (typeof value !== "number" || value <= 0) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  // 연령별 범위 검증
  const { data: profile } = await supabase
    .from("profiles")
    .select("birth_year")
    .eq("id", user.id)
    .single();

  const birthYear = profile?.birth_year as number | null;
  const ageBounds = AGE_STAT_BOUNDS[statType];
  const ageGroup = getAgeGroup(birthYear);

  if (ageBounds) {
    const bounds = ageBounds[ageGroup];
    if (value < bounds.min || value > bounds.max) {
      return NextResponse.json({
        error: `이 연령대(${ageGroup.toUpperCase()})에서 입력 가능한 범위를 벗어났습니다 (${bounds.min}~${bounds.max})`,
      }, { status: 400 });
    }
  }

  // 같은 종목 하루 1회 제한
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("stats")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("stat_type", statType)
    .gte("recorded_at", todayStart.toISOString());

  if (todayCount && todayCount >= 1) {
    return NextResponse.json({
      error: "같은 종목은 하루에 1회만 기록할 수 있습니다",
    }, { status: 429 });
  }

  // 경고 메시지 생성 (차단하지는 않음)
  const warning = getStatWarning(statType, value, birthYear);

  // Insert stat
  const { data: stat, error } = await supabase
    .from("stats")
    .insert({
      profile_id: user.id,
      stat_type: statType,
      value,
      unit: measurement.unit,
      evidence_clip_id: evidenceClipId || null,
    })
    .select()
    .single();

  if (error || !stat) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({
    stat,
    warning: warning?.type === "warning" ? warning.message : null,
  });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
