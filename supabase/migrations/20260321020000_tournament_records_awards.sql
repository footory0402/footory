-- Phase 4: 대회 기록 테이블
CREATE TABLE IF NOT EXISTS tournament_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '친선' CHECK (type IN ('공식대회', '리그', '친선')),
  date_text TEXT,              -- "2026.02" 자유 포맷
  result TEXT,                 -- "8강", "리그 3위"
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  is_mvp BOOLEAN DEFAULT false,
  source TEXT NOT NULL DEFAULT 'self' CHECK (source IN ('team', 'self')),
  verifier_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_records_player ON tournament_records(player_id);

ALTER TABLE tournament_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tournament records"
  ON tournament_records FOR SELECT USING (true);

CREATE POLICY "Users can insert own tournament records"
  ON tournament_records FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update own tournament records"
  ON tournament_records FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can delete own tournament records"
  ON tournament_records FOR DELETE USING (player_id = auth.uid());

-- Phase 4: 수상/성과 테이블
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  source TEXT NOT NULL DEFAULT 'self' CHECK (source IN ('team', 'self')),
  verifier TEXT,               -- "대한축구협회" 등 자유 텍스트
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_awards_player ON awards(player_id);

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view awards"
  ON awards FOR SELECT USING (true);

CREATE POLICY "Users can insert own awards"
  ON awards FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update own awards"
  ON awards FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can delete own awards"
  ON awards FOR DELETE USING (player_id = auth.uid());
