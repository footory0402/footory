import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clip_id = req.nextUrl.searchParams.get("clip_id");
  if (!clip_id) {
    return NextResponse.json({ error: "clip_id required" }, { status: 400 });
  }

  const { data: reviews, error } = await supabase
    .from("coach_reviews")
    .select(
      `id, coach_id, clip_id, comment, private_note, rating, hidden_by_owner, created_at,
       coach:profiles!coach_id(id, name, handle, avatar_url, is_verified)`
    )
    .eq("clip_id", clip_id)
    .eq("hidden_by_owner", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 클립 오너 확인
  const { data: clip } = await supabase
    .from("clips")
    .select("owner_id")
    .eq("id", clip_id)
    .single();

  const isOwner = user && clip && clip.owner_id === user.id;

  // private_note 필터링: 코치 본인 or 클립 오너만 열람 가능
  const filtered = (reviews ?? []).map((r) => {
    const isCoach = user && r.coach_id === user.id;
    if (isCoach || isOwner) return r;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { private_note, ...rest } = r;
    return rest;
  });

  return NextResponse.json({ reviews: filtered });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 인증 코치/스카우터 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_verified, name")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_verified || profile.role !== "scout") {
    return NextResponse.json(
      { error: "인증된 코치/스카우터만 리뷰를 남길 수 있습니다" },
      { status: 403 }
    );
  }

  const { clip_id, comment, private_note, rating } = await req.json();

  if (!clip_id || !rating) {
    return NextResponse.json({ error: "clip_id, rating required" }, { status: 400 });
  }

  const VALID_RATINGS = ["good", "great", "excellent"];
  if (!VALID_RATINGS.includes(rating)) {
    return NextResponse.json({ error: "유효하지 않은 평가입니다" }, { status: 400 });
  }

  if (comment && comment.length > 80) {
    return NextResponse.json({ error: "코멘트는 80자 이내입니다" }, { status: 400 });
  }

  if (private_note && private_note.length > 200) {
    return NextResponse.json({ error: "비공개 피드백은 200자 이내입니다" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("coach_reviews")
    .upsert(
      {
        coach_id: user.id,
        clip_id,
        comment: comment ?? null,
        private_note: private_note ?? null,
        rating,
      },
      { onConflict: "coach_id,clip_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 클립 오너에게 알림
  const { data: clip } = await supabase
    .from("clips")
    .select("owner_id")
    .eq("id", clip_id)
    .single();

  if (clip && clip.owner_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: clip.owner_id,
      type: "coach_review",
      title: "코치 리뷰",
      body: `📋 ${profile.name} 코치가 리뷰를 남겼어요`,
      reference_id: clip_id,
      action_url: `/clips/${clip_id}`,
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}
