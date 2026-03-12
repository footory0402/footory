-- Remove quest/level/XP system
-- Quests and level gamification removed in favor of simple profile completion nudge

-- Drop quest/challenge tables
DROP TABLE IF EXISTS quest_progress;
DROP TABLE IF EXISTS challenges;

-- Drop XP RPC function
DROP FUNCTION IF EXISTS increment_xp(UUID, INT);

-- Remove XP column from profiles (level column kept for backward compat, will be ignored by app)
ALTER TABLE profiles DROP COLUMN IF EXISTS xp;
