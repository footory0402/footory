import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import type {
  ScoutHomeData,
  ScoutRecentHighlight,
  ScoutRisingPlayer,
  ScoutWatchlistPreview,
} from "@/lib/home-types";

type ServerSupabase = SupabaseClient<Database>;

export async function fetchScoutHomeData(
  supabase: ServerSupabase,
  scoutId: string,
  canAccessWatchlist: boolean
): Promise<ScoutHomeData> {
  const [watchlist, rising, highlights] = await Promise.all([
    canAccessWatchlist
      ? fetchWatchlistPreview(supabase, scoutId)
      : Promise.resolve([] as ScoutWatchlistPreview[]),
    fetchRisingPlayers(supabase, 6),
    fetchRecentHighlights(supabase, 6),
  ]);

  return {
    watchlist,
    rising,
    highlights,
  };
}

async function fetchWatchlistPreview(
  supabase: ServerSupabase,
  scoutId: string
): Promise<ScoutWatchlistPreview[]> {
  const { data: watchlist, error } = await supabase
    .from("scout_watchlist")
    .select("player_id, created_at")
    .eq("scout_id", scoutId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !watchlist?.length) {
    return [];
  }

  const playerIds = watchlist.map((item) => item.player_id);

  const [{ data: players }, { data: clips }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, handle, avatar_url, position")
      .in("id", playerIds),
    supabase
      .from("clips")
      .select("owner_id, created_at")
      .in("owner_id", playerIds)
      .order("created_at", { ascending: false }),
  ]);

  const playersMap = new Map((players ?? []).map((player) => [player.id, player]));
  const lastClipMap: Record<string, string> = {};

  for (const clip of clips ?? []) {
    if (!lastClipMap[clip.owner_id]) {
      lastClipMap[clip.owner_id] = clip.created_at;
    }
  }

  return watchlist.reduce<ScoutWatchlistPreview[]>((items, item) => {
      const player = playersMap.get(item.player_id);
      if (!player) {
        return items;
      }

      items.push({
        id: player.id,
        name: player.name ?? "",
        handle: player.handle ?? "",
        avatar_url: player.avatar_url ?? undefined,
        position: player.position ?? undefined,
        last_clip_at: lastClipMap[item.player_id] ?? null,
      });
      return items;
    }, []);
}

async function fetchRisingPlayers(
  supabase: ServerSupabase,
  limit: number
): Promise<ScoutRisingPlayer[]> {
  const { data: risingData, error: risingError } = await supabase
    .from("player_ranking_cache")
    .select("profile_id, weekly_change")
    .gt("weekly_change", 0)
    .order("weekly_change", { ascending: false })
    .limit(limit);

  if (risingError) {
    return [];
  }

  if (!risingData?.length) {
    const { data: fallbackProfiles, error: fallbackError } = await supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return [];
    }

    return (fallbackProfiles ?? []).map((profile) => ({
      profile_id: profile.id,
      weekly_change: 0,
      handle: profile.handle,
      name: profile.name,
      avatar_url: profile.avatar_url,
      position: profile.position,
      level: profile.level ?? 1,
    }));
  }

  const profileIds = risingData.map((item) => item.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, position, level")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return risingData.map((item) => {
    const profile = profileMap.get(item.profile_id);
    return {
      profile_id: item.profile_id,
      weekly_change: item.weekly_change,
      handle: profile?.handle ?? "",
      name: profile?.name ?? "",
      avatar_url: profile?.avatar_url ?? null,
      position: profile?.position ?? null,
      level: profile?.level ?? 1,
    };
  });
}

async function fetchRecentHighlights(
  supabase: ServerSupabase,
  limit: number
): Promise<ScoutRecentHighlight[]> {
  const { data, error } = await supabase
    .from("feed_items")
    .select(
      "id, metadata, created_at, profiles!feed_items_profile_id_fkey(id, handle, name, avatar_url)"
    )
    .eq("type", "highlight")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  return data.map((item) => {
    const metadata = toRecord(item.metadata);
    const profile = toRecord(item.profiles);

    return {
      id: item.id,
      thumbnail_url: asNullableString(metadata.thumbnail_url),
      tags: asStringArray(metadata.tags),
      owner_name: asString(profile.name),
      owner_handle: asString(profile.handle),
      owner_avatar: asNullableString(profile.avatar_url),
      created_at: item.created_at ?? "",
    };
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
