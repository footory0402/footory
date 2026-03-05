-- Sprint-15b: 역할별 온보딩 확장

-- profiles 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_foot TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- bio 컬럼은 이미 존재할 수 있음
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- coach_verifications 테이블
CREATE TABLE IF NOT EXISTS coach_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  document_url TEXT,
  referrer_id UUID REFERENCES profiles(id),
  team_code TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- parent_links 동의 필드
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_links ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

-- RLS for coach_verifications
ALTER TABLE coach_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON coach_verifications FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own verifications"
  ON coach_verifications FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
