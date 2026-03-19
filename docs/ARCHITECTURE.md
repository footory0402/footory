# FOOTORY 기술 아키텍처

## 1. 시스템 구성도

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  사용자       │     │  Vercel      │     │  Supabase        │
│  (모바일 웹)  │────▶│  Next.js     │────▶│  Auth (카카오)    │
│              │     │  App Router  │     │  PostgreSQL      │
└──────────────┘     └──────────────┘     │  Edge Functions  │
                                          │  Realtime        │
       │                                  │  Storage (이미지) │
       │                                  └──────────────────┘
       │
       │  영상 업로드 (Presigned URL)
       ▼
┌──────────────────┐
│  Cloudflare R2   │
│  (영상 저장)      │───▶ Cloudflare CDN (무료 전송)
│  footory-videos  │
└──────────────────┘
```

## 2. DB 스키마 (Supabase PostgreSQL)

### 2.1 사용자 & 프로필

```sql
-- 프로필 (선수/부모/기타)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'parent', 'other')),
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  position TEXT CHECK (position IN ('FW', 'MF', 'DF', 'GK')),
  birth_year INTEGER,
  city TEXT,
  bio TEXT,
  
  -- 레벨 시스템
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  
  -- 연락처 공개 설정
  public_email TEXT,
  public_phone TEXT,
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  
  -- 통계
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- MVP 실적 (v1.1)
  mvp_count INTEGER DEFAULT 0,
  mvp_tier TEXT CHECK (mvp_tier IN (NULL, 'rookie', 'ace', 'allstar', 'legend')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부모-자녀 연동
CREATE TABLE parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);
```

### 2.2 영상 & 하이라이트

```sql
-- 영상 클립
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id), -- 부모가 올린 경우 부모 ID
  
  -- R2 URL
  video_url TEXT NOT NULL,          -- 원본 영상 R2 URL
  highlight_url TEXT,                -- 스마트 트리밍 하이라이트 URL
  thumbnail_url TEXT,                -- 자동 생성 썸네일
  
  -- 메타데이터
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  memo TEXT,
  
  -- 하이라이트 상태
  highlight_status TEXT DEFAULT 'pending' 
    CHECK (highlight_status IN ('pending', 'processing', 'done', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 클립-태그 매핑
CREATE TABLE clip_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL CHECK (tag_name IN (
    '1v1 돌파', '슈팅', '퍼스트터치', '전진패스', '헤딩경합', '1v1 수비', '기타'
  )),
  is_top BOOLEAN DEFAULT FALSE,     -- 해당 태그의 대표 클립 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Featured 하이라이트 (대표 영상 1~3개)
CREATE TABLE featured_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, clip_id)
);
```

### 2.3 측정 기록 & 메달

```sql
-- 측정 기록
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,           -- 'sprint_50m', 'juggling', 'kick_power', 'run_1000m', 'push_ups', 'sargent_jump'
  value DECIMAL NOT NULL,            -- 수치값
  unit TEXT NOT NULL,                -- 's', '회', 'm' 등
  evidence_clip_id UUID REFERENCES clips(id),
  
  -- 검증
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),  -- 팀 관리자
  verified_at TIMESTAMPTZ,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메달
CREATE TABLE medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medal_code TEXT NOT NULL,          -- 'sprint_5.0', 'juggling_300' 등
  stat_id UUID REFERENCES stats(id),
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메달 기준 정의
CREATE TABLE medal_criteria (
  code TEXT PRIMARY KEY,
  stat_type TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  comparison TEXT NOT NULL CHECK (comparison IN ('lte', 'gte')), -- lte=이하, gte=이상
  icon TEXT NOT NULL,
  label TEXT NOT NULL
);

-- 현재 유효 종목 (6개)
-- sprint_50m (50m 달리기, 초, lowerIsBetter)
-- juggling (리프팅, 회)
-- kick_power (슈팅 속도, km/h)
-- run_1000m (1000m 달리기, 분:초, lowerIsBetter)
-- push_ups (팔굽혀펴기, 회)
-- sargent_jump (서전트 점프, cm)
--
-- 제거된 종목: 30m_sprint, shooting_accuracy, shuttle_run, standing_jump, sit_ups, flexibility

