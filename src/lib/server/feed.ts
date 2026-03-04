import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItemEnriched } from "@/hooks/useFeed";

export const FEED_PAGE_SIZE = 20;

export async function fetchFeedPage(
  supabase: SupabaseClient,
  userId: string,
  cursor?: string | null
): Promise<{ items: FeedItemEnriched[]; nextCursor: string | null }> {
  const { data, error } = await supabase.rpc("get_feed_page", {
    p_user_id: userId,
    p_cursor: cursor ?? null,
    p_limit: FEED_PAGE_SIZE,
  });

  if (error || !data || data.length === 0) {
    return { items: [], nextCursor: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: FeedItemEnriched[] = (data as any[]).map((row) => ({
    id: row.id,
    profile_id: row.profile_id,
    type: row.type,
    reference_id: row.reference_id,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
    playerName: row.player_name ?? "Unknown",
    playerHandle: row.player_handle ?? "",
    playerAvatarUrl: row.player_avatar_url ?? null,
    playerLevel: row.player_level ?? 1,
    playerPosition: row.player_position ?? "MF",
    teamName: row.team_name ?? null,
    kudosCount: Number(row.kudos_count ?? 0),
    hasKudos: row.has_kudos ?? false,
    commentCount: Number(row.comment_count ?? 0),
  }));

  const nextCursor =
    items.length === FEED_PAGE_SIZE ? items[items.length - 1].created_at : null;

  return { items, nextCursor };
}
