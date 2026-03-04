-- FCM push notification tokens
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FCM 토큰 본인 관리" ON fcm_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);

-- Notification preferences
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_kudos BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_comments BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_follows BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_mvp BOOLEAN DEFAULT TRUE;