-- 초기 메달 기준 데이터
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label) VALUES
  ('sprint_7.0', 'sprint_50m', 7.0, 'lte', '⚡', '7.0s'),
  ('sprint_6.5', 'sprint_50m', 6.5, 'lte', '⚡⚡', '6.5s'),
  ('juggling_100', 'juggling', 100, 'gte', '🔥', '100+'),
  ('juggling_300', 'juggling', 300, 'gte', '🔥🔥', '300+'),
  ('juggling_500', 'juggling', 500, 'gte', '🔥🔥🔥', '500+'),
  ('kick_80', 'kick_power', 80, 'gte', '🦵', '80km/h+'),
  ('run_4_30', 'run_1000m', 270, 'lte', '🏃', '4:30');
```

### 2.4 팀

```sql
-- 팀
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  city TEXT,
  founded_year INTEGER,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 멤버
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'alumni')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

-- 팀 앨범
CREATE TABLE team_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 소셜 & 피드

```sql
-- 팔로우
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 피드 아이템 (자동 생성)
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'highlight', 'featured_change', 'medal', 'stat', 'season', 'top_clip'
  )),
  reference_id UUID,               -- 관련 clip/stat/medal/season ID
  metadata JSONB DEFAULT '{}',     -- 추가 데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 응원 (Kudos)
CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_item_id, user_id)
);

-- 댓글
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'kudos', 'comment', 'follow', 'medal', 'verified', 'mvp_result', 'vote_open', 'mvp_win' 등
  title TEXT NOT NULL,
  body TEXT,
  reference_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.6 MVP 시스템 (v1.1 신규)

```sql
-- MVP 주간 투표
CREATE TABLE weekly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,          -- 해당 주 월요일 날짜
  message TEXT,                      -- 한줄 응원 메시지 (선택)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, clip_id, week_start)
);

-- MVP 주간 결과 아카이브
CREATE TABLE weekly_mvp_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  rank INTEGER NOT NULL,
  clip_id UUID REFERENCES clips(id),
  profile_id UUID REFERENCES profiles(id),
  auto_score INTEGER NOT NULL,       -- 자동 점수 (70%)
  vote_score INTEGER NOT NULL,       -- 투표 점수 (30%)
  total_score INTEGER NOT NULL,      -- 합산
  vote_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.7 랭킹 캐시 (v1.1 신규)

