import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "highlight_ready"
  | "kudos"
  | "comment"
  | "follow"
  | "medal"
  | "verified"
  | "verify_request"
  | "team_album"
  | "levelup_nudge"
  | "vote_open"
  | "mvp_result"
  | "mvp_win";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceId?: string;
}

export async function createNotification(
  supabase: SupabaseClient,
  { userId, type, title, body, referenceId }: CreateNotificationParams
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    reference_id: referenceId ?? null,
  });

  if (error) {
    console.error("[notifications] Failed to create:", error.message);
  }
}
