-- Realtime publication에 주요 테이블 추가 (WebSocket 연결 지원)
-- feed_items, notifications, messages, kudos 실시간 구독 활성화

DO $$
BEGIN
  -- supabase_realtime publication에 테이블 추가 (이미 있으면 무시)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE feed_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE kudos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE weekly_votes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
