-- =============================================
-- clip_tags.tag_name CHECK 제약조건 업데이트
-- GK 전용 태그(세이브, 배급, 1v1세이브) 추가
-- 헤딩경합은 하위 호환을 위해 유지
-- =============================================

ALTER TABLE clip_tags
  DROP CONSTRAINT IF EXISTS clip_tags_tag_name_check;

ALTER TABLE clip_tags
  ADD CONSTRAINT clip_tags_tag_name_check CHECK (tag_name IN (
    -- 필드 선수 공통
    '1v1 돌파', '슈팅', '퍼스트터치', '전진패스', '1v1 수비', '기타',
    -- GK 전용
    '세이브', '배급', '1v1세이브',
    -- 레거시 (하위 호환)
    '헤딩경합'
  ));
