import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({ stat });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First, find the stat to get its stat_type
  const { data: stat, error: fetchError } = await supabase
    .from("stats")
    .select("stat_type")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (fetchError || !stat) {
    return NextResponse.json({ error: "Stat not found" }, { status: 404 });
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
}
