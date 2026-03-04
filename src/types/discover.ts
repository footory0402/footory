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
