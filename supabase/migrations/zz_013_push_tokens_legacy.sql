-- =============================================
-- SPRINT-16b: 푸시 토큰 테이블
-- =============================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, token)
);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON push_tokens FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE
  USING (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_push_tokens_profile
  ON push_tokens(profile_id, is_active);
