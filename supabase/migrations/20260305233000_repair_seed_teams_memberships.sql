-- Repair seed teams and memberships (v1.2)
-- Ensures 3 canonical soccer teams and member links exist in remote DB.

BEGIN;

-- Remove duplicate rows using same canonical handles but different IDs.
DELETE FROM teams
WHERE handle IN ('suwon-fc-u15', 'seongnam-fc-u15', 'busan-ipark-u15')
  AND id NOT IN (
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003'
  );

-- Upsert canonical 3 teams + logos.
INSERT INTO teams (id, handle, name, logo_url, description, city, founded_year, invite_code, created_by, created_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'suwon-fc-u15', '수원FC U-15', 'https://r2.thesportsdb.com/images/media/team/badge/x39pm41589559443.png', '수원FC 유소년 축구팀. K리그1 수원FC 산하 U-15 팀. 체계적인 훈련 시스템과 우수한 시설을 보유.', '수원', 2004, 'suwon15a', 'a0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days'),
  ('b0000000-0000-0000-0000-000000000002', 'seongnam-fc-u15', '성남FC U-15', 'https://www.thesportsdb.com/images/media/team/badge/cjt4z31769097634.png', '성남FC 유소년 축구팀. K리그 성남FC 산하 U-15 팀. 기술 축구를 지향하며 많은 프로 선수를 배출.', '성남', 2003, 'snam15b', 'a0000006-0000-0000-0000-000000000006', NOW() - INTERVAL '58 days'),
  ('b0000000-0000-0000-0000-000000000003', 'busan-ipark-u15', '부산아이파크 U-15', 'https://r2.thesportsdb.com/images/media/team/badge/rc0vie1579473061.png', '부산아이파크 유소년 축구팀. 부산 지역 최고의 유스 시스템. 강인한 체력과 투지의 축구.', '부산', 2005, 'busan15c', 'a0000011-0000-0000-0000-000000000011', NOW() - INTERVAL '55 days')
ON CONFLICT (id) DO UPDATE SET
  handle = EXCLUDED.handle,
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  founded_year = EXCLUDED.founded_year,
  invite_code = EXCLUDED.invite_code,
  created_by = EXCLUDED.created_by;

-- Restore player memberships (3 teams x 5 players).
INSERT INTO team_members (team_id, profile_id, role)
SELECT v.team_id, v.profile_id, v.role
FROM (
  VALUES
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'admin'::text),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000003-0000-0000-0000-000000000003'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000004-0000-0000-0000-000000000004'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000005-0000-0000-0000-000000000005'::uuid, 'member'::text),

    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000006-0000-0000-0000-000000000006'::uuid, 'admin'::text),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000007-0000-0000-0000-000000000007'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000008-0000-0000-0000-000000000008'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000009-0000-0000-0000-000000000009'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000010-0000-0000-0000-000000000010'::uuid, 'member'::text),

    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000011-0000-0000-0000-000000000011'::uuid, 'admin'::text),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000012-0000-0000-0000-000000000012'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000013-0000-0000-0000-000000000013'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000014-0000-0000-0000-000000000014'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000015-0000-0000-0000-000000000015'::uuid, 'member'::text),

    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000101-0000-0000-0000-000000000101'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000102-0000-0000-0000-000000000102'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000201-0000-0000-0000-000000000201'::uuid, 'member'::text),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000203-0000-0000-0000-000000000203'::uuid, 'member'::text)
) AS v(team_id, profile_id, role)
JOIN profiles p ON p.id = v.profile_id
ON CONFLICT (team_id, profile_id) DO UPDATE
SET role = EXCLUDED.role;

-- Keep current season team links aligned for seeded players.
UPDATE seasons
SET team_id = 'b0000000-0000-0000-0000-000000000001', is_current = true
WHERE year = 2025
  AND profile_id IN (
    'a0000001-0000-0000-0000-000000000001',
    'a0000002-0000-0000-0000-000000000002',
    'a0000003-0000-0000-0000-000000000003',
    'a0000004-0000-0000-0000-000000000004',
    'a0000005-0000-0000-0000-000000000005'
  );

UPDATE seasons
SET team_id = 'b0000000-0000-0000-0000-000000000002', is_current = true
WHERE year = 2025
  AND profile_id IN (
    'a0000006-0000-0000-0000-000000000006',
    'a0000007-0000-0000-0000-000000000007',
    'a0000008-0000-0000-0000-000000000008',
    'a0000009-0000-0000-0000-000000000009',
    'a0000010-0000-0000-0000-000000000010'
  );

UPDATE seasons
SET team_id = 'b0000000-0000-0000-0000-000000000003', is_current = true
WHERE year = 2025
  AND profile_id IN (
    'a0000011-0000-0000-0000-000000000011',
    'a0000012-0000-0000-0000-000000000012',
    'a0000013-0000-0000-0000-000000000013',
    'a0000014-0000-0000-0000-000000000014',
    'a0000015-0000-0000-0000-000000000015'
  );

COMMIT;
