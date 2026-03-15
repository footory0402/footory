import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

const VALID_CATEGORIES = ["fake_record", "inappropriate", "other"] as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 신고 남용 방지: 1시간에 5건
  const { allowed } = checkRateLimit(`report:${user.id}`, 3_600_000, 5);
  if (!allowed) {
    return NextResponse.json({ error: "신고 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const body = await request.json();
  const { statId, reportedId, category, description } = body;

  if (!statId || !reportedId) {
    return NextResponse.json({ error: "statId와 reportedId가 필요합니다" }, { status: 400 });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "유효하지 않은 신고 카테고리" }, { status: 400 });
  }

  // 자기 자신 신고 불가
  if (reportedId === user.id) {
    return NextResponse.json({ error: "자신의 기록은 신고할 수 없습니다" }, { status: 400 });
  }

  // 중복 신고 확인
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("stat_id", statId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 신고한 기록입니다" }, { status: 409 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id: reportedId,
    stat_id: statId,
    category,
    description: description?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
