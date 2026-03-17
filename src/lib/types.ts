import type { Position } from "./constants";

export interface Profile {
  id: string;
  handle: string;
  name: string;
  position: Position | null;
  subPosition?: string;
  birthYear: number | null;
  city: string | null;
  teamName?: string;
  teamId?: string;
  avatarUrl?: string;
  bio?: string;
  followers: number;
  following: number;
  views: number;
  contact?: {
    phone?: string;
    email?: string;
    kakao?: string;
  };
  contactPublic: boolean;
  role: "player" | "parent" | "scout";
  authProvider?: string;
  isVerified: boolean;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredFoot?: string | null;
  mvpCount: number;
  mvpTier: MvpTier | null;
  challengeWins?: number;
  createdAt: string;
}

export type MvpTier = "rookie" | "ace" | "allstar" | "legend";

export interface Clip {
  id: string;
  playerId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  tags: string[];
  title?: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  clipId: string;
  startTime: number;
  endTime: number;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  featured: boolean;
  featuredOrder?: number;
  createdAt: string;
}

export interface Stat {
  id: string;
  playerId: string;
  type: string;
  value: number;
  previousValue?: number;
  unit: string;
  measuredAt: string;
  evidenceClipId?: string;
  verified: boolean;
  /** 최고 기록 (PR) */
  bestValue?: number;
  /** 최고 기록 여부 */
  isPR?: boolean;
  /** 최초 기록 값 */
  firstValue?: number;
  /** 최초 측정일 */
  firstMeasuredAt?: string;
  /** 총 측정 횟수 */
  measureCount?: number;
}

export interface Team {
  id: string;
  handle: string;
  name: string;
  logoUrl?: string;
  description?: string;
  city?: string;
  foundedYear?: number;
  memberCount: number;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  myRole?: "admin" | "member" | "alumni" | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  profileId: string;
  role: "admin" | "member" | "alumni";
  joinedAt: string;
  profile?: {
    id: string;
    handle: string;
    name: string;
    avatar_url: string | null;
    position: string | null;
  };
}

export interface TeamAlbumItem {
  id: string;
  teamId: string;
  uploadedBy: string | null;
  mediaType: "photo" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: "highlight" | "stat" | "team_join" | "season" | "featured_change" | "top_clip";
  playerId: string;
  playerName: string;
  playerHandle: string;
  playerAvatarUrl?: string;
  playerPosition: Position;
  teamName?: string;
  data: Record<string, unknown>;
  kudosCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Season {
  id: string;
  playerId: string;
  year: number;
  teamName: string;
  teamId?: string;
  isCurrent?: boolean;
  position: Position;
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  notes?: string;
}

export interface WeeklyVote {
  id: string;
  voterId: string;
  clipId: string;
  weekStart: string;
  message?: string;
  createdAt: string;
}

export interface WeeklyMvpResult {
  id: string;
  weekStart: string;
  rank: number;
  clipId: string;
  profileId: string;
  autoScore: number;
  voteScore: number;
  totalScore: number;
  voteCount: number;
  createdAt: string;
  profile?: Pick<Profile, "id" | "handle" | "name" | "avatarUrl" | "position" | "teamName">;
}

export interface PlayerRankingCache {
  profileId: string;
  popularityScore: number;
  weeklyChange: number;
  updatedAt: string;
  profile?: Pick<Profile, "id" | "handle" | "name" | "avatarUrl" | "position" | "teamName" | "mvpCount" | "mvpTier">;
}

export interface TeamRankingCache {
  teamId: string;
  activityScore: number;
  mvpCount: number;
  updatedAt: string;
  team?: Pick<Team, "id" | "handle" | "name" | "logoUrl" | "city" | "memberCount">;
}

// DM types
export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  // Joined fields
  otherUser?: Pick<Profile, "id" | "handle" | "name" | "avatarUrl" | "position" | "teamName">;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  sharedClipId: string | null;
  isRead: boolean;
  deletedAt: string | null;
  createdAt: string;
  // Joined fields
  sharedClip?: Pick<Clip, "id" | "videoUrl" | "thumbnailUrl" | "title"> | null;
}

// Safety types
export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export type ReportCategory = "harassment" | "spam" | "inappropriate" | "fake_record" | "other";

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  messageId?: string;
  commentId?: string;
  clipId?: string;
  statId?: string;
  category: ReportCategory;
  description?: string;
  status: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  profileId: string;
  title: string;
  competition?: string;
  year?: number;
  evidenceUrl?: string;
  createdAt: string;
}

export type TimelineEventType =
  | "first_upload"
  | "level_up"
  | "mvp_win"
  | "team_join"
  | "team_leave"
  | "achievement"
  | "follower_milestone"
  | "kudos_milestone";

export interface TimelineEvent {
  id: string;
  profileId: string;
  eventType: TimelineEventType;
  eventData: Record<string, unknown>;
  clipId?: string;
  createdAt: string;
}

export interface DmRequest {
  id: string;
  senderId: string;
  receiverId: string;
  previewMessage: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  sender?: Pick<Profile, "id" | "handle" | "name" | "avatarUrl" | "position" | "teamName">;
  receiver?: Pick<Profile, "id" | "handle" | "name" | "avatarUrl" | "position" | "teamName">;
}
