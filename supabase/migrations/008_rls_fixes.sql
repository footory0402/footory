-- =============================================
-- 008: RLS 패치 — feed_items DELETE + 셀프팔로우 방지
-- =============================================

-- feed_items: 본인 피드 아이템 삭제 허용
CREATE POLICY "Users can delete own feed items"
  ON feed_items FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- follows: 셀프팔로우 방지 (RESTRICTIVE — 기존 permissive 정책과 AND로 결합)
CREATE POLICY "Prevent self-follow"
  ON follows AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (follower_id != following_id);
