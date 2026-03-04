export interface DiscoverPlayer {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  level: number;
  position: string | null;
}

export interface DiscoverTeam {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  member_count: number;
}

export interface DiscoverMedal {
  id: string;
  icon: string | null;
  label: string | null;
  stat_type: string;
  profiles: {
    handle: string;
    name: string;
    level: number;
    avatar_url: string | null;
  } | null;
}

export interface DiscoverHighlight {
  id: string;
  metadata: {
    thumbnail_url?: string;
    duration?: number;
    tags?: string[];
  } | null;
  profiles: {
    handle: string;
    name: string;
    level: number;
    avatar_url: string | null;
  } | null;
}

// --- Sprint 11b: Explore tab types ---

export interface PlayerRankingItem {
  profile_id: string;
  popularity_score: number;
  weekly_change: number;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
  team_name: string | null;
  mvp_count: number;
  mvp_tier: string | null;
  followers_count: number;
  kudos_count: number;
}

export interface TeamRankingItem {
  team_id: string;
  activity_score: number;
  mvp_count: number;
  handle: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  member_count: number;
  clip_count: number;
}

export interface RisingPlayerItem {
  profile_id: string;
  weekly_change: number;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
}

export interface TagClipItem {
  id: string;
  tag_name: string;
  thumbnail_url: string | null;
  video_url: string;
  duration_seconds: number | null;
  owner_handle: string;
  owner_name: string;
}
