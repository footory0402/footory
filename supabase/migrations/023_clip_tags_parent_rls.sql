-- =============================================
-- clip_tags: 부모도 자녀 클립에 태그 삽입/수정/삭제 가능하도록 RLS 확장
-- =============================================

-- INSERT: 부모가 자녀 클립에 태그 추가 가능
DROP POLICY IF EXISTS "clip_tags_insert" ON clip_tags;
CREATE POLICY "clip_tags_insert" ON clip_tags FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
  OR auth.uid() IN (
    SELECT parent_id FROM parent_links
    WHERE child_id = (SELECT owner_id FROM clips WHERE id = clip_id)
  )
);

-- UPDATE: 부모가 자녀 클립 태그 수정 가능
DROP POLICY IF EXISTS "clip_tags_update" ON clip_tags;
CREATE POLICY "clip_tags_update" ON clip_tags FOR UPDATE USING (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
  OR auth.uid() IN (
    SELECT parent_id FROM parent_links
    WHERE child_id = (SELECT owner_id FROM clips WHERE id = clip_id)
  )
);

-- DELETE: 부모가 자녀 클립 태그 삭제 가능
DROP POLICY IF EXISTS "clip_tags_delete" ON clip_tags;
CREATE POLICY "clip_tags_delete" ON clip_tags FOR DELETE USING (
  auth.uid() IN (SELECT owner_id FROM clips WHERE id = clip_id)
  OR auth.uid() IN (
    SELECT parent_id FROM parent_links
    WHERE child_id = (SELECT owner_id FROM clips WHERE id = clip_id)
  )
);

-- parent_links SELECT: 관계 당사자만 조회 가능하도록 제한
DROP POLICY IF EXISTS "parent_links_select" ON parent_links;
CREATE POLICY "parent_links_select" ON parent_links FOR SELECT USING (
  auth.uid() = parent_id OR auth.uid() = child_id
);

-- parent_links DELETE: 부모 또는 자녀 모두 연동 해제 가능
DROP POLICY IF EXISTS "parent_links_delete" ON parent_links;
CREATE POLICY "parent_links_delete" ON parent_links FOR DELETE USING (
  auth.uid() = parent_id OR auth.uid() = child_id
);
