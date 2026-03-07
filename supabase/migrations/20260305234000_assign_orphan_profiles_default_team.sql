-- Assign orphan test profiles to a default team so /team is not empty.

INSERT INTO team_members (team_id, profile_id, role)
SELECT
  'b0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  'member'
FROM profiles p
LEFT JOIN team_members tm ON tm.profile_id = p.id
WHERE tm.profile_id IS NULL
  AND p.role IN ('player', 'parent', 'coach', 'scout')
ON CONFLICT (team_id, profile_id) DO NOTHING;
