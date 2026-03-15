export function getClipDisplayTitle(
  title: string | null | undefined,
  tags: string[],
  playerName: string
) {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  const leadTag = tags.find(Boolean);
  if (leadTag) {
    return `${playerName} ${leadTag} 영상`;
  }

  return `${playerName} 업로드 영상`;
}
