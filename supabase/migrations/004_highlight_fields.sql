-- Add highlight start/end to clips (client-side trim metadata)
ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS highlight_start integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS highlight_end integer DEFAULT 30;
