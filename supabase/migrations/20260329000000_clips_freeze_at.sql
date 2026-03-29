-- clips 테이블에 freeze_at 컬럼 추가 (주인공 표시 프리즈 프레임 시점)
ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS freeze_at NUMERIC;

COMMENT ON COLUMN clips.freeze_at IS '프리즈 프레임 시점 (영상 절대 시간, 초) — 주인공 마커가 설정된 경우에만 값이 있음';
