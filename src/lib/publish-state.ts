export type ClipPublishState = "draft" | "published";
export type HighlightPublishState = "draft" | "published";
export type PublishTransition =
  | "draft_saved"
  | "published"
  | "republished"
  | "unpublished";

export function resolveClipPublishState({
  isFeatured,
  tags,
}: {
  isFeatured: boolean;
  tags: string[];
}): ClipPublishState {
  return isFeatured || tags.length > 0 ? "published" : "draft";
}

export function normalizeHighlightPublishState(
  status: string | null | undefined,
): HighlightPublishState {
  return status === "published" || status === "done" ? "published" : "draft";
}

export function resolvePublishTransition({
  previous,
  next,
}: {
  previous: "draft" | "published";
  next: "draft" | "published";
}): PublishTransition {
  if (previous === "published" && next === "draft") return "unpublished";
  if (previous === "published" && next === "published") return "republished";
  if (previous === "draft" && next === "published") return "published";
  return "draft_saved";
}
