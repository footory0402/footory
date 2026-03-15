-- Sprint 31: Render Jobs + Skill Labels + BGM Tracks + Highlights + Clips ALTER
-- ============================================================================

-- 1. render_jobs 테이블
CREATE TABLE IF NOT EXISTS render_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id     uuid NOT NULL,
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued','processing','done','failed')),
  progress    smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error       text,
  retry_count smallint NOT NULL DEFAULT 0,
  input_key   text NOT NULL,           -- raw/ R2 key
  output_key  text,                    -- clips/ R2 key (렌더 완료 시)
  params      jsonb NOT NULL DEFAULT '{}', -- trim, spotlight, labels, effects 등
  started_at  timestamptz,
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_render_jobs_clip ON render_jobs(clip_id);
CREATE INDEX idx_render_jobs_owner ON render_jobs(owner_id);
CREATE INDEX idx_render_jobs_status ON render_jobs(status) WHERE status IN ('queued','processing');

-- RLS
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "render_jobs_owner_select" ON render_jobs
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "render_jobs_owner_insert" ON render_jobs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Service role only updates (Container worker)
CREATE POLICY "render_jobs_service_update" ON render_jobs
  FOR UPDATE USING (true);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_render_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_render_jobs_updated_at
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW EXECUTE FUNCTION update_render_jobs_updated_at();

-- 2. skill_labels 마스터 테이블 + 17개 시드
CREATE TABLE IF NOT EXISTS skill_labels (
  id        text PRIMARY KEY,
  label_ko  text NOT NULL,
  category  text NOT NULL CHECK (category IN ('common','attack','defense','gk')),
  sort_order smallint NOT NULL DEFAULT 0
);

INSERT INTO skill_labels (id, label_ko, category, sort_order) VALUES
  -- 공용 (common)
  ('first_touch',  '퍼스트터치',   'common',  1),
  ('body_feint',   '바디페인트',   'common',  2),
  ('speed',        '스피드',       'common',  3),
  ('stamina',      '체력',         'common',  4),
  ('vision',       '시야',         'common',  5),
  -- 공격 (attack)
  ('dribble',      '드리블',       'attack',  1),
  ('shooting',     '슈팅',         'attack',  2),
  ('volley',       '발리슛',       'attack',  3),
  ('heading',      '헤딩',         'attack',  4),
  ('through_pass', '스루패스',     'attack',  5),
  ('cross',        '크로스',       'attack',  6),
  -- 수비 (defense)
  ('tackle',       '태클',         'defense', 1),
  ('interception', '인터셉트',     'defense', 2),
  ('marking',      '마킹',         'defense', 3),
  ('clearance',    '클리어링',     'defense', 4),
  -- GK
  ('gk_save',      '세이브',       'gk',      1),
  ('gk_punch',     '펀칭',         'gk',      2)
ON CONFLICT (id) DO NOTHING;

-- 3. bgm_tracks 마스터 테이블
CREATE TABLE IF NOT EXISTS bgm_tracks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  artist      text,
  category    text NOT NULL CHECK (category IN ('epic','chill','hype','cinematic')),
  r2_key      text NOT NULL,          -- bgm/filename.mp3
  duration_sec smallint NOT NULL,
  bpm         smallint,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. highlights 테이블 (릴 — Sprint 36에서 사용)
CREATE TABLE IF NOT EXISTS highlights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text,
  clip_ids    uuid[] NOT NULL DEFAULT '{}',
  render_job_id uuid REFERENCES render_jobs(id),
  rendered_url text,
  thumbnail_url text,
  duration_sec smallint,
  status      text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','rendering','done','failed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_highlights_owner ON highlights(owner_id);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "highlights_owner_select" ON highlights
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "highlights_owner_insert" ON highlights
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "highlights_owner_delete" ON highlights
  FOR DELETE USING (owner_id = auth.uid());

-- 5. clips 테이블 ALTER — 렌더 파이프라인 필드 추가
ALTER TABLE clips ADD COLUMN IF NOT EXISTS raw_key text;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS rendered_url text;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS render_job_id uuid REFERENCES render_jobs(id);
ALTER TABLE clips ADD COLUMN IF NOT EXISTS skill_labels text[] DEFAULT '{}';
ALTER TABLE clips ADD COLUMN IF NOT EXISTS custom_labels text[] DEFAULT '{}';
ALTER TABLE clips ADD COLUMN IF NOT EXISTS trim_start real DEFAULT 0;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS trim_end real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS duration_sec real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS spotlight_x real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS spotlight_y real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS slowmo_start real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS slowmo_end real;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS slowmo_speed real DEFAULT 0.5;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS bgm_id uuid REFERENCES bgm_tracks(id);
ALTER TABLE clips ADD COLUMN IF NOT EXISTS effects jsonb DEFAULT '{"color":true,"cinematic":true,"eafc":true,"intro":true}';

-- Realtime 활성화 (render_jobs 상태 변경 구독)
ALTER PUBLICATION supabase_realtime ADD TABLE render_jobs;
