-- Safety: blocks, reports, dm_requests
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id),
  comment_id UUID REFERENCES comments(id),
  clip_id UUID REFERENCES clips(id),
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  preview_message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocks_select ON blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
CREATE POLICY blocks_insert ON blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());
CREATE POLICY blocks_delete ON blocks FOR DELETE
  USING (blocker_id = auth.uid());

CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_select ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY dm_req_select ON dm_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY dm_req_insert ON dm_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY dm_req_update ON dm_requests FOR UPDATE
  USING (receiver_id = auth.uid());
