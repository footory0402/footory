import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;

interface PushPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  groupKey?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload: PushPayload = await req.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. 알림 설정 확인
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("push_enabled, quiet_start, quiet_end")
    .eq("profile_id", payload.userId)
    .single();

  if (prefs?.push_enabled === false) {
    return Response.json({ skipped: "push_disabled" });
  }

  // 2. quiet_hours 체크 (KST)
  if (prefs?.quiet_start && prefs?.quiet_end) {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const hhmm = kst.getUTCHours() * 100 + kst.getUTCMinutes();
    const start = parseInt(prefs.quiet_start.replace(":", ""));
    const end = parseInt(prefs.quiet_end.replace(":", ""));

    const isQuiet = start > end
      ? hhmm >= start || hhmm < end  // 22:00 ~ 08:00 (crosses midnight)
      : hhmm >= start && hhmm < end;

    if (isQuiet) {
      return Response.json({ skipped: "quiet_hours" });
    }
  }

  // 3. 활성 토큰 가져오기
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("id, token")
    .eq("profile_id", payload.userId)
    .eq("is_active", true);

  if (!tokens || tokens.length === 0) {
    return Response.json({ skipped: "no_tokens" });
  }

  // 4. FCM 발송
  const results = await Promise.allSettled(
    tokens.map(async ({ id, token }) => {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            url: payload.actionUrl || "/",
            type: payload.type,
            group_key: payload.groupKey || "",
          },
          webpush: {
            notification: {
              icon: "/icons/footory-192.png",
              badge: "/icons/badge-72.png",
              tag: payload.groupKey || payload.type,
            },
          },
        }),
      });

      const result = await res.json();

      // 실패한 토큰 비활성화
      if (result.failure > 0) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .eq("id", id);
      }

      return result;
    })
  );

  return Response.json({ sent: results.length });
});
