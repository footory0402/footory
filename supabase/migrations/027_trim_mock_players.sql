-- =============================================
-- 027: Mock 데이터 정리
-- 팀당 1명(admin/level4)만 남기고 나머지 12명 + 관련 데이터 제거
-- 남기는 선수: a0000001(김민준/수원), a0000006(강지호/성남), a0000011(서현우/부산)
-- 제거: a0000002~005, a0000007~010, a0000012~015
-- =============================================

-- 제거할 선수 ID
DO $$
DECLARE
  remove_ids uuid[] := ARRAY[
    'a0000002-0000-0000-0000-000000000002',
    'a0000003-0000-0000-0000-000000000003',
    'a0000004-0000-0000-0000-000000000004',
    'a0000005-0000-0000-0000-000000000005',
    'a0000007-0000-0000-0000-000000000007',
    'a0000008-0000-0000-0000-000000000008',
    'a0000009-0000-0000-0000-000000000009',
    'a0000010-0000-0000-0000-000000000010',
    'a0000012-0000-0000-0000-000000000012',
    'a0000013-0000-0000-0000-000000000013',
    'a0000014-0000-0000-0000-000000000014',
    'a0000015-0000-0000-0000-000000000015'
  ]::uuid[];
BEGIN

  -- 1. cccc 패턴 클립 (testplayer가 지우려다 실패한 클립) 정리
  DELETE FROM featured_clips WHERE clip_id = 'cccc0001-0000-0000-0000-000000000001';
  DELETE FROM clip_tags WHERE clip_id = 'cccc0001-0000-0000-0000-000000000001';
  DELETE FROM coach_reviews WHERE clip_id = 'cccc0001-0000-0000-0000-000000000001';
  UPDATE messages SET shared_clip_id = NULL WHERE shared_clip_id = 'cccc0001-0000-0000-0000-000000000001';
  DELETE FROM clips WHERE id = 'cccc0001-0000-0000-0000-000000000001';

  -- 2. 제거할 선수들의 클립 찾아서 관련 데이터 제거
  -- weekly_votes (제거 선수 클립 참조)
  DELETE FROM weekly_votes
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- weekly_mvp_results (제거 선수 참조)
  DELETE FROM weekly_mvp_results
  WHERE profile_id = ANY(remove_ids)
     OR clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- player_ranking_cache
  DELETE FROM player_ranking_cache WHERE profile_id = ANY(remove_ids);

  -- scout_watchlist
  DELETE FROM scout_watchlist WHERE player_id = ANY(remove_ids);

  -- coach_reviews (제거 선수 클립 참조)
  DELETE FROM coach_reviews
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- featured_clips
  DELETE FROM featured_clips
  WHERE profile_id = ANY(remove_ids)
     OR clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- clip_tags
  DELETE FROM clip_tags
  WHERE clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- feed_items 의 reference_id가 제거 클립인 것 먼저 처리
  -- kudos → comments → feed_items 순서
  DELETE FROM kudos
  WHERE feed_item_id IN (
    SELECT id FROM feed_items WHERE profile_id = ANY(remove_ids)
  );
  DELETE FROM comments
  WHERE feed_item_id IN (
    SELECT id FROM feed_items WHERE profile_id = ANY(remove_ids)
  );
  DELETE FROM feed_items WHERE profile_id = ANY(remove_ids);

  -- messages: shared_clip_id null 처리
  UPDATE messages SET shared_clip_id = NULL
  WHERE shared_clip_id IN (SELECT id FROM clips WHERE owner_id = ANY(remove_ids));

  -- clips 삭제
  DELETE FROM clips WHERE owner_id = ANY(remove_ids);

  -- stats
  DELETE FROM stats WHERE profile_id = ANY(remove_ids);

  -- seasons
  DELETE FROM seasons WHERE profile_id = ANY(remove_ids);

  -- medals
  DELETE FROM medals WHERE profile_id = ANY(remove_ids);

  -- follows
  DELETE FROM follows
  WHERE follower_id = ANY(remove_ids) OR following_id = ANY(remove_ids);

  -- quest_progress
  DELETE FROM quest_progress WHERE profile_id = ANY(remove_ids);

  -- notifications
  DELETE FROM notifications WHERE user_id = ANY(remove_ids);

  -- notification_preferences
  DELETE FROM notification_preferences WHERE profile_id = ANY(remove_ids);

  -- dm_requests
  DELETE FROM dm_requests
  WHERE sender_id = ANY(remove_ids) OR receiver_id = ANY(remove_ids);

  -- messages (sender)
  DELETE FROM messages WHERE sender_id = ANY(remove_ids);

  -- conversations
  DELETE FROM conversations
  WHERE participant_1 = ANY(remove_ids) OR participant_2 = ANY(remove_ids);

  -- blocks / reports
  DELETE FROM blocks
  WHERE blocker_id = ANY(remove_ids) OR blocked_id = ANY(remove_ids);
  DELETE FROM reports
  WHERE reporter_id = ANY(remove_ids) OR reported_id = ANY(remove_ids);

  -- parent_links (child)
  DELETE FROM parent_links WHERE child_id = ANY(remove_ids);

  -- coach_verifications
  DELETE FROM coach_verifications WHERE profile_id = ANY(remove_ids);

  -- team_members
  DELETE FROM team_members WHERE profile_id = ANY(remove_ids);

  -- profiles
  DELETE FROM profiles WHERE id = ANY(remove_ids);

  -- auth.identities
  DELETE FROM auth.identities WHERE user_id = ANY(remove_ids);

  -- auth.users
  DELETE FROM auth.users WHERE id = ANY(remove_ids);

END $$;

-- seed.sql도 업데이트해야 하므로 확인용 쿼리
-- SELECT count(*) FROM profiles WHERE id::text LIKE 'a0000%';
-- 결과: 3 (김민준, 강지호, 서현우)
