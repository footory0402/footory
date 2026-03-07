"use client";

import { createClient } from "@/lib/supabase/client";
import { isBlocked } from "@/lib/blocks";
import { getDmAction, type UserRole } from "@/lib/permissions";

export type DmPermission = "allowed" | "request" | "blocked";

export async function canSendDm(
  senderId: string,
  targetId: string
): Promise<DmPermission> {
  const supabase = createClient();

  // Check block
  const blocked = await isBlocked(senderId, targetId);
  if (blocked) return "blocked";

  // Check if same team
  const { data: senderTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", senderId)
    .neq("role", "alumni");

  const { data: targetTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", targetId)
    .neq("role", "alumni");

  const senderTeamIds = new Set((senderTeams ?? []).map((t) => t.team_id));
  const isSameTeam = (targetTeams ?? []).some((t) => senderTeamIds.has(t.team_id));
  if (isSameTeam) return "allowed";

  // Check if following
  const { data: followData } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", senderId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (followData) return "allowed";

  // Check if sender is verified coach
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("role, is_verified")
    .eq("id", senderId)
    .single();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("birth_year, role")
    .eq("id", targetId)
    .single();

  const currentYear = new Date().getFullYear();
  const isMinor = Boolean(
    targetProfile?.birth_year && currentYear - targetProfile.birth_year < 18
  );

  const action = getDmAction({
    senderRole: (senderProfile?.role ?? null) as UserRole | null,
    senderVerified: !!senderProfile?.is_verified,
    targetRole: (targetProfile?.role ?? "player") as UserRole,
    isFollowing: !!followData,
    isSameTeam,
    isBlocked: false,
    targetIsMinor: isMinor,
  });

  if (action.state === "allowed") return "allowed";
  if (action.state === "request") return "request";
  return "blocked";
}

export async function sendDmRequest(
  targetId: string,
  previewMessage: string
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("dm_requests").insert({
    sender_id: user.id,
    receiver_id: targetId,
    preview_message: previewMessage || null,
  });

  if (error && !error.message.includes("duplicate"))
    throw new Error(error.message);
}

export async function respondDmRequest(
  requestId: string,
  accept: boolean
): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const newStatus = accept ? "accepted" : "rejected";

  const { data: req } = await supabase
    .from("dm_requests")
    .update({ status: newStatus })
    .eq("id", requestId)
    .eq("receiver_id", user.id)
    .select("sender_id, preview_message")
    .single();

  if (!req) return null;

  // If accepted, create conversation
  if (accept) {
    const convId = await getOrCreateConversation(user.id, req.sender_id);

    // Send the preview message as first message
    if (req.preview_message) {
      await sendMessage(convId, req.preview_message);
    }

    return convId;
  }

  return null;
}

export async function getPendingDmRequests() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("dm_requests")
    .select("*")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return [];

  const senderIds = data.map((r) => r.sender_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, city")
    .in("id", senderIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((r) => {
    const p = profileMap.get(r.sender_id);
    return {
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      previewMessage: r.preview_message,
      status: r.status as "pending",
      createdAt: r.created_at,
      sender: p
        ? {
            id: p.id,
            handle: p.handle,
            name: p.name,
            avatarUrl: p.avatar_url ?? undefined,
            position: p.position,
            teamName: p.city ?? undefined,
          }
        : undefined,
    };
  });
}

export async function getOrCreateConversation(
  userId: string,
  targetId: string
): Promise<string> {
  const supabase = createClient();

  // Find existing conversation (check both orderings)
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_1.eq.${userId},participant_2.eq.${targetId}),and(participant_1.eq.${targetId},participant_2.eq.${userId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  // Create new
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      participant_1: userId,
      participant_2: targetId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  clipId?: string
): Promise<{ id: string; created_at: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || null,
      shared_clip_id: clipId || null,
    })
    .select("id, created_at")
    .single();

  if (error) throw new Error(error.message);

  // Update conversation preview
  const preview = content
    ? content.length > 50
      ? content.slice(0, 50) + "..."
      : content
    : "영상을 공유했습니다";

  await supabase
    .from("conversations")
    .update({
      last_message_at: data.created_at,
      last_message_preview: preview,
    })
    .eq("id", conversationId);

  return data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id);
}
