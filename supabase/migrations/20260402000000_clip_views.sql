-- clip_views: 조회수 추적 테이블 + clips.view_count 컬럼
-- 같은 유저는 클립당 1회만 카운트 (UNIQUE 제약)

-- 1. clips 테이블에 view_count 컬럼 추가
ALTER TABLE clips ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_clips_view_count ON clips(view_count DESC);

-- 2. 조회 기록 테이블
CREATE TABLE IF NOT EXISTS clip_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clip_views_clip ON clip_views(clip_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clip_views_unique ON clip_views(clip_id, viewer_id)
  WHERE viewer_id IS NOT NULL;

-- 3. RLS
ALTER TABLE clip_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clip views"
  ON clip_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read clip views"
  ON clip_views FOR SELECT
  USING (true);

-- 4. Atomic increment function
CREATE OR REPLACE FUNCTION increment_view_count(clip_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE clips SET view_count = COALESCE(view_count, 0) + 1 WHERE id = clip_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
