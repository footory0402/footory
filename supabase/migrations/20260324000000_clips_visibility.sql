-- clips 테이블에 visibility 컬럼 추가
-- MVP 후보 조회 쿼리가 visibility = 'public' 조건으로 필터링하는데
-- 컬럼 자체가 없어서 모든 클립이 MVP 후보에서 제외되던 버그 수정

ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private'));

-- 기존 클립은 모두 public으로 설정 (소급 적용)
UPDATE clips SET visibility = 'public' WHERE visibility IS NULL OR visibility = '';

-- 인덱스 추가 (MVP 후보 조회 성능)
CREATE INDEX IF NOT EXISTS idx_clips_visibility ON clips(visibility);
CREATE INDEX IF NOT EXISTS idx_clips_created_visibility ON clips(created_at, visibility);
