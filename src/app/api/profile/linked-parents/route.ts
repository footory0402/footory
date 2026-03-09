import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 자녀 입장에서 연동된 부모 목록 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "player") {
    return NextResponse.json({ error: "Player role required" }, { status: 403 });
  }

  const { data: links, error } = await supabase
    .from("parent_links")
    .select("id, parent_id, created_at, profiles!parent_links_parent_id_fkey(id, handle, name, avatar_url)")
    .eq("child_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const parents = (links ?? []).map((link) => {
    const parent = link.profiles as unknown as {
      id: string; handle: string; name: string; avatar_url: string | null;
    };
    return {
      linkId: link.id,
      parentId: parent.id,
      handle: parent.handle,
      name: parent.name,
      avatarUrl: parent.avatar_url,
      linkedAt: link.created_at,
    };
  });

  return NextResponse.json(parents);
}

// DELETE: 자녀가 부모 연동 해제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId is required" }, { status: 400 });
  }

  // linkId가 실제로 이 자녀의 링크인지 확인
  const { data: link } = await supabase
    .from("parent_links")
    .select("id, child_id")
    .eq("id", linkId)
    .single();

  if (!link || link.child_id !== user.id) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // service role이 아니므로 RLS 우회 불가 → 직접 삭제 대신 API로 처리
  // 현재 RLS는 parent_id만 DELETE 허용하므로, 자녀 해제를 위해 별도 정책 필요
  // 023 마이그레이션에서 child_id도 DELETE 허용하도록 추가 예정
  const { error } = await supabase
    .from("parent_links")
    .delete()
    .eq("id", linkId)
    .eq("child_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
