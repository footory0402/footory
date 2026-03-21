-- Phase 3: 체력 측정 기록 테이블
CREATE TABLE IF NOT EXISTS physical_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key TEXT NOT NULL,           -- "50m 달리기", "슈팅 속도" 등
  value TEXT NOT NULL,         -- "7.3", "86" 등 (문자열 — 포맷 다양)
  unit TEXT DEFAULT '',        -- "초", "km/h", "회" 등
  measured_at DATE,
  source TEXT NOT NULL DEFAULT 'self' CHECK (source IN ('team', 'self')),
  verifier_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_tests_player ON physical_tests(player_id);
CREATE INDEX IF NOT EXISTS idx_physical_tests_key ON physical_tests(player_id, key);

-- RLS
ALTER TABLE physical_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own physical tests"
  ON physical_tests FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert own physical tests"
  ON physical_tests FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update own physical tests"
  ON physical_tests FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Users can delete own physical tests"
  ON physical_tests FOR DELETE
  USING (player_id = auth.uid());

-- Public read for profile viewers
CREATE POLICY "Anyone can view physical tests"
  ON physical_tests FOR SELECT
  USING (true);
