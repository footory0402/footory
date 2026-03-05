import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, isVotingOpen } from "@/lib/mvp-scoring";
import { MAX_WEEKLY_VOTES } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const { allowed, retryAfter } = checkRateLimit(`mvp-vote:${user.id}`, 10_000, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // Parse body
  const body = await req.json();
  const { clipId, message } = body as { clipId: string; message?: string };
  if (!clipId) {
    return NextResponse.json({ error: "clipId is required" }, { status: 400 });
  }

  // Validate message length
  if (message && message.length > 100) {
    return NextResponse.json(
      { error: "응원 메시지는 100자 이내로 작성해주세요" },
      { status: 400 }
    );
  }

  // Check voting window (Saturday 09:00 ~ Sunday 23:59 KST)
  if (!isVotingOpen()) {
    return NextResponse.json(
      { error: "투표는 토요일 09:00 ~ 일요일 23:59에만 가능합니다" },
      { status: 403 }
    );
  }

  const weekStart = getWeekStart();

  // Check: clip exists
  const { data: clip } = await supabase
    .from("clips")
    .select("id, owner_id")
    .eq("id", clipId)
    .single();

  if (!clip) {
    return NextResponse.json(
      { error: "클립을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // Check: no self-vote
  if (clip.owner_id === user.id) {
    return NextResponse.json(
      { error: "본인 클립에는 투표할 수 없습니다" },
      { status: 403 }
    );
  }

  // Check: max 3 votes per week
  const { data: existingVotes } = await supabase
    .from("weekly_votes")
    .select("id, clip_id")
    .eq("voter_id", user.id)
    .eq("week_start", weekStart);

  const currentVoteCount = existingVotes?.length ?? 0;
  if (currentVoteCount >= MAX_WEEKLY_VOTES) {
    return NextResponse.json(
      { error: `이번 주 투표를 모두 사용했습니다 (${MAX_WEEKLY_VOTES}표)` },
      { status: 403 }
    );
  }

  // Check: no duplicate vote on same clip
  const alreadyVoted = existingVotes?.some((v) => v.clip_id === clipId);
  if (alreadyVoted) {
    return NextResponse.json(
      { error: "이미 이 클립에 투표했습니다" },
      { status: 409 }
    );
  }

  // Insert vote
  const { error: voteError } = await supabase.from("weekly_votes").insert({
    voter_id: user.id,
    clip_id: clipId,
    week_start: weekStart,
    message: message ?? null,
  });

  if (voteError) {
    // Handle unique constraint violation
    if (voteError.code === "23505") {
      return NextResponse.json(
        { error: "이미 이 클립에 투표했습니다" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: voteError.message },
      { status: 500 }
    );
  }

  // Auto-give kudos to the clip owner's feed item (if exists)
  const { data: feedItem } = await supabase
    .from("feed_items")
    .select("id")
    .eq("reference_id", clipId)
    .eq("type", "highlight")
    .limit(1)
    .single();

  if (feedItem) {
    await supabase.from("kudos").upsert(
      { feed_item_id: feedItem.id, user_id: user.id },
      { onConflict: "feed_item_id,user_id" }
    );
  }

  // Send notification to clip owner
  const { data: voter } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  await createNotification(supabase, {
    userId: clip.owner_id,
    type: "mvp_result",
    title: `${voter?.name ?? "누군가"}님이 MVP 투표를 보냈어요! 🗳️`,
    body: message || undefined,
    referenceId: clipId,
  });

  return NextResponse.json(
    {
      success: true,
      votesRemaining: MAX_WEEKLY_VOTES - (currentVoteCount + 1),
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clipId } = body as { clipId: string };
  if (!clipId) {
    return NextResponse.json({ error: "clipId is required" }, { status: 400 });
  }

  if (!isVotingOpen()) {
    return NextResponse.json(
      { error: "투표 기간에만 취소할 수 있습니다" },
      { status: 403 }
    );
  }

  const weekStart = getWeekStart();

  const { error: deleteError } = await supabase
    .from("weekly_votes")
    .delete()
    .eq("voter_id", user.id)
    .eq("clip_id", clipId)
    .eq("week_start", weekStart);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Remove kudos from the feed item as well
  const { data: feedItem } = await supabase
    .from("feed_items")
    .select("id")
    .eq("reference_id", clipId)
    .eq("type", "highlight")
    .limit(1)
    .single();

  if (feedItem) {
    await supabase
      .from("kudos")
      .delete()
      .eq("feed_item_id", feedItem.id)
      .eq("user_id", user.id);
  }

  // Get remaining votes
  const { data: remainingVotes } = await supabase
    .from("weekly_votes")
    .select("id")
    .eq("voter_id", user.id)
    .eq("week_start", weekStart);

  return NextResponse.json({
    success: true,
    votesRemaining: MAX_WEEKLY_VOTES - (remainingVotes?.length ?? 0),
  });
}
