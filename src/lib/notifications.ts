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

// NotificationType → notification_preferences 컬럼 매핑
const TYPE_TO_PREF: Partial<Record<NotificationType, string>> = {
  kudos: "kudos",
  comment: "comments",
  follow: "follows",
  vote_open: "vote_open",
  mvp_result: "mvp_result",
  mvp_win: "mvp_result",
  levelup_nudge: "upload_nudge",
};

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceId?: string;
  actionUrl?: string;
  groupKey?: string;
}

export async function createNotification(
  supabase: SupabaseClient,
  { userId, type, title, body, referenceId, actionUrl, groupKey }: CreateNotificationParams
) {
  // 1. 알림 설정 확인
  const prefCol = TYPE_TO_PREF[type];
  if (prefCol) {
    const { data: pref } = await supabase
      .from("notification_preferences")
      .select(prefCol)
      .eq("profile_id", userId)
      .single();

    if (pref && (pref as unknown as Record<string, unknown>)[prefCol] === false) {
      return; // 사용자가 이 유형 알림을 끔
    }
  }

  // 2. notifications INSERT
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    reference_id: referenceId ?? null,
    action_url: actionUrl ?? null,
    group_key: groupKey ?? null,
  });

  if (error) {
    console.error("[notifications] Failed to create:", error.message);
  }
}
