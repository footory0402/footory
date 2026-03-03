-- Sprint 15: 온보딩 지원
-- profiles 테이블에 role 컬럼 추가 (선수/부모/기타)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'parent', 'other'));
