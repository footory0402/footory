"use client";

import { createClient } from "@/lib/supabase/client";

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
