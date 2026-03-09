export interface LinkedChild {
  linkId: string;
  childId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  position: string | null;
  level: number;
  medalCount: number;
  clipCount: number;
  linkedAt: string;
}

export interface ParentDashboardData {
  parentName: string;
  child: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    position: string | null;
    level: number;
    xp: number;
    followers_count: number;
    views_count: number;
  } | null;
  weeklyStats: {
    newClips: number;
    kudosReceived: number;
    profileViews: number;
    mvpRank: number | null;
    level: number;
  };
  prevWeeklyStats?: {
    newClips: number;
    kudosReceived: number;
  };
  recentActivity: {
    id: string;
    type: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }[];
  teamNews: {
    teamId: string;
    teamName: string;
    newClips: number;
  }[];
}

export interface ScoutWatchlistPreview {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string;
  position?: string;
  last_clip_at: string | null;
}

export interface ScoutRisingPlayer {
  profile_id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
  weekly_change: number;
}

export interface ScoutRecentHighlight {
  id: string;
  thumbnail_url: string | null;
  tags: string[];
  owner_name: string;
  owner_handle: string;
  owner_avatar: string | null;
  created_at: string;
}

export interface ScoutHomeData {
  watchlist: ScoutWatchlistPreview[];
  rising: ScoutRisingPlayer[];
  highlights: ScoutRecentHighlight[];
}
