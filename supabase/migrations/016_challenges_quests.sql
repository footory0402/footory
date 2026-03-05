-- Sprint-24: 챌린지 + 퀘스트 시스템

-- XP 컬럼 추가 (퀘스트 완료 시 누적)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

-- 주간 챌린지 테이블
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  skill_tag TEXT,
  week_start DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 퀘스트 진행 테이블
CREATE TABLE IF NOT EXISTS quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,  -- 'onboarding', 'weekly'
  quest_key TEXT NOT NULL,   -- 'first_upload', 'weekly_vote_2026-03-02', etc.
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, quest_key)
);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);

ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_progress_self" ON quest_progress FOR ALL USING (profile_id = auth.uid());

-- XP 증가 함수 (원자적 업데이트)
CREATE OR REPLACE FUNCTION increment_xp(profile_id UUID, amount INT)
RETURNS VOID AS $$
  UPDATE profiles SET xp = COALESCE(xp, 0) + amount WHERE id = profile_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 샘플 챌린지 데이터
INSERT INTO challenges (title, description, skill_tag, week_start, is_active)
VALUES (
  '무회전 프리킥',
  '나만의 무회전 프리킥 기술을 영상으로 올려보세요!',
  '프리킥',
  date_trunc('week', CURRENT_DATE)::date,
  true
);
