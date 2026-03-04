import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItemEnriched } from "@/hooks/useFeed";

interface FeedPageRow {
  id: string;
  profile_id: string;
  type: FeedItemEnriched["type"];
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  player_name: string | null;
  player_handle: string | null;
  player_avatar_url: string | null;
  player_level: number | null;
  player_position: string | null;
  team_name: string | null;
  kudos_count: number | null;
  has_kudos: boolean | null;
  comment_count: number | null;
}

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

  const items: FeedItemEnriched[] = (data as FeedPageRow[]).map((row) => ({
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
