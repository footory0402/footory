-- visibility 컬럼 CHECK 제약을 확장 (followers, team 추가)
-- 기존: ('public', 'private')
-- 변경: ('public', 'followers', 'team', 'private')

ALTER TABLE clips
  DROP CONSTRAINT IF EXISTS clips_visibility_check;

ALTER TABLE clips
  ADD CONSTRAINT clips_visibility_check
    CHECK (visibility IN ('public', 'followers', 'team', 'private'));
