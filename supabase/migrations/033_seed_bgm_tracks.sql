-- Sprint 35: BGM 트랙 시드 데이터
-- 실제 음원은 R2 /bgm/ 에 업로드 필요 (Pixabay Music CC0)

INSERT INTO bgm_tracks (title, artist, category, r2_key, duration_sec, bpm) VALUES
  -- Epic
  ('Rise of Champions', 'Pixabay', 'epic', 'bgm/rise-of-champions.mp3', 120, 130),
  ('Glory Awaits', 'Pixabay', 'epic', 'bgm/glory-awaits.mp3', 90, 140),
  ('Victory March', 'Pixabay', 'epic', 'bgm/victory-march.mp3', 105, 135),

  -- Hype
  ('Energy Boost', 'Pixabay', 'hype', 'bgm/energy-boost.mp3', 80, 150),
  ('Unstoppable', 'Pixabay', 'hype', 'bgm/unstoppable.mp3', 95, 145),
  ('Game On', 'Pixabay', 'hype', 'bgm/game-on.mp3', 85, 155),

  -- Chill
  ('Sunset Drive', 'Pixabay', 'chill', 'bgm/sunset-drive.mp3', 110, 100),
  ('Easy Flow', 'Pixabay', 'chill', 'bgm/easy-flow.mp3', 100, 95),
  ('Calm Waters', 'Pixabay', 'chill', 'bgm/calm-waters.mp3', 115, 90),

  -- Cinematic
  ('The Journey', 'Pixabay', 'cinematic', 'bgm/the-journey.mp3', 130, 80),
  ('Epic Moments', 'Pixabay', 'cinematic', 'bgm/epic-moments.mp3', 125, 85),
  ('Dream Big', 'Pixabay', 'cinematic', 'bgm/dream-big.mp3', 140, 75)
ON CONFLICT DO NOTHING;
