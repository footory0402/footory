-- =============================================
-- FOOTORY 시드 데이터 삭제
-- seed.sql로 넣은 데이터만 정확히 삭제
-- =============================================

-- 순서: FK 의존성 역순으로 삭제

-- v1.2 안전/DM/코치 기능
DELETE FROM reports WHERE reporter_id::text LIKE 'a0000%' OR reported_id::text LIKE 'a0000%' OR id::text LIKE 'ea100000%';
DELETE FROM blocks WHERE blocker_id::text LIKE 'a0000%' OR blocked_id::text LIKE 'a0000%' OR id::text LIKE 'e9000000%';
DELETE FROM coach_reviews WHERE coach_id::text LIKE 'a0000%' OR clip_id::text LIKE 'c0000000%' OR id::text LIKE 'e3000000%';
DELETE FROM scout_watchlist WHERE scout_id::text LIKE 'a0000%' OR player_id::text LIKE 'a0000%' OR id::text LIKE 'e4000000%';
DELETE FROM dm_requests WHERE sender_id::text LIKE 'a0000%' OR receiver_id::text LIKE 'a0000%' OR id::text LIKE 'e2000000%';
DELETE FROM messages WHERE sender_id::text LIKE 'a0000%' OR conversation_id IN (
  SELECT id FROM conversations WHERE participant_1::text LIKE 'a0000%' OR participant_2::text LIKE 'a0000%'
);
DELETE FROM conversations WHERE participant_1::text LIKE 'a0000%' OR participant_2::text LIKE 'a0000%' OR id::text LIKE 'e0000000%';

-- 챌린지/퀘스트/MVP 캐시
DELETE FROM quest_progress WHERE profile_id::text LIKE 'a0000%' OR id::text LIKE 'e8000000%';
DELETE FROM challenges WHERE id::text LIKE 'e7000000%';
DELETE FROM weekly_votes WHERE voter_id::text LIKE 'a0000%' OR clip_id::text LIKE 'c0000000%' OR id::text LIKE 'fc000000%';
DELETE FROM weekly_mvp_results WHERE profile_id::text LIKE 'a0000%' OR clip_id::text LIKE 'c0000000%' OR id::text LIKE 'fd000000%';
DELETE FROM player_ranking_cache WHERE profile_id::text LIKE 'a0000%';
DELETE FROM team_ranking_cache WHERE team_id::text LIKE 'b0000000%';

-- 알림/설정
DELETE FROM notification_preferences WHERE profile_id::text LIKE 'a0000%';
DELETE FROM notifications WHERE user_id::text LIKE 'a0000%' OR id::text LIKE 'fa000000%';
DELETE FROM fcm_tokens WHERE user_id::text LIKE 'a0000%';
DELETE FROM push_tokens WHERE profile_id::text LIKE 'a0000%';

-- 피드/소셜
DELETE FROM comments WHERE feed_item_id::text LIKE 'f0000000%' OR id::text LIKE 'ea000000%';
DELETE FROM kudos WHERE feed_item_id::text LIKE 'f0000000%';
DELETE FROM feed_items WHERE id::text LIKE 'f0000000%';
DELETE FROM follows WHERE follower_id::text LIKE 'a0000%' OR following_id::text LIKE 'a0000%';

-- 포트폴리오
DELETE FROM timeline_events WHERE profile_id::text LIKE 'a0000%';
DELETE FROM achievements WHERE profile_id::text LIKE 'a0000%';

-- 메달/스탯/시즌
DELETE FROM medals WHERE profile_id::text LIKE 'a0000%';
DELETE FROM stats WHERE id::text LIKE 'd0000000%' OR profile_id::text LIKE 'a0000%';
DELETE FROM seasons WHERE profile_id::text LIKE 'a0000%';

-- 부모/코치 인증 데이터
DELETE FROM parent_links WHERE parent_id::text LIKE 'a0000%' OR child_id::text LIKE 'a0000%' OR id::text LIKE 'e6000000%';
DELETE FROM coach_verifications WHERE profile_id::text LIKE 'a0000%' OR referrer_id::text LIKE 'a0000%' OR id::text LIKE 'e5000000%';

-- 클립 관련
DELETE FROM featured_clips WHERE clip_id::text LIKE 'c0000000%';
DELETE FROM clip_tags WHERE clip_id::text LIKE 'c0000000%';
DELETE FROM clips WHERE id::text LIKE 'c0000000%';

-- 팀 관련
DELETE FROM team_albums WHERE team_id::text LIKE 'b0000000%' OR id::text LIKE 'eb000000%';
DELETE FROM team_members WHERE team_id::text LIKE 'b0000000%';
DELETE FROM teams WHERE id::text LIKE 'b0000000%';

-- 프로필 + Auth
DELETE FROM profiles WHERE id::text LIKE 'a0000%';
DELETE FROM auth.identities WHERE user_id::text LIKE 'a0000%';
DELETE FROM auth.users WHERE id::text LIKE 'a0000%';

-- =============================================
-- DONE! 시드 데이터 삭제 완료
-- =============================================
