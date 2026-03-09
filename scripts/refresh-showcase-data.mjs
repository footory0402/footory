import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getKstWeekStart(offsetWeeks = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const day = kst.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() + diff + offsetWeeks * 7);
  return monday.toISOString().slice(0, 10);
}

function isoFromWeek(weekOffset, dayOffset, hourUtc, minuteUtc = 0) {
  const base = new Date(`${getKstWeekStart(weekOffset)}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return base.toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function secondsAgo(seconds) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

const IDS = {
  teams: {
    suwon: "b0000000-0000-0000-0000-000000000001",
    seongnam: "b0000000-0000-0000-0000-000000000002",
    busan: "b0000000-0000-0000-0000-000000000003",
    legacy: "b0000000-0000-0000-0000-000000000010",
  },
  profiles: {
    minjun: "a0000001-0000-0000-0000-000000000001",
    seojun: "a0000002-0000-0000-0000-000000000002",
    siwoo: "a0000005-0000-0000-0000-000000000005",
    jiho: "a0000006-0000-0000-0000-000000000006",
    hyunwoo: "a0000011-0000-0000-0000-000000000011",
    junhyuk: "a0000012-0000-0000-0000-000000000012",
    parentSoyeon: "a0000101-0000-0000-0000-000000000101",
    parentJiyoung: "a0000102-0000-0000-0000-000000000102",
    coachJinwoo: "a0000201-0000-0000-0000-000000000201",
    scoutHanseo: "a0000202-0000-0000-0000-000000000202",
  },
  challenge: "e7000000-0000-0000-0000-000000000099",
  coachReviews: {
    minjun: "e3000000-0000-0000-0000-000000000091",
    junhyuk: "e3000000-0000-0000-0000-000000000092",
  },
};

const media = {
  videos: [
    "https://assets.mixkit.co/videos/43484/43484-1080.mp4",
    "https://assets.mixkit.co/videos/43494/43494-1080.mp4",
    "https://assets.mixkit.co/videos/43495/43495-1080.mp4",
    "https://assets.mixkit.co/videos/43487/43487-1080.mp4",
    "https://assets.mixkit.co/videos/43499/43499-1080.mp4",
    "https://assets.mixkit.co/videos/43491/43491-1080.mp4",
  ],
  thumbs: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=960",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=960",
    "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=960",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=960",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=960",
    "https://images.unsplash.com/photo-1600679472829-3044539ce8ed?w=960",
  ],
};

const clipSeed = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    owner_id: IDS.profiles.minjun,
    uploaded_by: null,
    memo: "왼발 감아차기와 박스 앞 턴 동작이 모두 살아난 주말 평가전 하이라이트",
    duration_seconds: 34,
    highlight_start: 6,
    highlight_end: 28,
    created_at: secondsAgo(6),
    tags: ["슈팅", "1v1 돌파"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    owner_id: IDS.profiles.seojun,
    uploaded_by: IDS.profiles.parentSoyeon,
    memo: "보호자 업로드: 압박을 벗겨내는 전개 패스와 전환 장면",
    duration_seconds: 31,
    highlight_start: 5,
    highlight_end: 24,
    created_at: secondsAgo(12),
    tags: ["전진패스", "퍼스트터치"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    owner_id: IDS.profiles.siwoo,
    uploaded_by: null,
    memo: "터치라인 근처 1대1 돌파 후 컷백 연결 장면",
    duration_seconds: 27,
    highlight_start: 4,
    highlight_end: 22,
    created_at: secondsAgo(18),
    tags: ["1v1 돌파", "슈팅"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    owner_id: IDS.profiles.jiho,
    uploaded_by: null,
    memo: "하프스페이스 침투 후 오른발 마무리 2연속",
    duration_seconds: 29,
    highlight_start: 6,
    highlight_end: 24,
    created_at: secondsAgo(24),
    tags: ["슈팅", "퍼스트터치"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000005",
    owner_id: IDS.profiles.hyunwoo,
    uploaded_by: null,
    memo: "세트피스에서 만든 프리킥과 전개 패스 하이라이트",
    duration_seconds: 33,
    highlight_start: 7,
    highlight_end: 27,
    created_at: secondsAgo(30),
    tags: ["슈팅", "전진패스"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000006",
    owner_id: IDS.profiles.junhyuk,
    uploaded_by: IDS.profiles.parentJiyoung,
    memo: "보호자 업로드: 문전 헤딩과 몸싸움 후 마무리 장면",
    duration_seconds: 26,
    highlight_start: 4,
    highlight_end: 20,
    created_at: secondsAgo(36),
    tags: ["헤딩경합", "슈팅"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000007",
    owner_id: IDS.profiles.seojun,
    uploaded_by: null,
    memo: "지난주 연습경기에서 중앙을 가르는 스루패스 모음",
    duration_seconds: 28,
    highlight_start: 5,
    highlight_end: 23,
    created_at: isoFromWeek(-1, 3, 11),
    tags: ["전진패스", "퍼스트터치"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000008",
    owner_id: IDS.profiles.siwoo,
    uploaded_by: null,
    memo: "지난주 오른쪽 측면 돌파 후 슈팅 장면",
    duration_seconds: 24,
    highlight_start: 4,
    highlight_end: 18,
    created_at: isoFromWeek(-1, 4, 13),
    tags: ["1v1 돌파", "슈팅"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000009",
    owner_id: IDS.profiles.junhyuk,
    uploaded_by: IDS.profiles.parentJiyoung,
    memo: "지난주 제공권 경합 후 세컨드볼 마무리",
    duration_seconds: 25,
    highlight_start: 5,
    highlight_end: 19,
    created_at: isoFromWeek(-1, 2, 10),
    tags: ["헤딩경합", "슈팅"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000010",
    owner_id: IDS.profiles.seojun,
    uploaded_by: null,
    memo: "2주 전 템포 조절 후 전환 패스 플레이",
    duration_seconds: 30,
    highlight_start: 6,
    highlight_end: 24,
    created_at: isoFromWeek(-2, 3, 12),
    tags: ["전진패스", "퍼스트터치"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000011",
    owner_id: IDS.profiles.siwoo,
    uploaded_by: null,
    memo: "2주 전 컷인 이후 니어포스트 슈팅 장면",
    duration_seconds: 22,
    highlight_start: 3,
    highlight_end: 17,
    created_at: isoFromWeek(-2, 5, 14),
    tags: ["1v1 돌파", "슈팅"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000012",
    owner_id: IDS.profiles.junhyuk,
    uploaded_by: null,
    memo: "2주 전 몸싸움 후 침착한 원터치 마무리",
    duration_seconds: 23,
    highlight_start: 4,
    highlight_end: 18,
    created_at: isoFromWeek(-2, 1, 10),
    tags: ["퍼스트터치", "슈팅"],
  },
].map((clip, index) => ({
  ...clip,
  video_url: media.videos[index % media.videos.length],
  thumbnail_url: media.thumbs[index % media.thumbs.length],
  file_size_bytes: 4_100_000 + index * 110_000,
  highlight_status: "done",
}));

const feedSeed = clipSeed.map((clip, index) => ({
  id: `f1000000-0000-0000-0000-0000000000${String(index + 1).padStart(2, "0")}`,
  profile_id: clip.owner_id,
  type: "highlight",
  reference_id: clip.id,
  metadata: {
    memo: clip.memo,
    thumbnail_url: clip.thumbnail_url,
    tags: clip.tags,
    duration: clip.duration_seconds,
    uploaded_by_parent: Boolean(clip.uploaded_by),
    team_name:
      clip.owner_id === IDS.profiles.minjun ||
      clip.owner_id === IDS.profiles.seojun ||
      clip.owner_id === IDS.profiles.siwoo
        ? "수원FC U-15"
        : clip.owner_id === IDS.profiles.jiho
          ? "성남FC U-15"
          : "부산아이파크 U-15",
  },
  created_at: clip.created_at,
}));

const kudosSeed = [
  ["f1000000-0000-0000-0000-000000000001", IDS.profiles.jiho, secondsAgo(42)],
  ["f1000000-0000-0000-0000-000000000001", IDS.profiles.hyunwoo, secondsAgo(44)],
  ["f1000000-0000-0000-0000-000000000001", IDS.profiles.junhyuk, secondsAgo(46)],
  ["f1000000-0000-0000-0000-000000000002", IDS.profiles.minjun, secondsAgo(52)],
  ["f1000000-0000-0000-0000-000000000002", IDS.profiles.siwoo, secondsAgo(54)],
  ["f1000000-0000-0000-0000-000000000002", IDS.profiles.parentSoyeon, secondsAgo(56)],
  ["f1000000-0000-0000-0000-000000000003", IDS.profiles.minjun, secondsAgo(62)],
  ["f1000000-0000-0000-0000-000000000003", IDS.profiles.jiho, secondsAgo(64)],
  ["f1000000-0000-0000-0000-000000000004", IDS.profiles.hyunwoo, secondsAgo(70)],
  ["f1000000-0000-0000-0000-000000000004", IDS.profiles.seojun, secondsAgo(72)],
  ["f1000000-0000-0000-0000-000000000004", IDS.profiles.junhyuk, secondsAgo(74)],
  ["f1000000-0000-0000-0000-000000000005", IDS.profiles.jiho, secondsAgo(80)],
  ["f1000000-0000-0000-0000-000000000005", IDS.profiles.scoutHanseo, secondsAgo(82)],
  ["f1000000-0000-0000-0000-000000000006", IDS.profiles.hyunwoo, secondsAgo(88)],
  ["f1000000-0000-0000-0000-000000000006", IDS.profiles.coachJinwoo, secondsAgo(90)],
  ["f1000000-0000-0000-0000-000000000007", IDS.profiles.parentSoyeon, isoFromWeek(-1, 4, 8)],
  ["f1000000-0000-0000-0000-000000000007", IDS.profiles.minjun, isoFromWeek(-1, 4, 9)],
  ["f1000000-0000-0000-0000-000000000008", IDS.profiles.seojun, isoFromWeek(-1, 5, 8)],
  ["f1000000-0000-0000-0000-000000000009", IDS.profiles.scoutHanseo, isoFromWeek(-1, 2, 8)],
  ["f1000000-0000-0000-0000-000000000010", IDS.profiles.parentSoyeon, isoFromWeek(-2, 3, 8)],
  ["f1000000-0000-0000-0000-000000000011", IDS.profiles.jiho, isoFromWeek(-2, 5, 8)],
  ["f1000000-0000-0000-0000-000000000012", IDS.profiles.parentJiyoung, isoFromWeek(-2, 1, 8)],
].map(([feed_item_id, user_id, created_at], index) => ({
  id: `ac100000-0000-0000-0000-0000000000${String(index + 1).padStart(2, "0")}`,
  feed_item_id,
  user_id,
  reaction: "default",
  created_at,
}));

const commentSeed = [
  [
    "f1000000-0000-0000-0000-000000000001",
    IDS.profiles.coachJinwoo,
    "턴 이후 슈팅 타이밍이 훨씬 안정적입니다.",
    secondsAgo(48),
  ],
  [
    "f1000000-0000-0000-0000-000000000002",
    IDS.profiles.parentSoyeon,
    "경기 운영이 좋아져서 보기 편했어요!",
    secondsAgo(58),
  ],
  [
    "f1000000-0000-0000-0000-000000000004",
    IDS.profiles.hyunwoo,
    "침투 타이밍이 딱 맞았네.",
    secondsAgo(76),
  ],
  [
    "f1000000-0000-0000-0000-000000000006",
    IDS.profiles.scoutHanseo,
    "헤딩 이후 세컨드 동작까지 체크해보고 싶습니다.",
    secondsAgo(94),
  ],
  [
    "f1000000-0000-0000-0000-000000000007",
    IDS.profiles.parentSoyeon,
    "지난주 경기에서 패스 선택이 정말 좋았어요.",
    isoFromWeek(-1, 4, 10),
  ],
  [
    "f1000000-0000-0000-0000-000000000009",
    IDS.profiles.parentJiyoung,
    "문전 집중력이 좋아지고 있어요.",
    isoFromWeek(-1, 2, 11),
  ],
].map(([feed_item_id, user_id, content, created_at], index) => ({
  id: `ad100000-0000-0000-0000-0000000000${String(index + 1).padStart(2, "0")}`,
  feed_item_id,
  user_id,
  content,
  parent_id: null,
  created_at,
}));

const achievementSeed = [
  {
    id: "aa100000-0000-0000-0000-000000000001",
    profile_id: IDS.profiles.minjun,
    title: "득점왕",
    competition: "2025 전국소년체전 경기권역 예선",
    year: 2025,
    created_at: isoFromWeek(-18, 4, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000002",
    profile_id: IDS.profiles.minjun,
    title: "베스트 11",
    competition: "2025 수원권역 주말리그",
    year: 2025,
    created_at: isoFromWeek(-10, 5, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000003",
    profile_id: IDS.profiles.seojun,
    title: "도움왕",
    competition: "2025 화성 친선 토너먼트",
    year: 2025,
    created_at: isoFromWeek(-12, 3, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000004",
    profile_id: IDS.profiles.siwoo,
    title: "베스트 11",
    competition: "2025 남부권 U-15 리그",
    year: 2025,
    created_at: isoFromWeek(-9, 4, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000005",
    profile_id: IDS.profiles.jiho,
    title: "MVP",
    competition: "2025 금석배 전국중등부",
    year: 2025,
    created_at: isoFromWeek(-20, 4, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000006",
    profile_id: IDS.profiles.hyunwoo,
    title: "베스트 11",
    competition: "2025 화랑대기 전국유소년대회",
    year: 2025,
    created_at: isoFromWeek(-16, 5, 9),
  },
  {
    id: "aa100000-0000-0000-0000-000000000007",
    profile_id: IDS.profiles.junhyuk,
    title: "최우수 공격상",
    competition: "2025 부산권역 교류전",
    year: 2025,
    created_at: isoFromWeek(-8, 6, 9),
  },
];

const timelineSeed = [
  {
    id: "ab100000-0000-0000-0000-000000000001",
    profile_id: IDS.profiles.minjun,
    event_type: "first_upload",
    event_data: {},
    clip_id: "c0000000-0000-0000-0000-000000000001",
    created_at: isoFromWeek(-30, 1, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000002",
    profile_id: IDS.profiles.minjun,
    event_type: "team_join",
    event_data: { team_name: "수원FC U-15" },
    clip_id: null,
    created_at: isoFromWeek(-28, 2, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000003",
    profile_id: IDS.profiles.minjun,
    event_type: "achievement",
    event_data: { title: "득점왕", competition: "2025 전국소년체전 경기권역 예선" },
    clip_id: null,
    created_at: isoFromWeek(-18, 4, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000004",
    profile_id: IDS.profiles.minjun,
    event_type: "level_up",
    event_data: { level: 4 },
    clip_id: null,
    created_at: isoFromWeek(-8, 5, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000005",
    profile_id: IDS.profiles.minjun,
    event_type: "follower_milestone",
    event_data: { count: 100 },
    clip_id: null,
    created_at: isoFromWeek(-4, 3, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000006",
    profile_id: IDS.profiles.seojun,
    event_type: "team_join",
    event_data: { team_name: "수원FC U-15" },
    clip_id: null,
    created_at: isoFromWeek(-27, 2, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000007",
    profile_id: IDS.profiles.seojun,
    event_type: "achievement",
    event_data: { title: "도움왕", competition: "2025 화성 친선 토너먼트" },
    clip_id: null,
    created_at: isoFromWeek(-12, 3, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000008",
    profile_id: IDS.profiles.seojun,
    event_type: "kudos_milestone",
    event_data: { count: 50 },
    clip_id: null,
    created_at: isoFromWeek(-2, 6, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000009",
    profile_id: IDS.profiles.siwoo,
    event_type: "team_join",
    event_data: { team_name: "수원FC U-15" },
    clip_id: null,
    created_at: isoFromWeek(-26, 2, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000010",
    profile_id: IDS.profiles.siwoo,
    event_type: "achievement",
    event_data: { title: "베스트 11", competition: "2025 남부권 U-15 리그" },
    clip_id: null,
    created_at: isoFromWeek(-9, 4, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000011",
    profile_id: IDS.profiles.jiho,
    event_type: "mvp_win",
    event_data: { rank: 1 },
    clip_id: "c0000000-0000-0000-0000-000000000013",
    created_at: isoFromWeek(-20, 4, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000012",
    profile_id: IDS.profiles.jiho,
    event_type: "achievement",
    event_data: { title: "MVP", competition: "2025 금석배 전국중등부" },
    clip_id: null,
    created_at: isoFromWeek(-20, 4, 10),
  },
  {
    id: "ab100000-0000-0000-0000-000000000013",
    profile_id: IDS.profiles.jiho,
    event_type: "follower_milestone",
    event_data: { count: 150 },
    clip_id: null,
    created_at: isoFromWeek(-6, 5, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000014",
    profile_id: IDS.profiles.hyunwoo,
    event_type: "achievement",
    event_data: { title: "베스트 11", competition: "2025 화랑대기 전국유소년대회" },
    clip_id: null,
    created_at: isoFromWeek(-16, 5, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000015",
    profile_id: IDS.profiles.hyunwoo,
    event_type: "level_up",
    event_data: { level: 4 },
    clip_id: null,
    created_at: isoFromWeek(-5, 3, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000016",
    profile_id: IDS.profiles.junhyuk,
    event_type: "achievement",
    event_data: { title: "최우수 공격상", competition: "2025 부산권역 교류전" },
    clip_id: null,
    created_at: isoFromWeek(-8, 6, 9),
  },
  {
    id: "ab100000-0000-0000-0000-000000000017",
    profile_id: IDS.profiles.junhyuk,
    event_type: "kudos_milestone",
    event_data: { count: 30 },
    clip_id: null,
    created_at: isoFromWeek(-1, 4, 9),
  },
];

const legacyTeam = {
  id: IDS.teams.legacy,
  handle: "suwon-dream-u12",
  name: "수원 드림 U-12",
  logo_url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=640",
  description: "기초기술과 패스 템포를 중점적으로 다듬는 수원 지역 주니어 육성팀.",
  city: "수원",
  founded_year: 2021,
  invite_code: "dream12x",
  created_by: IDS.profiles.minjun,
  created_at: isoFromWeek(-90, 2, 9),
};

const weeklyVotes = [
  ["ae100000-0000-0000-0000-000000000001", "a0000003-0000-0000-0000-000000000003", "c1000000-0000-0000-0000-000000000004", secondsAgo(100)],
  ["ae100000-0000-0000-0000-000000000002", "a0000004-0000-0000-0000-000000000004", "c1000000-0000-0000-0000-000000000001", secondsAgo(98)],
  ["ae100000-0000-0000-0000-000000000003", "a0000005-0000-0000-0000-000000000005", "c1000000-0000-0000-0000-000000000004", secondsAgo(96)],
  ["ae100000-0000-0000-0000-000000000004", "a0000007-0000-0000-0000-000000000007", "c1000000-0000-0000-0000-000000000001", secondsAgo(94)],
  ["ae100000-0000-0000-0000-000000000005", "a0000008-0000-0000-0000-000000000008", "c1000000-0000-0000-0000-000000000004", secondsAgo(92)],
  ["ae100000-0000-0000-0000-000000000006", "a0000009-0000-0000-0000-000000000009", "c1000000-0000-0000-0000-000000000006", secondsAgo(90)],
  ["ae100000-0000-0000-0000-000000000007", "a0000010-0000-0000-0000-000000000010", "c1000000-0000-0000-0000-000000000001", secondsAgo(88)],
  ["ae100000-0000-0000-0000-000000000008", "a0000011-0000-0000-0000-000000000011", "c1000000-0000-0000-0000-000000000004", secondsAgo(86)],
  ["ae100000-0000-0000-0000-000000000009", "a0000013-0000-0000-0000-000000000013", "c1000000-0000-0000-0000-000000000002", secondsAgo(84)],
  ["ae100000-0000-0000-0000-000000000010", "a0000014-0000-0000-0000-000000000014", "c1000000-0000-0000-0000-000000000006", secondsAgo(82)],
  ["ae100000-0000-0000-0000-000000000011", "a0000015-0000-0000-0000-000000000015", "c1000000-0000-0000-0000-000000000005", secondsAgo(80)],
  ["ae100000-0000-0000-0000-000000000012", IDS.profiles.coachJinwoo, "c1000000-0000-0000-0000-000000000001", secondsAgo(78)],
].map(([id, voter_id, clip_id, created_at]) => ({
  id,
  voter_id,
  clip_id,
  week_start: getKstWeekStart(0),
  message: null,
  created_at,
}));

const lastWeekVotes = [
  ["ae100000-0000-0000-0000-000000000101", "a0000003-0000-0000-0000-000000000003", "c1000000-0000-0000-0000-000000000007", isoFromWeek(-1, 4, 12)],
  ["ae100000-0000-0000-0000-000000000102", "a0000004-0000-0000-0000-000000000004", "c1000000-0000-0000-0000-000000000009", isoFromWeek(-1, 4, 13)],
  ["ae100000-0000-0000-0000-000000000103", "a0000005-0000-0000-0000-000000000005", "c1000000-0000-0000-0000-000000000007", isoFromWeek(-1, 5, 11)],
  ["ae100000-0000-0000-0000-000000000104", "a0000011-0000-0000-0000-000000000011", "c1000000-0000-0000-0000-000000000009", isoFromWeek(-1, 5, 12)],
].map(([id, voter_id, clip_id, created_at]) => ({
  id,
  voter_id,
  clip_id,
  week_start: getKstWeekStart(-1),
  message: null,
  created_at,
}));

const currentResults = [
  ["af100000-0000-0000-0000-000000000001", 1, "c1000000-0000-0000-0000-000000000004", IDS.profiles.jiho, 640, 290, 930, 4],
  ["af100000-0000-0000-0000-000000000002", 2, "c1000000-0000-0000-0000-000000000001", IDS.profiles.minjun, 625, 270, 895, 4],
  ["af100000-0000-0000-0000-000000000003", 3, "c1000000-0000-0000-0000-000000000006", IDS.profiles.junhyuk, 598, 210, 808, 2],
  ["af100000-0000-0000-0000-000000000004", 4, "c1000000-0000-0000-0000-000000000002", IDS.profiles.seojun, 570, 160, 730, 1],
  ["af100000-0000-0000-0000-000000000005", 5, "c1000000-0000-0000-0000-000000000003", IDS.profiles.siwoo, 555, 120, 675, 0],
  ["af100000-0000-0000-0000-000000000006", 6, "c1000000-0000-0000-0000-000000000005", IDS.profiles.hyunwoo, 540, 150, 690, 1],
].map(([id, rank, clip_id, profile_id, auto_score, vote_score, total_score, vote_count]) => ({
  id,
  week_start: getKstWeekStart(0),
  rank,
  clip_id,
  profile_id,
  auto_score,
  vote_score,
  total_score,
  vote_count,
  created_at: secondsAgo(72),
}));

const lastWeekResults = [
  ["af100000-0000-0000-0000-000000000101", 1, "c1000000-0000-0000-0000-000000000009", IDS.profiles.junhyuk, 610, 240, 850, 2],
  ["af100000-0000-0000-0000-000000000102", 2, "c1000000-0000-0000-0000-000000000007", IDS.profiles.seojun, 590, 220, 810, 2],
  ["af100000-0000-0000-0000-000000000103", 4, "c1000000-0000-0000-0000-000000000008", IDS.profiles.siwoo, 545, 160, 705, 0],
].map(([id, rank, clip_id, profile_id, auto_score, vote_score, total_score, vote_count]) => ({
  id,
  week_start: getKstWeekStart(-1),
  rank,
  clip_id,
  profile_id,
  auto_score,
  vote_score,
  total_score,
  vote_count,
  created_at: isoFromWeek(-1, 6, 12),
}));

const notifications = [
  {
    id: "ba100000-0000-0000-0000-000000000001",
    user_id: IDS.profiles.minjun,
    type: "comment",
    title: "새 댓글이 달렸어요",
    body: "박진우 코치가 최근 하이라이트에 피드백을 남겼습니다.",
    reference_id: "f1000000-0000-0000-0000-000000000001",
    read: false,
    group_key: "comment:f1000000-0000-0000-0000-000000000001",
    action_url: "/p/minjun_10",
    created_at: secondsAgo(68),
  },
  {
    id: "ba100000-0000-0000-0000-000000000002",
    user_id: IDS.profiles.minjun,
    type: "mvp_result",
    title: "현재 MVP 2위",
    body: "이번 주 순위가 갱신됐어요. 마지막까지 응원 받아보세요.",
    reference_id: "c1000000-0000-0000-0000-000000000001",
    read: false,
    group_key: null,
    action_url: "/mvp",
    created_at: secondsAgo(66),
  },
  {
    id: "ba100000-0000-0000-0000-000000000003",
    user_id: IDS.profiles.parentSoyeon,
    type: "weekly_recap",
    title: "주간 리캡이 준비됐어요",
    body: "이서준 선수의 지난주 활동 요약을 확인해보세요.",
    reference_id: IDS.profiles.seojun,
    read: false,
    group_key: null,
    action_url: `/?child=${IDS.profiles.seojun}`,
    created_at: secondsAgo(64),
  },
  {
    id: "ba100000-0000-0000-0000-000000000004",
    user_id: IDS.profiles.scoutHanseo,
    type: "watchlist_upload",
    title: "관심 선수 업로드",
    body: "김민준 선수가 새로운 슈팅 영상을 올렸어요.",
    reference_id: "c1000000-0000-0000-0000-000000000001",
    read: false,
    group_key: null,
    action_url: "/p/minjun_10",
    created_at: secondsAgo(62),
  },
  {
    id: "ba100000-0000-0000-0000-000000000005",
    user_id: IDS.profiles.junhyuk,
    type: "coach_review",
    title: "코치 리뷰 도착",
    body: "박진우 코치가 최근 장면을 분석했어요.",
    reference_id: "c1000000-0000-0000-0000-000000000006",
    read: false,
    group_key: null,
    action_url: "/profile",
    created_at: secondsAgo(60),
  },
];

const questProgress = [
  {
    id: "bb100000-0000-0000-0000-000000000001",
    profile_id: IDS.profiles.minjun,
    quest_type: "weekly",
    quest_key: `weekly_upload_${getKstWeekStart(0)}`,
    completed_at: secondsAgo(58),
    created_at: secondsAgo(58),
  },
  {
    id: "bb100000-0000-0000-0000-000000000002",
    profile_id: IDS.profiles.minjun,
    quest_type: "weekly",
    quest_key: `weekly_vote_${getKstWeekStart(0)}`,
    completed_at: null,
    created_at: secondsAgo(56),
  },
  {
    id: "bb100000-0000-0000-0000-000000000003",
    profile_id: IDS.profiles.minjun,
    quest_type: "weekly",
    quest_key: `weekly_kudos_${getKstWeekStart(0)}`,
    completed_at: null,
    created_at: secondsAgo(54),
  },
  {
    id: "bb100000-0000-0000-0000-000000000004",
    profile_id: IDS.profiles.jiho,
    quest_type: "weekly",
    quest_key: `weekly_upload_${getKstWeekStart(0)}`,
    completed_at: secondsAgo(52),
    created_at: secondsAgo(52),
  },
  {
    id: "bb100000-0000-0000-0000-000000000005",
    profile_id: IDS.profiles.jiho,
    quest_type: "weekly",
    quest_key: `weekly_vote_${getKstWeekStart(0)}`,
    completed_at: secondsAgo(50),
    created_at: secondsAgo(50),
  },
  {
    id: "bb100000-0000-0000-0000-000000000006",
    profile_id: IDS.profiles.jiho,
    quest_type: "weekly",
    quest_key: `weekly_kudos_${getKstWeekStart(0)}`,
    completed_at: secondsAgo(48),
    created_at: secondsAgo(48),
  },
  {
    id: "bb100000-0000-0000-0000-000000000007",
    profile_id: IDS.profiles.jiho,
    quest_type: "weekly",
    quest_key: `weekly_bonus_${getKstWeekStart(0)}`,
    completed_at: secondsAgo(46),
    created_at: secondsAgo(46),
  },
];

const playerRanking = [
  [IDS.profiles.jiho, 1004, 41],
  [IDS.profiles.minjun, 962, 36],
  [IDS.profiles.hyunwoo, 918, 28],
  [IDS.profiles.junhyuk, 874, 24],
  [IDS.profiles.seojun, 821, 19],
  [IDS.profiles.siwoo, 806, 18],
].map(([profile_id, popularity_score, weekly_change]) => ({
  profile_id,
  popularity_score,
  weekly_change,
  updated_at: new Date().toISOString(),
}));

const teamRanking = [
  [IDS.teams.seongnam, 1288, 8],
  [IDS.teams.suwon, 1214, 6],
  [IDS.teams.busan, 1180, 5],
].map(([team_id, activity_score, mvp_count]) => ({
  team_id,
  activity_score,
  mvp_count,
  updated_at: new Date().toISOString(),
}));

const coachReviews = [
  {
    id: IDS.coachReviews.minjun,
    coach_id: IDS.profiles.coachJinwoo,
    clip_id: "c1000000-0000-0000-0000-000000000001",
    comment: "턴 이후 바로 슈팅으로 연결되는 판단이 훨씬 빨라졌습니다.",
    private_note: "왼발 디딤발 각도만 조금 더 닫으면 슈팅 힘이 더 실립니다.",
    rating: "excellent",
    hidden_by_owner: false,
    created_at: secondsAgo(44),
  },
  {
    id: IDS.coachReviews.junhyuk,
    coach_id: IDS.profiles.coachJinwoo,
    clip_id: "c1000000-0000-0000-0000-000000000006",
    comment: "헤딩 낙하지점과 두 번째 동작이 깔끔합니다.",
    private_note: "상체 사용이 좋지만 착지 이후 방향 전환만 더 보완해보세요.",
    rating: "great",
    hidden_by_owner: false,
    created_at: secondsAgo(42),
  },
];

async function ensureProfilesExist(admin) {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .in("id", [
      IDS.profiles.minjun,
      IDS.profiles.seojun,
      IDS.profiles.siwoo,
      IDS.profiles.jiho,
      IDS.profiles.hyunwoo,
      IDS.profiles.junhyuk,
      IDS.profiles.parentSoyeon,
      IDS.profiles.parentJiyoung,
      IDS.profiles.coachJinwoo,
      IDS.profiles.scoutHanseo,
    ]);

  if (error) throw error;
  invariant((data ?? []).length === 10, "Expected showcase profiles to exist before refreshing data");
}

async function replaceRows(admin, table, key, values, rows, upsertOptions) {
  if (values.length > 0) {
    const { error: deleteError } = await admin.from(table).delete().in(key, values);
    if (deleteError) throw deleteError;
  }

  if (rows.length > 0) {
    const { error: insertError } = await admin.from(table).upsert(rows, upsertOptions);
    if (insertError) throw insertError;
  }
}

async function main() {
  invariant(fs.existsSync(ENV_PATH), ".env.local is required");

  const env = loadEnv(ENV_PATH);
  invariant(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL is required");
  invariant(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY is required");

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureProfilesExist(admin);

  const clipIds = clipSeed.map((clip) => clip.id);
  const feedIds = feedSeed.map((item) => item.id);
  const feedByClipId = new Map(feedSeed.map((item) => [item.reference_id, item.id]));
  const clipInsertRows = clipSeed.map(({ tags, ...clip }) => clip);
  const achievementIds = achievementSeed.map((item) => item.id);
  const timelineIds = timelineSeed.map((item) => item.id);
  const weeklyVoteIds = [...weeklyVotes, ...lastWeekVotes].map((item) => item.id);
  const weeklyResultIds = [...currentResults, ...lastWeekResults].map((item) => item.id);
  const notificationIds = notifications.map((item) => item.id);
  const questIds = questProgress.map((item) => item.id);
  const coachReviewIds = coachReviews.map((item) => item.id);

  await Promise.all([
    admin
      .from("profiles")
      .update({ challenge_wins: 1, mvp_count: 3, mvp_tier: "ace", views_count: 2650, followers_count: 144 })
      .eq("id", IDS.profiles.minjun),
    admin
      .from("profiles")
      .update({ challenge_wins: 0, views_count: 1685, followers_count: 94 })
      .eq("id", IDS.profiles.seojun),
    admin
      .from("profiles")
      .update({ challenge_wins: 1, views_count: 1930, followers_count: 109 })
      .eq("id", IDS.profiles.siwoo),
    admin
      .from("profiles")
      .update({ challenge_wins: 2, mvp_count: 5, mvp_tier: "allstar", views_count: 3360, followers_count: 164 })
      .eq("id", IDS.profiles.jiho),
    admin
      .from("profiles")
      .update({ challenge_wins: 1, mvp_count: 3, mvp_tier: "ace", views_count: 3040, followers_count: 151 })
      .eq("id", IDS.profiles.hyunwoo),
    admin
      .from("profiles")
      .update({ challenge_wins: 1, mvp_count: 2, mvp_tier: "rookie", views_count: 1895, followers_count: 101 })
      .eq("id", IDS.profiles.junhyuk),
  ]);

  const { error: teamError } = await admin.from("teams").upsert(legacyTeam, { onConflict: "id" });
  if (teamError) throw teamError;

  const { error: memberError } = await admin.from("team_members").upsert(
    [
      {
        team_id: IDS.teams.legacy,
        profile_id: IDS.profiles.minjun,
        role: "alumni",
        joined_at: isoFromWeek(-90, 2, 9),
      },
      {
        team_id: IDS.teams.legacy,
        profile_id: IDS.profiles.seojun,
        role: "alumni",
        joined_at: isoFromWeek(-88, 2, 9),
      },
    ],
    { onConflict: "team_id,profile_id" }
  );
  if (memberError) throw memberError;

  await replaceRows(admin, "achievements", "id", achievementIds, achievementSeed, { onConflict: "id" });
  await replaceRows(admin, "timeline_events", "id", timelineIds, timelineSeed, { onConflict: "id" });

  const { error: clipTagDeleteError } = await admin.from("clip_tags").delete().in("clip_id", clipIds);
  if (clipTagDeleteError) throw clipTagDeleteError;
  const { error: commentDeleteError } = await admin.from("comments").delete().in("feed_item_id", feedIds);
  if (commentDeleteError) throw commentDeleteError;
  const { error: kudosDeleteError } = await admin.from("kudos").delete().in("feed_item_id", feedIds);
  if (kudosDeleteError) throw kudosDeleteError;
  const { error: feedDeleteError } = await admin.from("feed_items").delete().in("id", feedIds);
  if (feedDeleteError) throw feedDeleteError;
  const { error: clipDeleteError } = await admin.from("clips").delete().in("id", clipIds);
  if (clipDeleteError) throw clipDeleteError;

  const { error: clipInsertError } = await admin.from("clips").insert(clipInsertRows);
  if (clipInsertError) throw clipInsertError;

  const clipTags = clipSeed.flatMap((clip) =>
    clip.tags.map((tag, tagIndex) => ({
      clip_id: clip.id,
      tag_name: tag,
      is_top: tagIndex === 0,
      created_at: clip.created_at,
    }))
  );
  const { error: clipTagsError } = await admin.from("clip_tags").insert(clipTags);
  if (clipTagsError) throw clipTagsError;

  const { error: feedInsertError } = await admin.from("feed_items").insert(feedSeed);
  if (feedInsertError) throw feedInsertError;

  const { error: kudosInsertError } = await admin.from("kudos").insert(kudosSeed);
  if (kudosInsertError) throw kudosInsertError;

  const { error: commentInsertError } = await admin.from("comments").insert(commentSeed);
  if (commentInsertError) throw commentInsertError;

  await replaceRows(admin, "weekly_votes", "id", weeklyVoteIds, [...weeklyVotes, ...lastWeekVotes], {
    onConflict: "id",
  });
  await replaceRows(admin, "weekly_mvp_results", "id", weeklyResultIds, [...currentResults, ...lastWeekResults], {
    onConflict: "id",
  });

  const { error: challengeError } = await admin.from("challenges").upsert(
    {
      id: IDS.challenge,
      title: "박스 앞 원터치 피니시",
      description: "박스 앞에서 첫 터치 후 바로 마무리되는 장면을 올려보세요.",
      skill_tag: "슈팅",
      week_start: getKstWeekStart(0),
      is_active: true,
      created_at: secondsAgo(40),
    },
    { onConflict: "id" }
  );
  if (challengeError) throw challengeError;

  await replaceRows(admin, "quest_progress", "id", questIds, questProgress, { onConflict: "id" });
  await replaceRows(admin, "notifications", "id", notificationIds, notifications, { onConflict: "id" });
  await replaceRows(admin, "coach_reviews", "id", coachReviewIds, coachReviews, { onConflict: "id" });

  const { error: playerRankingError } = await admin
    .from("player_ranking_cache")
    .upsert(playerRanking, { onConflict: "profile_id" });
  if (playerRankingError) throw playerRankingError;

  const { error: teamRankingError } = await admin
    .from("team_ranking_cache")
    .upsert(teamRanking, { onConflict: "team_id" });
  if (teamRankingError) throw teamRankingError;

  const currentWeekClipIds = clipSeed
    .filter((clip) => clip.created_at >= `${getKstWeekStart(0)}T00:00:00.000Z`)
    .map((clip) => clip.id);

  const summary = {
    currentWeek: getKstWeekStart(0),
    currentWeekClipCount: currentWeekClipIds.length,
    currentWeekFeedCount: feedSeed.filter((item) => currentWeekClipIds.includes(item.reference_id)).length,
    currentVoteCount: weeklyVotes.length,
    lastWeekResultCount: lastWeekResults.length,
    achievementsSeeded: achievementSeed.length,
    timelineSeeded: timelineSeed.length,
    refreshedNotifications: notifications.length,
    refreshedChallenge: IDS.challenge,
    alumniTeam: legacyTeam.handle,
    parentRecentFeed: feedByClipId.get("c1000000-0000-0000-0000-000000000002"),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
