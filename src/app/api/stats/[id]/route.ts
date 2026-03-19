import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // 기존 값 조회 (audit log용)
  const { data: oldStat } = await supabase
    .from("stats")
    .select("stat_type, value")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!oldStat) {
    return NextResponse.json({ error: "Stat not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.value !== undefined) updates.value = body.value;
  if (body.evidenceClipId !== undefined) updates.evidence_clip_id = body.evidenceClipId || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data: stat, error } = await supabase
    .from("stats")
    .update(updates)
    .eq("id", id)
    .eq("profile_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log: 값 변경 기록
  if (body.value !== undefined && body.value !== oldStat.value) {
    await supabase.from("stat_audit_log").insert({
      stat_id: id,
      profile_id: user.id,
      action: "update",
      stat_type: oldStat.stat_type,
      old_value: oldStat.value,
      new_value: body.value,
    });
  }

  return NextResponse.json({ stat });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // First, find the stat to get its stat_type
  const { data: stat, error: fetchError } = await supabase
    .from("stats")
    .select("stat_type, value")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (fetchError || !stat) {
    return NextResponse.json({ error: "Stat not found" }, { status: 404 });
  }

  // Audit log: 삭제 전 기록
  // 해당 stat_type의 모든 records를 조회해서 각각 로그
  const { data: allStats } = await supabase
    .from("stats")
    .select("id, stat_type, value")
    .eq("stat_type", stat.stat_type)
    .eq("profile_id", user.id);

  if (allStats && allStats.length > 0) {
    const auditRows = allStats.map((s) => ({
      stat_id: s.id,
      profile_id: user.id,
      action: "delete" as const,
      stat_type: s.stat_type,
      old_value: s.value,
      new_value: null,
    }));
    await supabase.from("stat_audit_log").insert(auditRows);
  }

  // Delete ALL records of the same stat_type for this user
  const { error } = await supabase
    .from("stats")
    .delete()
    .eq("stat_type", stat.stat_type)
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
