-- =============================================
-- RLS 활성화
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medal_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- =============================================
-- profiles
-- =============================================
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- parent_links
-- =============================================
CREATE POLICY "parent_links_select" ON parent_links FOR SELECT USING (true);
CREATE POLICY "parent_links_insert" ON parent_links FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "parent_links_delete" ON parent_links FOR DELETE USING (auth.uid() = parent_id);

-- =============================================
-- clips
-- =============================================
CREATE POLICY "clips_select" ON clips FOR SELECT USING (true);
CREATE POLICY "clips_insert" ON clips FOR INSERT WITH CHECK (
  auth.uid() = owner_id OR
  auth.uid() IN (SELECT parent_id FROM parent_links WHERE child_id = owner_id)
);
CREATE POLICY "clips_update" ON clips FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "clips_delete" ON clips FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- clip_tags
-- =============================================
CREATE POLICY "clip_tags_select" ON clip_tags FOR SELECT USING (true);
CREATE POLICY "clip_tags_insert" ON clip_tags FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
);
CREATE POLICY "clip_tags_update" ON clip_tags FOR UPDATE USING (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
);
CREATE POLICY "clip_tags_delete" ON clip_tags FOR DELETE USING (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
);

-- =============================================
-- featured_clips
-- =============================================
CREATE POLICY "featured_select" ON featured_clips FOR SELECT USING (true);
CREATE POLICY "featured_insert" ON featured_clips FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "featured_delete" ON featured_clips FOR DELETE USING (auth.uid() = profile_id);

-- =============================================
-- stats
-- =============================================
CREATE POLICY "stats_select" ON stats FOR SELECT USING (true);
CREATE POLICY "stats_insert" ON stats FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "stats_update" ON stats FOR UPDATE USING (
  auth.uid() = profile_id OR
  auth.uid() IN (
    SELECT tm.profile_id FROM team_members tm
    JOIN team_members tm2 ON tm.team_id = tm2.team_id
    WHERE tm.role = 'admin' AND tm2.profile_id = stats.profile_id
  )
);
CREATE POLICY "stats_delete" ON stats FOR DELETE USING (auth.uid() = profile_id);

-- =============================================
-- medals
-- =============================================
CREATE POLICY "medals_select" ON medals FOR SELECT USING (true);
CREATE POLICY "medals_insert" ON medals FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- =============================================
-- medal_criteria (read-only)
-- =============================================
CREATE POLICY "medal_criteria_select" ON medal_criteria FOR SELECT USING (true);

-- =============================================
-- teams
-- =============================================
CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (
  auth.uid() IN (
    SELECT profile_id FROM team_members
    WHERE team_id = teams.id AND role = 'admin'
  )
);

-- =============================================
-- team_members
-- =============================================
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (
  auth.uid() = profile_id OR
  auth.uid() IN (
    SELECT profile_id FROM team_members tm
    WHERE tm.team_id = team_members.team_id AND tm.role = 'admin'
  )
);

-- =============================================
-- team_albums
-- =============================================
CREATE POLICY "team_albums_select" ON team_albums FOR SELECT USING (true);
CREATE POLICY "team_albums_insert" ON team_albums FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT profile_id FROM team_members WHERE team_id = team_albums.team_id
  )
);
CREATE POLICY "team_albums_delete" ON team_albums FOR DELETE USING (
  auth.uid() = uploaded_by OR
  auth.uid() IN (
    SELECT profile_id FROM team_members
    WHERE team_id = team_albums.team_id AND role = 'admin'
  )
);

-- =============================================
-- follows
-- =============================================
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- =============================================
-- feed_items
-- =============================================
CREATE POLICY "feed_select" ON feed_items FOR SELECT USING (true);
CREATE POLICY "feed_insert" ON feed_items FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- =============================================
-- kudos
-- =============================================
CREATE POLICY "kudos_select" ON kudos FOR SELECT USING (true);
CREATE POLICY "kudos_insert" ON kudos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kudos_delete" ON kudos FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- comments
-- =============================================
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- notifications
-- =============================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- seasons
-- =============================================
CREATE POLICY "seasons_select" ON seasons FOR SELECT USING (true);
CREATE POLICY "seasons_insert" ON seasons FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "seasons_update" ON seasons FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "seasons_delete" ON seasons FOR DELETE USING (auth.uid() = profile_id);
