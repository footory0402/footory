-- =============================================
-- SPRINT-16: 알림 센터 확장
-- =============================================

-- 1. notifications 테이블에 group_key, action_url 추가
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 인덱스: 미읽은 알림 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_group_key
  ON notifications(group_key) WHERE group_key IS NOT NULL;

-- 2. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_preferences (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  kudos BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  follows BOOLEAN DEFAULT TRUE,
  dm BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  vote_open BOOLEAN DEFAULT TRUE,
  vote_remind BOOLEAN DEFAULT TRUE,
  mvp_result BOOLEAN DEFAULT TRUE,
  team_invite BOOLEAN DEFAULT TRUE,
  weekly_recap BOOLEAN DEFAULT TRUE,
  upload_nudge BOOLEAN DEFAULT FALSE,
  quiet_start TIME DEFAULT '22:00',
  quiet_end TIME DEFAULT '08:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON notification_preferences FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
