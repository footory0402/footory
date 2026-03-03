-- =============================================
-- FOOTORY 초기 스키마
-- =============================================

-- 1. 프로필
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'parent', 'other')),
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  position TEXT CHECK (position IN ('FW', 'MF', 'DF', 'GK')),
  birth_year INTEGER,
  city TEXT,
  bio TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  public_email TEXT,
  public_phone TEXT,
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 부모-자녀 연동
CREATE TABLE parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- 3. 영상 클립
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  video_url TEXT NOT NULL,
  highlight_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  memo TEXT,
  highlight_status TEXT DEFAULT 'pending'
    CHECK (highlight_status IN ('pending', 'processing', 'done', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 클립-태그 매핑
CREATE TABLE clip_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL CHECK (tag_name IN (
    '1v1 돌파', '슈팅', '퍼스트터치', '전진패스', '헤딩경합', '1v1 수비', '기타'
  )),
  is_top BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Featured 하이라이트
CREATE TABLE featured_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, clip_id)
);

-- 6. 측정 기록
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  evidence_clip_id UUID REFERENCES clips(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 메달
CREATE TABLE medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medal_code TEXT NOT NULL,
  stat_id UUID REFERENCES stats(id),
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 메달 기준
CREATE TABLE medal_criteria (
  code TEXT PRIMARY KEY,
  stat_type TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  comparison TEXT NOT NULL CHECK (comparison IN ('lte', 'gte')),
  icon TEXT NOT NULL,
  label TEXT NOT NULL
);

-- 9. 팀
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

-- 10. 팀 멤버
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

-- 11. 팀 앨범
CREATE TABLE team_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 팔로우
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 13. 피드
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'highlight', 'featured_change', 'medal', 'stat', 'season', 'top_clip'
  )),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 응원
CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_item_id, user_id)
);

-- 15. 댓글
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  reference_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. 시즌
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  league TEXT,
  highlight_clip_id UUID REFERENCES clips(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_clips_owner ON clips(owner_id);
CREATE INDEX idx_clip_tags_clip ON clip_tags(clip_id);
CREATE INDEX idx_clip_tags_tag ON clip_tags(tag_name);
CREATE INDEX idx_featured_profile ON featured_clips(profile_id);
CREATE INDEX idx_stats_profile ON stats(profile_id);
CREATE INDEX idx_medals_profile ON medals(profile_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_profile ON team_members(profile_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_feed_profile ON feed_items(profile_id);
CREATE INDEX idx_feed_created ON feed_items(created_at DESC);
CREATE INDEX idx_kudos_feed ON kudos(feed_item_id);
CREATE INDEX idx_comments_feed ON comments(feed_item_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_seasons_profile ON seasons(profile_id);

-- =============================================
-- 초기 데이터: 메달 기준
-- =============================================
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label) VALUES
  ('sprint_5.0', '30m_sprint', 5.0, 'lte', '⚡', '5.0s'),
  ('sprint_4.5', '30m_sprint', 4.5, 'lte', '⚡⚡', '4.5s'),
  ('juggling_100', 'juggling', 100, 'gte', '🔥', '100+'),
  ('juggling_300', 'juggling', 300, 'gte', '🔥🔥', '300+'),
  ('juggling_500', 'juggling', 500, 'gte', '🔥🔥🔥', '500+'),
  ('shooting_10', 'shooting_accuracy', 10, 'gte', '🎯', '10+'),
  ('run_4_30', '1000m_run', 270, 'lte', '🏃', '4:30');
