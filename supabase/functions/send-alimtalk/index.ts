import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KAKAO_ALIMTALK_API_KEY = Deno.env.get("KAKAO_ALIMTALK_API_KEY") || "";
const KAKAO_ALIMTALK_SENDER = Deno.env.get("KAKAO_ALIMTALK_SENDER") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://footory.app";

interface AlimtalkRequest {
  type: "mvp_win" | "weekly_recap";
  profileId?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { type, profileId }: AlimtalkRequest = await req.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  if (type === "mvp_win" && profileId) {
    // MVP 선정 알림톡
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, public_phone")
      .eq("id", profileId)
      .single();

    if (!profile?.public_phone) {
      return Response.json({ skipped: "no_phone" });
    }

    await sendAlimtalk({
      phone: profile.public_phone,
      templateCode: "FOOTORY_MVP_WIN",
      variables: {
        name: profile.name,
        url: `${APP_URL}/mvp`,
      },
    });

    return Response.json({ sent: "mvp_win" });
  }

  if (type === "weekly_recap") {
    // 부모 주간 리캡 알림톡
    const { data: parents } = await supabase
      .from("profiles")
      .select("id, name, public_phone")
      .eq("role", "parent")
      .not("public_phone", "is", null);

    if (!parents || parents.length === 0) {
      return Response.json({ skipped: "no_parents" });
    }

    let sentCount = 0;

    for (const parent of parents) {
      // 자녀 찾기
      const { data: links } = await supabase
        .from("parent_links")
        .select("child_id")
        .eq("parent_id", parent.id)
        .eq("consent_given", true);

      if (!links || links.length === 0) continue;

      for (const link of links) {
        const { data: child } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", link.child_id)
          .single();

        if (!child || !parent.public_phone) continue;

        // 이번 주 활동 집계
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [clips, kudos, mvpResult] = await Promise.all([
          supabase
            .from("clips")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", link.child_id)
            .gte("created_at", weekAgo),
          supabase
            .from("kudos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", link.child_id)
            .gte("created_at", weekAgo),
          supabase
            .from("weekly_mvp_results")
            .select("rank")
            .eq("profile_id", link.child_id)
            .eq("rank", 1)
            .gte("created_at", weekAgo)
            .maybeSingle(),
        ]);

        const isMvp = !!mvpResult.data;
        const mvpText = isMvp ? " MVP!" : "";

        await sendAlimtalk({
          phone: parent.public_phone,
          templateCode: "FOOTORY_WEEKLY_RECAP",
          variables: {
            childName: child.name,
            clipCount: String(clips.count ?? 0),
            kudosCount: String(kudos.count ?? 0),
            mvpText,
            url: APP_URL,
          },
        });

        sentCount++;
      }
    }

    return Response.json({ sent: sentCount });
  }

  return Response.json({ error: "Unknown type" }, { status: 400 });
});

async function sendAlimtalk(params: {
  phone: string;
  templateCode: string;
  variables: Record<string, string>;
}) {
  if (!KAKAO_ALIMTALK_API_KEY) {
    console.log("[AlimTalk] Mock send:", params);
    return;
  }

  // 카카오 알림톡 API 호출 (실제 발송)
  const res = await fetch("https://alimtalk-api.kakao.com/v1/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KAKAO_ALIMTALK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      senderKey: KAKAO_ALIMTALK_SENDER,
      templateCode: params.templateCode,
      recipientList: [
        {
          recipientNo: params.phone,
          templateParameter: params.variables,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[AlimTalk] Failed:", await res.text());
  }
}
