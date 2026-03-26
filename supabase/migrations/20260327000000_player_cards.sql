-- Player cards: 선수 인트로 카드 저장 (프로필당 1장)
CREATE TABLE player_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template TEXT NOT NULL DEFAULT 'fifa' CHECK (template IN ('fifa', 'broadcast', 'minimal')),
  club_name TEXT,
  main_color TEXT NOT NULL DEFAULT '#37474F',
  accent_color TEXT NOT NULL DEFAULT '#78909C',
  card_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- RLS
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card"
  ON player_cards FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own card"
  ON player_cards FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own card"
  ON player_cards FOR UPDATE
  USING (auth.uid() = profile_id);

-- Parents can view/manage linked children's cards
CREATE POLICY "Parents can view child card"
  ON player_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_links
      WHERE parent_id = auth.uid() AND child_id = player_cards.profile_id
    )
  );

CREATE POLICY "Parents can upsert child card"
  ON player_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_links
      WHERE parent_id = auth.uid() AND child_id = player_cards.profile_id
    )
  );

CREATE POLICY "Parents can update child card"
  ON player_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM parent_links
      WHERE parent_id = auth.uid() AND child_id = player_cards.profile_id
    )
  );
