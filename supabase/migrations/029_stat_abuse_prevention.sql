-- =============================================
-- 029: 기록 어뷰징 방지 — audit log + 기록 신고
-- =============================================

-- 1. 스탯 수정/삭제 이력 추적
CREATE TABLE IF NOT EXISTS stat_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('update', 'delete')),
  stat_type TEXT NOT NULL,
  old_value DECIMAL,
  new_value DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stat_audit_profile ON stat_audit_log(profile_id);
CREATE INDEX idx_stat_audit_stat ON stat_audit_log(stat_id);

ALTER TABLE stat_audit_log ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능 (일반 유저는 접근 불가)
CREATE POLICY stat_audit_insert ON stat_audit_log FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY stat_audit_select ON stat_audit_log FOR SELECT
  USING (profile_id = auth.uid());

-- 2. reports 테이블에 stat_id 컬럼 추가
ALTER TABLE reports ADD COLUMN IF NOT EXISTS stat_id UUID REFERENCES stats(id);

-- 3. 기록 신고용 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_stat ON reports(stat_id) WHERE stat_id IS NOT NULL;
