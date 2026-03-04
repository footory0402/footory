import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/mvp/notify
 * Sends MVP-related notifications (admin/cron only)
 * Body: { type: "vote_open" | "mvp_result" | "mvp_win", weekStart?: string, winnerId?: string, winnerName?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type } = body as { type: string };

  if (type === "vote_open") {
    // Broadcast to all players
    const { data: players } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "player");

    let sent = 0;
    for (const p of players ?? []) {
      await createNotification(supabase, {
        userId: p.id,
        type: "vote_open",
        title: "이번 주 MVP 투표가 시작됐어요! 🏆",
        body: "토요일~일요일 사이에 투표하세요",
      });
      sent++;
    }

    return NextResponse.json({ success: true, sent });
  }

  if (type === "mvp_result") {
    // Notify all players about the MVP result
    const { weekStart } = body as { weekStart: string };
    if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });

    // Get top 3
    const { data: results } = await supabase
      .from("weekly_mvp_results")
      .select("rank, profile_id, profiles!inner(name)")
      .eq("week_start", weekStart)
      .order("rank")
      .limit(3);

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const winner = results[0];
    const winnerName = (winner.profiles as unknown as { name: string })?.name ?? "선수";

    // Broadcast MVP result to all players
    const { data: players } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "player");

    let sent = 0;
    for (const p of players ?? []) {
      await createNotification(supabase, {
        userId: p.id,
        type: "mvp_result",
        title: `이번 주 MVP: ${winnerName} 🏆`,
        body: "MVP 탭에서 결과를 확인하세요",
      });
      sent++;
    }

    // Special notification to the winner
    await createNotification(supabase, {
      userId: winner.profile_id,
      type: "mvp_win",
      title: "축하해요! 이번 주 MVP에 선정됐어요! 🥇",
      body: "프로필에 MVP 뱃지가 표시됩니다",
    });

    return NextResponse.json({ success: true, sent: sent + 1 });
  }

  return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
}
