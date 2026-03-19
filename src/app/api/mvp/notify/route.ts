import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

/**
 * POST /api/mvp/notify
 * Sends MVP-related notifications (admin/cron only)
 * Body: { type: "vote_open" | "mvp_result" | "mvp_win", weekStart?: string, winnerId?: string, winnerName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const body = await req.json();
    const { type } = body as { type: string };

    if (type === "vote_open") {
      const { data: players } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "player");

      const rows = (players ?? []).map((p) => ({
        user_id: p.id,
        type: "vote_open" as const,
        title: "이번 달 MVP 투표가 시작됐어요! 🏆",
        body: "매월 24일~말일 사이에 투표하세요",
      }));

      if (rows.length > 0) {
        await supabase.from("notifications").insert(rows);
      }

      return NextResponse.json({ success: true, sent: rows.length });
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

      const { data: players } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "player");

      const rows = (players ?? []).map((p) => ({
        user_id: p.id,
        type: "mvp_result" as const,
        title: `이번 달 MVP: ${winnerName} 🏆`,
        body: "MVP 탭에서 결과를 확인하세요",
      }));

      const winnerRow = {
        user_id: winner.profile_id,
        type: "mvp_win" as const,
        title: "축하해요! 이번 달 MVP에 선정됐어요! 🥇",
        body: "프로필에 MVP 뱃지가 표시됩니다",
      };

      const allRows = [...rows, winnerRow];
      if (allRows.length > 0) {
        await supabase.from("notifications").insert(allRows);
      }

      return NextResponse.json({ success: true, sent: allRows.length });
    }

    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
