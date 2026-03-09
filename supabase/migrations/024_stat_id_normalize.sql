-- 024: Normalize duplicate stat IDs
-- '30m_sprint' → 'sprint_30m', '1000m_run' → 'run_1000m'

-- stats table
UPDATE stats SET stat_type = 'sprint_30m' WHERE stat_type = '30m_sprint';
UPDATE stats SET stat_type = 'run_1000m' WHERE stat_type = '1000m_run';

-- medal_criteria table
UPDATE medal_criteria SET stat_type = 'sprint_30m' WHERE stat_type = '30m_sprint';
UPDATE medal_criteria SET stat_type = 'run_1000m' WHERE stat_type = '1000m_run';

UPDATE medal_criteria SET code = REPLACE(code, '30m_sprint', 'sprint_30m') WHERE code LIKE '%30m_sprint%';
UPDATE medal_criteria SET code = REPLACE(code, '1000m_run', 'run_1000m') WHERE code LIKE '%1000m_run%';

-- medals table (medal_code references medal_criteria.code)
UPDATE medals SET medal_code = REPLACE(medal_code, '30m_sprint', 'sprint_30m') WHERE medal_code LIKE '%30m_sprint%';
UPDATE medals SET medal_code = REPLACE(medal_code, '1000m_run', 'run_1000m') WHERE medal_code LIKE '%1000m_run%';

-- feed_items.metadata (jsonb) — update stat_type field
UPDATE feed_items
SET metadata = jsonb_set(metadata, '{stat_type}', '"sprint_30m"')
WHERE metadata->>'stat_type' = '30m_sprint';

UPDATE feed_items
SET metadata = jsonb_set(metadata, '{stat_type}', '"run_1000m"')
WHERE metadata->>'stat_type' = '1000m_run';
