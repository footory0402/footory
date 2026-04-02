-- Drop visibility column from clips table
-- All clips are now always public

ALTER TABLE clips
  DROP COLUMN IF EXISTS visibility;
