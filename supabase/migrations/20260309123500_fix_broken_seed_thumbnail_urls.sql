-- Replace broken Unsplash seed thumbnails that now return 404.

UPDATE clips
SET thumbnail_url = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=960'
WHERE thumbnail_url = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=960';

UPDATE feed_items
SET metadata = jsonb_set(
  metadata,
  '{thumbnail_url}',
  to_jsonb('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=640'::text),
  true
)
WHERE metadata->>'thumbnail_url' = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=640';

UPDATE team_albums
SET media_url = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=960'
WHERE media_type = 'photo'
  AND media_url = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=960';
