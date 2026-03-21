-- Phase 1: profiles 테이블에 play_style 관련 컬럼 추가
-- 핸드오프 문서 기반: play_style_title, play_style_quote, play_style_icon

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_quote TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_icon TEXT DEFAULT '⚡';
