-- =============================================
-- 강지호 (a0000006) 선수 및 관련 데이터 완전 삭제
-- =============================================

DO $$
DECLARE
  target_id uuid := 'a0000006-0000-0000-0000-000000000006';
BEGIN

  -- weekly_votes
  DELETE FROM weekly_votes
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- weekly_mvp_results
  DELETE FROM weekly_mvp_results
  WHERE profile_id = target_id
     OR clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- player_ranking_cache
  DELETE FROM player_ranking_cache WHERE profile_id = target_id;

  -- scout_watchlist
  DELETE FROM scout_watchlist WHERE player_id = target_id;

  -- coach_reviews
  DELETE FROM coach_reviews
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- featured_clips
  DELETE FROM featured_clips
  WHERE profile_id = target_id
     OR clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- clip_tags
  DELETE FROM clip_tags
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- kudos → comments → feed_items
  DELETE FROM kudos
  WHERE feed_item_id IN (SELECT id FROM feed_items WHERE profile_id = target_id);
  DELETE FROM comments
  WHERE feed_item_id IN (SELECT id FROM feed_items WHERE profile_id = target_id);
  DELETE FROM feed_items WHERE profile_id = target_id;

  -- messages: shared_clip_id null 처리
  UPDATE messages SET shared_clip_id = NULL
  WHERE shared_clip_id IN (SELECT id FROM clips WHERE owner_id = target_id);

  -- clips
  DELETE FROM clips WHERE owner_id = target_id;

  -- medals (stats 전에 삭제 — FK 참조)
  DELETE FROM medals WHERE profile_id = target_id;

  -- stats
  DELETE FROM stats WHERE profile_id = target_id;

  -- seasons
  DELETE FROM seasons WHERE profile_id = target_id;

  -- follows
  DELETE FROM follows
  WHERE follower_id = target_id OR following_id = target_id;

  -- notifications
  DELETE FROM notifications WHERE user_id = target_id;

  -- notification_preferences
  DELETE FROM notification_preferences WHERE profile_id = target_id;

  -- dm_requests
  DELETE FROM dm_requests
  WHERE sender_id = target_id OR receiver_id = target_id;

  -- messages (sender)
  DELETE FROM messages WHERE sender_id = target_id;

  -- conversations
  DELETE FROM conversations
  WHERE participant_1 = target_id OR participant_2 = target_id;

  -- blocks / reports
  DELETE FROM blocks
  WHERE blocker_id = target_id OR blocked_id = target_id;
  DELETE FROM reports
  WHERE reporter_id = target_id OR reported_id = target_id;

  -- parent_links
  DELETE FROM parent_links WHERE child_id = target_id;

  -- coach_verifications
  DELETE FROM coach_verifications WHERE profile_id = target_id;

  -- team_members
  DELETE FROM team_members WHERE profile_id = target_id;

  -- teams created_by 참조 해제
  UPDATE teams SET created_by = NULL WHERE created_by = target_id;

  -- team_albums uploaded_by 참조 해제
  UPDATE team_albums SET uploaded_by = NULL WHERE uploaded_by = target_id;

  -- profiles
  DELETE FROM profiles WHERE id = target_id;

  -- auth.identities
  DELETE FROM auth.identities WHERE user_id = target_id;

  -- auth.users
  DELETE FROM auth.users WHERE id = target_id;

END $$;
