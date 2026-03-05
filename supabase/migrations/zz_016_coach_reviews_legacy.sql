-- =============================================
-- SPRINT-25: 코치 리뷰 + 스카우터 워치리스트
-- =============================================

-- 1. profiles role CHECK 확장 (coach, scout 추가)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('player', 'parent', 'other', 'coach', 'scout'));

-- 2. 코치 리뷰 테이블
CREATE TABLE IF NOT EXISTS coach_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE NOT NULL,
  comment TEXT CHECK (char_length(comment) <= 80),
  private_note TEXT CHECK (char_length(private_note) <= 200),
  rating TEXT NOT NULL CHECK (rating IN ('good', 'great', 'excellent')),
  hidden_by_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, clip_id)
);

-- 3. 스카우터 워치리스트 테이블
CREATE TABLE IF NOT EXISTS scout_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  notify_on_upload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scout_id, player_id)
);

-- 4. RLS
ALTER TABLE coach_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_watchlist ENABLE ROW LEVEL SECURITY;

-- coach_reviews: 누구나 읽기 (private_note는 API에서 필터링)
CREATE POLICY "coach_reviews_select" ON coach_reviews
  FOR SELECT USING (true);

CREATE POLICY "coach_reviews_insert" ON coach_reviews
  FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "coach_reviews_update" ON coach_reviews
  FOR UPDATE USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "coach_reviews_delete" ON coach_reviews
  FOR DELETE USING (coach_id = auth.uid());

-- scout_watchlist: 본인만
CREATE POLICY "watchlist_all" ON scout_watchlist
  FOR ALL USING (scout_id = auth.uid());

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_coach_reviews_clip ON coach_reviews(clip_id);
CREATE INDEX IF NOT EXISTS idx_coach_reviews_coach ON coach_reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_scout_watchlist_scout ON scout_watchlist(scout_id);
CREATE INDEX IF NOT EXISTS idx_scout_watchlist_player ON scout_watchlist(player_id);

-- 6. notification_preferences에 coach_review 알림 설정 추가
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS coach_review BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS watchlist_upload BOOLEAN DEFAULT TRUE;
