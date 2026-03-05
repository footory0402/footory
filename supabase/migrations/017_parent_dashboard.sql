-- =============================================
-- Sprint 22: Parent Dashboard helpers
-- =============================================

-- Function to count weekly kudos received by a player
CREATE OR REPLACE FUNCTION count_weekly_kudos(
  p_profile_id UUID,
  p_week_start TIMESTAMPTZ
) RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM kudos k
  JOIN feed_items fi ON fi.id = k.feed_item_id
  WHERE fi.profile_id = p_profile_id
    AND k.created_at >= p_week_start;
$$ LANGUAGE sql STABLE;

-- Index to speed up parent dashboard queries
CREATE INDEX IF NOT EXISTS idx_clips_owner_created
  ON clips(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_links_parent
  ON parent_links(parent_id);
