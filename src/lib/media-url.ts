const BROKEN_MEDIA_URL_MAP: Record<string, string> = {
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=640":
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=640",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=960":
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=960",
};

export function normalizeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  return BROKEN_MEDIA_URL_MAP[url] ?? url;
}
