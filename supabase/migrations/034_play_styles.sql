-- Play Style 테이블: 시나리오 기반 플레이 스타일 프로필
CREATE TABLE IF NOT EXISTS play_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  style_type TEXT NOT NULL,
  trait_breakthrough INT NOT NULL DEFAULT 0,
  trait_creativity INT NOT NULL DEFAULT 0,
  trait_finishing INT NOT NULL DEFAULT 0,
  trait_tenacity INT NOT NULL DEFAULT 0,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- RLS
ALTER TABLE play_styles ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 (공개 프로필용)
CREATE POLICY "play_styles_select" ON play_styles
  FOR SELECT USING (true);

-- 본인만 쓰기
CREATE POLICY "play_styles_insert" ON play_styles
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "play_styles_update" ON play_styles
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "play_styles_delete" ON play_styles
  FOR DELETE USING (
    profile_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_play_styles_profile_id ON play_styles(profile_id);
