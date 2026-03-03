// Client-side R2 URL helper (no server imports)
export function getPublicVideoUrl(key: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) return key;
  return `${publicUrl}/${key}`;
}
