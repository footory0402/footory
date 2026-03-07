-- 1. Migrate existing 'other' and 'coach' roles to 'scout'
UPDATE profiles SET role = 'scout' WHERE role = 'other';
UPDATE profiles SET role = 'scout' WHERE role = 'coach';

-- 2. Update role CHECK constraint: only player/parent/scout
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('player', 'parent', 'scout'));

-- 3. Add auth_provider column to track signup method
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'kakao';
