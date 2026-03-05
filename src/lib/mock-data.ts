import type { Profile, Highlight, Stat, Medal, Season } from "./types";

export const MOCK_PROFILE: Profile = {
  id: "1",
  handle: "minjae_04",
  name: "김민재",
  position: "DF",
  subPosition: "CB",
  birthYear: 2012,
  city: "서울",
  teamName: "FC 서울 U-15",
  teamId: "t1",
  level: 3,
  xp: 420,
  bio: "중앙 수비수. 제공권과 빌드업이 강점.",
  followers: 48,
  following: 32,
  views: 312,
  contactPublic: false,
  role: "player",
  isVerified: false,
  mvpCount: 0,
  mvpTier: null,
  createdAt: "2025-09-01",
};

export const MOCK_HIGHLIGHTS: Highlight[] = [
  {
    id: "h1",
    clipId: "c1",
    startTime: 0,
    endTime: 30,
    videoUrl: "",
    tags: ["defense"],
    featured: true,
    featuredOrder: 1,
    createdAt: "2026-02-20",
  },
  {
    id: "h2",
    clipId: "c2",
    startTime: 10,
    endTime: 40,
    videoUrl: "",
    tags: ["pass"],
    featured: true,
    featuredOrder: 2,
    createdAt: "2026-02-25",
  },
];

export const MOCK_STATS: Stat[] = [
  { id: "s1", playerId: "1", type: "sprint_50m", value: 7.2, previousValue: 7.5, unit: "초", measuredAt: "2026-02-15", verified: true },
  { id: "s2", playerId: "1", type: "shuttle_run", value: 42, previousValue: 38, unit: "회", measuredAt: "2026-02-15", verified: false },
  { id: "s3", playerId: "1", type: "vertical_jump", value: 48, previousValue: 45, unit: "cm", measuredAt: "2026-02-15", verified: true },
];

export const MOCK_MEDALS: Medal[] = [
  { id: "m1", playerId: "1", type: "sprint_50m", label: "50m 스프린트", value: 7.2, unit: "초", verified: true, awardedAt: "2026-02-15" },
  { id: "m2", playerId: "1", type: "vertical_jump", label: "수직 점프", value: 48, unit: "cm", verified: false, awardedAt: "2026-02-10" },
  { id: "m3", playerId: "1", type: "shuttle_run", label: "셔틀런", value: 42, unit: "회", verified: true, awardedAt: "2026-01-20" },
];

export const MOCK_SEASONS: Season[] = [
  { id: "ss1", playerId: "1", year: 2026, teamName: "FC 서울 U-15", position: "DF", isCurrent: true, gamesPlayed: 22, goals: 3, assists: 1 },
  { id: "ss2", playerId: "1", year: 2025, teamName: "강남FC U-14", position: "DF", isCurrent: false, gamesPlayed: 18, goals: 1, assists: 2, notes: "수비 MVP" },
  { id: "ss3", playerId: "1", year: 2024, teamName: "강남FC U-13", position: "DF", isCurrent: false, gamesPlayed: 15, goals: 0, assists: 1 },
];

// Tag clips mock — which tags have clips
export const MOCK_TAG_CLIPS: Record<string, { id: string; duration: number; tag: string; isTop: boolean }[]> = {
  defense: [
    { id: "tc1", duration: 28, tag: "수비", isTop: true },
    { id: "tc2", duration: 25, tag: "수비", isTop: false },
    { id: "tc3", duration: 30, tag: "수비", isTop: false },
  ],
  pass: [
    { id: "tc4", duration: 22, tag: "패스", isTop: true },
    { id: "tc5", duration: 18, tag: "패스", isTop: false },
  ],
  physical: [
    { id: "tc6", duration: 30, tag: "피지컬", isTop: true },
  ],
  dribble: [],
  shoot: [],
  speed: [],
  iq: [],
};
