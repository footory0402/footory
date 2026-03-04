-- =============================================
-- 009: v1.1 — MVP 시스템 + 랭킹 캐시 + 스키마 업데이트
-- =============================================

-- =============================================
-- 1. profiles 테이블에 MVP 필드 추가
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mvp_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mvp_tier TEXT CHECK (mvp_tier IN ('rookie', 'ace', 'allstar', 'legend'));

-- =============================================
-- 2. team_members role에 alumni 추가
-- =============================================
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('admin', 'member', 'alumni'));

-- =============================================
-- 3. seasons 테이블에 team_id, is_current 추가
-- =============================================
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT FALSE;

-- =============================================
-- 4. MVP 주간 투표
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, clip_id, week_start)
);

-- =============================================
-- 5. MVP 주간 결과 아카이브
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_mvp_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  rank INTEGER NOT NULL,
  clip_id UUID REFERENCES clips(id),
  profile_id UUID REFERENCES profiles(id),
  auto_score INTEGER NOT NULL,
  vote_score INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  vote_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. 선수 인기 점수 캐시
-- =============================================
CREATE TABLE IF NOT EXISTS player_ranking_cache (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  popularity_score INTEGER DEFAULT 0,
  weekly_change INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. 팀 활동 점수 캐시
-- =============================================
CREATE TABLE IF NOT EXISTS team_ranking_cache (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  activity_score INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_mvp ON profiles(mvp_count DESC) WHERE mvp_count > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_city_pos ON profiles(city, position, birth_year);
CREATE INDEX IF NOT EXISTS idx_weekly_votes_week ON weekly_votes(week_start, clip_id);
CREATE INDEX IF NOT EXISTS idx_weekly_votes_voter ON weekly_votes(voter_id, week_start);
CREATE INDEX IF NOT EXISTS idx_mvp_results_week ON weekly_mvp_results(week_start, rank);
CREATE INDEX IF NOT EXISTS idx_player_ranking ON player_ranking_cache(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_ranking ON team_ranking_cache(activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_profile_created ON feed_items(profile_id, created_at DESC);

-- =============================================
-- 9. RLS 정책
-- =============================================

-- weekly_votes
ALTER TABLE weekly_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_votes_select" ON weekly_votes FOR SELECT USING (true);
CREATE POLICY "weekly_votes_insert" ON weekly_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "weekly_votes_delete" ON weekly_votes FOR DELETE USING (auth.uid() = voter_id);

-- weekly_mvp_results (read-only for users)
ALTER TABLE weekly_mvp_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_results_select" ON weekly_mvp_results FOR SELECT USING (true);

-- player_ranking_cache (read-only for users)
ALTER TABLE player_ranking_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_ranking_select" ON player_ranking_cache FOR SELECT USING (true);

-- team_ranking_cache (read-only for users)
ALTER TABLE team_ranking_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_ranking_select" ON team_ranking_cache FOR SELECT USING (true);