```sql
-- 선수 인기 점수 캐시 (매일 갱신)
CREATE TABLE player_ranking_cache (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id),
  popularity_score INTEGER DEFAULT 0,
  weekly_change INTEGER DEFAULT 0,   -- 7일 변화량 (급상승 판별)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 활동 점수 캐시 (매주 갱신)
CREATE TABLE team_ranking_cache (
  team_id UUID PRIMARY KEY REFERENCES teams(id),
  activity_score INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,       -- 소속 선수 MVP 배출 수
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.8 시즌

```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),  -- v1.1: 팀 참조
  is_current BOOLEAN DEFAULT FALSE,   -- v1.1: 현재 소속 여부
  league TEXT,
  highlight_clip_id UUID REFERENCES clips(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. RLS 정책 (Row Level Security)

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
-- ... 모든 테이블에 적용

-- 프로필: 누구나 읽기, 본인만 수정
CREATE POLICY "프로필 읽기" ON profiles FOR SELECT USING (true);
CREATE POLICY "프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 클립: 누구나 읽기, 본인(+연동된 부모)만 생성
CREATE POLICY "클립 읽기" ON clips FOR SELECT USING (true);
CREATE POLICY "클립 생성" ON clips FOR INSERT WITH CHECK (
  auth.uid() = owner_id OR 
  auth.uid() IN (SELECT parent_id FROM parent_links WHERE child_id = owner_id)
);

-- 팀: 누구나 읽기, 관리자만 수정
CREATE POLICY "팀 읽기" ON teams FOR SELECT USING (true);
CREATE POLICY "팀 수정" ON teams FOR UPDATE USING (
  auth.uid() IN (
    SELECT profile_id FROM team_members 
    WHERE team_id = teams.id AND role = 'admin'
  )
);
```

## 4. 영상 파이프라인 (Cloudflare R2)

### 4.1 업로드 플로우

```
1. 클라이언트: 파일 선택 + 메타데이터 입력
2. 클라이언트 → Supabase Edge Function: presigned URL 요청
3. Edge Function → R2: presigned URL 생성 (PUT, 10분 유효)
4. 클라이언트 → R2: 직접 업로드 (서버 부하 없음)
5. 클라이언트 → Supabase: clips 테이블에 메타데이터 저장
6. (비동기) Edge Function: 스마트 트리밍 + 썸네일 생성
```

### 4.2 R2 버킷 구조

```
footory-videos/
├── originals/
│   └── {user_id}/{clip_id}.mp4          # 원본 영상
├── highlights/
│   └── {user_id}/{clip_id}_highlight.mp4 # 30초 트리밍
├── thumbnails/
│   └── {user_id}/{clip_id}_thumb.jpg     # 자동 썸네일
├── teams/
│   └── {team_id}/{album_id}.mp4          # 팀 앨범 영상
└── avatars/
    └── {user_id}/profile.jpg             # 프로필 사진
```

### 4.3 스마트 트리밍 (v1)

```bash
# Supabase Edge Function 또는 Cloudflare Worker에서 실행
# 영상 앞 30초 자동 커트
ffmpeg -i input.mp4 -t 30 -c copy highlight.mp4

# 5초 지점 썸네일
ffmpeg -i input.mp4 -ss 5 -vframes 1 -q:v 2 thumbnail.jpg
```

### 4.4 비용 예측

| 규모 | 저장 | 전송 | 월 비용 |
|------|------|------|---------|
| MVP (100명, 1000영상) | 30GB | 무료 | ~$0.45 |
| 성장 (1000명, 10000영상) | 300GB | 무료 | ~$4.50 |
| 확장 (5000명, 50000영상) | 1.5TB | 무료 | ~$22.50 |

## 5. API 구조 (Supabase Edge Functions)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/functions/v1/upload-url` | POST | R2 presigned URL 생성 |
| `/functions/v1/process-video` | POST | 스마트 트리밍 + 썸네일 (비동기) |
| `/functions/v1/check-medal` | POST | 메달 자동 부여 체크 |
| `/functions/v1/generate-feed` | POST | 피드 카드 자동 생성 |
| `/functions/v1/send-notification` | POST | 푸시 알림 발송 (FCM) |

| `/functions/v1/mvp-score` | POST | 주간 MVP 자동 점수 집계 (매일 cron) |
| `/functions/v1/mvp-finalize` | POST | 주간 MVP 최종 확정 (월요일 cron) |
| `/functions/v1/ranking-update` | POST | 선수/팀 랭킹 캐시 갱신 (매일 cron) |
| `/functions/v1/feed-recommend` | POST | 추천 피드 생성 (팔로우 기반 가중치) |
나머지 CRUD는 Supabase Client SDK로 직접 DB 호출.

## 6. MVP 점수 계산 로직 (v1.1)

```typescript
// MVP 점수 = 자동(70%) + 투표(30%)
function calculateMvpScore(clip: ClipWithStats, voteCount: number): number {
  // 자동 점수
  const autoRaw = 
    clip.views_count * 1 +
    clip.kudos_count * 3 +
    clip.comments_count * 2 +
    clip.profile_visits * 2;
  
  // 투표 점수
  const voteRaw = voteCount * 10;
  
  // 정규화 후 가중치 적용
  const maxAuto = getMaxAutoScoreThisWeek(); // 이번 주 최고 자동 점수
  const maxVote = getMaxVoteCountThisWeek() * 10;
  
  const autoNorm = maxAuto > 0 ? (autoRaw / maxAuto) * 700 : 0;  // 70%
  const voteNorm = maxVote > 0 ? (voteRaw / maxVote) * 300 : 0;  // 30%
  
  return Math.round(autoNorm + voteNorm);
}

// MVP 등급 자동 부여
function getMvpTier(mvpCount: number): string | null {
  if (mvpCount >= 10) return 'legend';   // 💎
  if (mvpCount >= 5) return 'allstar';    // 👑
  if (mvpCount >= 3) return 'ace';        // 🌟
  if (mvpCount >= 1) return 'rookie';     // ⭐
  return null;
}
```

## 7. 레벨 자동 계산 로직

```typescript
function calculateLevel(profile): number {
  let lv = 1;
  
  // Lv.2: 프사 + 기본정보 완성
  if (profile.avatar_url && profile.name && profile.position && profile.birth_year) lv = 2;
  
  // Lv.3: Featured 1개 + 스탯 1개
  if (lv >= 2 && profile.featured_count >= 1 && profile.stats_count >= 1) lv = 3;
  
  // Lv.4: Top Clip 2개 + 메달 1개
  if (lv >= 3 && profile.top_clips_count >= 2 && profile.medals_count >= 1) lv = 4;
  
  // Lv.5: 시즌 1개 + Featured 2개
  if (lv >= 4 && profile.seasons_count >= 1 && profile.featured_count >= 2) lv = 5;
  
  return lv;
}
```
