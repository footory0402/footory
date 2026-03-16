-- Repair: challenges + quest_progress 테이블 재생성 (016 누락 보정)

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
  quest_type TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, quest_key)
);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'challenges_public_read'
  ) THEN
    CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quest_progress' AND policyname = 'quest_progress_self'
  ) THEN
    CREATE POLICY "quest_progress_self" ON quest_progress FOR ALL USING (profile_id = auth.uid());
  END IF;
END $$;

-- XP 컬럼 (profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

-- XP 증가 함수
CREATE OR REPLACE FUNCTION increment_xp(profile_id UUID, amount INT)
RETURNS VOID AS $$
  UPDATE profiles SET xp = COALESCE(xp, 0) + amount WHERE id = profile_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 이번 주 챌린지 샘플 데이터 (없을 때만 삽입)
INSERT INTO challenges (title, description, skill_tag, week_start, is_active)
SELECT
  '무회전 프리킥',
  '나만의 무회전 프리킥 기술을 영상으로 올려보세요!',
  '프리킥',
  date_trunc('week', CURRENT_DATE)::date,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM challenges WHERE is_active = true
);
