CREATE TABLE IF NOT EXISTS video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('single_clip', 'reel_highlight')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  clip_id uuid REFERENCES clips(id) ON DELETE CASCADE,
  highlight_id uuid REFERENCES highlights(id) ON DELETE CASCADE,
  title text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_opened_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_projects_owner_kind_updated
  ON video_projects(owner_id, kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_projects_clip
  ON video_projects(clip_id)
  WHERE clip_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_projects_highlight
  ON video_projects(highlight_id)
  WHERE highlight_id IS NOT NULL;

ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_projects_owner_select" ON video_projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "video_projects_owner_insert" ON video_projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "video_projects_owner_update" ON video_projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "video_projects_owner_delete" ON video_projects
  FOR DELETE USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION update_video_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_projects_updated_at ON video_projects;

CREATE TRIGGER trg_video_projects_updated_at
  BEFORE UPDATE ON video_projects
  FOR EACH ROW EXECUTE FUNCTION update_video_projects_updated_at();
