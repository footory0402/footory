-- DM: conversations + messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);
CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant_2);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  shared_clip_id UUID REFERENCES clips(id),
  is_read BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY conv_select ON conversations FOR SELECT
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY conv_insert ON conversations FOR INSERT
  WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY conv_update ON conversations FOR UPDATE
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY msg_select ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  ));
CREATE POLICY msg_insert ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  ));
CREATE POLICY msg_update ON messages FOR UPDATE
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
