// weekly-recap: pg_cron에서 매주 월 09:00 KST에 호출
// send-alimtalk의 weekly_recap 타입으로 위임

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-alimtalk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "weekly_recap" }),
  });

  const result = await res.json();
  return Response.json({ ok: true, result });
});
