-- J6: 챌린지 1위 추적
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge_wins INT DEFAULT 0;
