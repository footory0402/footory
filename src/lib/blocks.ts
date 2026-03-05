"use client";

import { createClient } from "@/lib/supabase/client";

export async function blockUser(blockedId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (error && !error.message.includes("duplicate"))
    throw new Error(error.message);
}

export async function unblockUser(blockedId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
}

export async function isBlocked(userId: string, targetId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${userId})`
    )
    .maybeSingle();

  return !!data;
}

export async function getBlockedUsers(): Promise<
  { id: string; blockedId: string; name: string; handle: string; avatarUrl: string | null }[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, blocked_id")
    .eq("blocker_id", user.id);

  if (!blocks || blocks.length === 0) return [];

  const blockedIds = blocks.map((b) => b.blocked_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, handle, avatar_url")
    .in("id", blockedIds);

  return (profiles ?? []).map((p) => ({
    id: blocks.find((b) => b.blocked_id === p.id)!.id,
    blockedId: p.id,
    name: p.name,
    handle: p.handle,
    avatarUrl: p.avatar_url,
  }));
}
