import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "highlight_ready"
  | "kudos"
  | "comment"
  | "follow"
  | "follow_back"
  | "medal"
  | "verified"
  | "verify_request"
  | "team_album"
  | "levelup_nudge"
  | "vote_open"
  | "mvp_result"
  | "mvp_win"
  | "watchlist_clip"
  | "coach_review"
  | "challenge_win"
  | "mention"
  | "dm_request"
  | "child_clip"
  | "child_medal"
  | "child_level_up";

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
  // 1. 알림 설정 확인 (푸시 ON/OFF + 조용한 시간)
  const prefCol = TYPE_TO_PREF[type];
  const { data: pref } = await supabase
    .from("notification_preferences")
    .select(`push_enabled, quiet_start, quiet_end${prefCol ? `, ${prefCol}` : ""}`)
    .eq("profile_id", userId)
    .single();

  if (pref) {
    // 특정 유형 알림 끔
    if (prefCol && (pref as unknown as Record<string, unknown>)[prefCol] === false) {
      return;
    }

    // E17: 조용한 시간 체크 — push_enabled=true인 경우만 적용 (DB insert는 항상 하되, 푸시만 차단)
    // 알림 DB INSERT는 항상 진행; quiet time 로직은 푸시 발송 시 적용됨을 기록
    if ((pref as unknown as Record<string, unknown>).push_enabled === false) {
      // push 비활성화 — DB insert만 하고 push 발송은 생략 (여기서는 DB insert만 담당)
    } else {
      const quietStart = (pref as unknown as Record<string, string | null>).quiet_start;
      const quietEnd = (pref as unknown as Record<string, string | null>).quiet_end;
      if (quietStart && quietEnd) {
        const now = new Date();
        const [sh, sm] = quietStart.split(":").map(Number);
        const [eh, em] = quietEnd.split(":").map(Number);
        const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const inQuiet = startMinutes > endMinutes
          ? nowMinutes >= startMinutes || nowMinutes < endMinutes  // 자정 넘는 구간 (22:00~08:00)
          : nowMinutes >= startMinutes && nowMinutes < endMinutes;
        if (inQuiet) {
          // 조용한 시간 — DB에만 기록, 푸시 발송 차단 표시
          await supabase.from("notifications").insert({
            user_id: userId, type, title,
            body: body ?? null, reference_id: referenceId ?? null,
            action_url: actionUrl ?? null, group_key: groupKey ?? null,
          });
          return; // 푸시 발송 없이 종료
        }
      }
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

/**
 * 자녀 활동 발생 시 연동된 모든 부모에게 알림을 보냅니다.
 */
export async function notifyLinkedParents(
  supabase: SupabaseClient,
  {
    childId,
    childName,
    type,
    title,
    body,
    referenceId,
    actionUrl,
  }: {
    childId: string;
    childName: string;
    type: NotificationType;
    title: string;
    body?: string;
    referenceId?: string;
    actionUrl?: string;
  }
) {
  const { data: links } = await supabase
    .from("parent_links")
    .select("parent_id")
    .eq("child_id", childId);

  if (!links || links.length === 0) return;

  await Promise.allSettled(
    links.map((link) =>
      createNotification(supabase, {
        userId: link.parent_id,
        type,
        title,
        body,
        referenceId,
        actionUrl,
        groupKey: `child_${childId}`,
      })
    )
  );
}
