-- Sprint-23: Portfolio — achievements + timeline_events

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  competition TEXT,
  year INTEGER,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_achievements_profile ON achievements(profile_id, year DESC);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view any achievements"
  ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements"
  ON achievements FOR ALL USING (profile_id = auth.uid());

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  clip_id UUID REFERENCES clips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_timeline_profile ON timeline_events(profile_id, created_at DESC);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view any timeline events"
  ON timeline_events FOR SELECT USING (true);
CREATE POLICY "System can insert timeline events"
  ON timeline_events FOR INSERT WITH CHECK (true);
