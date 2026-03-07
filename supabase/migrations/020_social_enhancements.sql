-- Sprint-v1.2: Social enhancements — kudos reaction + comment replies

-- H4: kudos.reaction column
ALTER TABLE kudos ADD COLUMN IF NOT EXISTS reaction TEXT DEFAULT 'clap'
  CHECK (reaction IN ('clap', 'fire', 'goal', 'strong', 'wow'));

-- H8: comments.parent_id column (1-level reply threads)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
