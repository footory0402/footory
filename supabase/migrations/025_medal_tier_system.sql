-- 025: Add difficulty_tier and unit to medal_criteria
-- tier: 1=bronze, 2=silver, 3=gold, 4=diamond

ALTER TABLE medal_criteria ADD COLUMN IF NOT EXISTS difficulty_tier INT NOT NULL DEFAULT 1 CHECK (difficulty_tier BETWEEN 1 AND 4);
ALTER TABLE medal_criteria ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT '';

-- Update existing medal_criteria with proper tiers and units
-- (Assuming existing rows have basic thresholds — update their tiers based on difficulty)

-- Sprint 50m (lower is better, unit: 초)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('sprint_50m_bronze', 'sprint_50m', 9.0, 'lte', '🥉', '50m 9초 이내', 1, '초'),
  ('sprint_50m_silver', 'sprint_50m', 8.0, 'lte', '🥈', '50m 8초 이내', 2, '초'),
  ('sprint_50m_gold', 'sprint_50m', 7.0, 'lte', '🥇', '50m 7초 이내', 3, '초')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Sprint 30m (lower is better, unit: 초)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('sprint_30m_bronze', 'sprint_30m', 5.5, 'lte', '🥉', '30m 5.5초 이내', 1, '초'),
  ('sprint_30m_silver', 'sprint_30m', 5.0, 'lte', '🥈', '30m 5초 이내', 2, '초'),
  ('sprint_30m_gold', 'sprint_30m', 4.5, 'lte', '🥇', '30m 4.5초 이내', 3, '초')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- 1000m Run (lower is better, unit: 초)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('run_1000m_bronze', 'run_1000m', 360, 'lte', '🥉', '1000m 6분 이내', 1, '초'),
  ('run_1000m_silver', 'run_1000m', 300, 'lte', '🥈', '1000m 5분 이내', 2, '초'),
  ('run_1000m_gold', 'run_1000m', 240, 'lte', '🥇', '1000m 4분 이내', 3, '초')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Shuttle Run (higher is better, unit: 회)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('shuttle_run_bronze', 'shuttle_run', 30, 'gte', '🥉', '셔틀런 30회 이상', 1, '회'),
  ('shuttle_run_silver', 'shuttle_run', 60, 'gte', '🥈', '셔틀런 60회 이상', 2, '회'),
  ('shuttle_run_gold', 'shuttle_run', 100, 'gte', '🥇', '셔틀런 100회 이상', 3, '회')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Kick Power (higher is better, unit: km/h)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('kick_power_bronze', 'kick_power', 50, 'gte', '🥉', '킥파워 50km/h 이상', 1, 'km/h'),
  ('kick_power_silver', 'kick_power', 80, 'gte', '🥈', '킥파워 80km/h 이상', 2, 'km/h'),
  ('kick_power_gold', 'kick_power', 110, 'gte', '🥇', '킥파워 110km/h 이상', 3, 'km/h')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Vertical Jump (higher is better, unit: cm)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('vertical_jump_bronze', 'vertical_jump', 25, 'gte', '🥉', '수직점프 25cm 이상', 1, 'cm'),
  ('vertical_jump_silver', 'vertical_jump', 40, 'gte', '🥈', '수직점프 40cm 이상', 2, 'cm'),
  ('vertical_jump_gold', 'vertical_jump', 55, 'gte', '🥇', '수직점프 55cm 이상', 3, 'cm')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Agility (lower is better, unit: 초)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('agility_bronze', 'agility', 20, 'lte', '🥉', '민첩성 20초 이내', 1, '초'),
  ('agility_silver', 'agility', 15, 'lte', '🥈', '민첩성 15초 이내', 2, '초'),
  ('agility_gold', 'agility', 10, 'lte', '🥇', '민첩성 10초 이내', 3, '초')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Shooting Accuracy (higher is better, unit: %)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('shooting_accuracy_bronze', 'shooting_accuracy', 10, 'gte', '🥉', '슈팅 정확도 10개 이상', 1, '%'),
  ('shooting_accuracy_silver', 'shooting_accuracy', 20, 'gte', '🥈', '슈팅 정확도 20개 이상', 2, '%'),
  ('shooting_accuracy_gold', 'shooting_accuracy', 25, 'gte', '🥇', '슈팅 정확도 25개 이상', 3, '%')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Juggling (higher is better, unit: 회)
INSERT INTO medal_criteria (code, stat_type, threshold, comparison, icon, label, difficulty_tier, unit)
VALUES
  ('juggling_bronze', 'juggling', 50, 'gte', '🥉', '리프팅 50회 이상', 1, '회'),
  ('juggling_silver', 'juggling', 200, 'gte', '🥈', '리프팅 200회 이상', 2, '회'),
  ('juggling_gold', 'juggling', 500, 'gte', '🥇', '리프팅 500회 이상', 3, '회'),
  ('juggling_diamond', 'juggling', 1000, 'gte', '💎', '리프팅 1000회 이상', 4, '회')
ON CONFLICT (code) DO UPDATE SET difficulty_tier = EXCLUDED.difficulty_tier, unit = EXCLUDED.unit;

-- Update any existing medal_criteria rows that don't have proper unit set
UPDATE medal_criteria mc SET unit = m.unit
FROM (VALUES
  ('sprint_50m', '초'), ('sprint_30m', '초'), ('run_1000m', '초'),
  ('agility', '초'), ('shuttle_run', '회'), ('kick_power', 'km/h'),
  ('vertical_jump', 'cm'), ('shooting_accuracy', '%'), ('juggling', '회')
) AS m(stat_type, unit)
WHERE mc.stat_type = m.stat_type AND mc.unit = '';
