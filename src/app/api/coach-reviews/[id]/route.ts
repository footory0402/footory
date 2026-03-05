import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { comment, private_note, rating } = await req.json();

  if (comment && comment.length > 80) {
    return NextResponse.json({ error: "코멘트는 80자 이내입니다" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("coach_reviews")
    .update({ comment, private_note, rating })
    .eq("id", id)
    .eq("coach_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("coach_reviews")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 클립 오너가 리뷰 숨기기
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hidden } = await req.json();

  // 본인 클립의 리뷰만 숨길 수 있음
  const { data: review } = await supabase
    .from("coach_reviews")
    .select("clip_id")
    .eq("id", id)
    .single();

  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: clip } = await supabase
    .from("clips")
    .select("owner_id")
    .eq("id", review.clip_id)
    .single();

  if (!clip || clip.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("coach_reviews")
    .update({ hidden_by_owner: hidden })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
