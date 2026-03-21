"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import ClipPlayerSheet, { type PlayableClip } from "@/components/player/ClipPlayerSheet";
import TagEditSheet from "@/components/player/TagEditSheet";
import { useFeaturedClips } from "@/hooks/useClips";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { getSkillTagsForPosition } from "@/lib/constants";

const ClipPickerSheet = dynamic(() => import("@/components/player/ClipPickerSheet"), { ssr: false });

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface HighlightsTabV5Props {
  tagClips: Record<string, TagClip[]>;
  untaggedClips?: TagClip[];
  tagClipsLoading?: boolean;
  position?: string | null;
  onDeleteClip?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string, tags: string[]) => Promise<boolean>;
  readOnly?: boolean;
  initialFeatured?: Array<{
    clip_id: string;
    clips?: { video_url: string; thumbnail_url?: string | null } | null;
  }>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HighlightsTabV5({
  tagClips,
  untaggedClips = [],
  tagClipsLoading,
  position,
  onDeleteClip,
  onEditTags,
  readOnly,
  initialFeatured,
}: HighlightsTabV5Props) {
  const {
    featured: hookFeatured,
    fetchFeatured,
    addFeatured,
    removeFeatured,
  } = useFeaturedClips();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playingSource, setPlayingSource] = useState<
    "featured" | "grid" | null
  >(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  useEffect(() => {
    if (readOnly) return;
    fetchFeatured();
  }, [fetchFeatured, readOnly]);

  const featured = readOnly ? (initialFeatured ?? []) : hookFeatured;
  const primaryFeatured = featured[0] ?? null;

  const handleAdd = useCallback(() => setPickerOpen(true), []);
  const handleSelect = useCallback(
    async (clipId: string) => {
      await addFeatured(clipId);
      setPickerOpen(false);
    },
    [addFeatured],
  );

  const tagsToShow = getSkillTagsForPosition(position);
  const excludeClipIds = featured.map((f) => f.clip_id);

  // Build flat clips list
  const allTaggedClips: (TagClip & {
    tagLabel?: string;
    tagEmoji?: string;
  })[] = Object.entries(tagClips).flatMap(([tagId, clips]) => {
    const tagMeta = tagsToShow.find((t) => t.id === tagId);
    return clips.map((c) => ({
      ...c,
      tagLabel: tagMeta?.label,
      tagEmoji: tagMeta?.emoji,
    }));
  });
  const allClips = [
    ...allTaggedClips,
    ...untaggedClips.map((c) => ({
      ...c,
      tagLabel: undefined,
      tagEmoji: undefined,
    })),
  ];
  const seenIds = new Set<string>();
  const dedupedClips = allClips.filter((c) => {
    if (seenIds.has(c.id)) return false;
    seenIds.add(c.id);
    return true;
  });

  // Filter by active tag
  const filteredClips =
    activeTag === "전체"
      ? dedupedClips
      : dedupedClips.filter((c) => {
          const tagMeta = tagsToShow.find(
            (t) => t.label === activeTag || t.dbName === activeTag,
          );
          return tagMeta
            ? c.tag === tagMeta.id || c.tag === tagMeta.dbName
            : c.tagLabel === activeTag;
        });

  // Playable arrays
  const featuredPlayable: PlayableClip[] = featured
    .filter((f) => f.clips?.video_url)
    .map((f) => ({
      id: f.clip_id,
      videoUrl: f.clips!.video_url,
      thumbnailUrl: f.clips?.thumbnail_url,
    }));

  const gridPlayable: PlayableClip[] = filteredClips
    .filter((c) => !!c.videoUrl)
    .map((c) => ({
      id: c.id,
      videoUrl: c.videoUrl,
      thumbnailUrl: c.thumbnailUrl,
      duration: c.duration,
      tag: c.tag,
    }));

  const hasClips = dedupedClips.length > 0 || featured.length > 0;

  // Build tag list with counts (only tags that have clips)
  const tagCounts: { label: string; count: number }[] = [];
  for (const t of tagsToShow) {
    const count = tagClips[t.id]?.length ?? 0;
    if (count > 0) tagCounts.push({ label: t.label, count });
  }

  return (
    <ErrorBoundary>
      <div className="pt-4">
        {/* ── Featured video (v5: 16:9, gold border) ── */}
        {primaryFeatured?.clips?.video_url ? (
          <FeaturedCard
            clip={primaryFeatured}
            onPlay={() => {
              setPlayingIndex(0);
              setPlayingSource("featured");
            }}
            onRemove={
              !readOnly ? () => removeFeatured(primaryFeatured.clip_id) : undefined
            }
          />
        ) : !readOnly && hasClips ? (
          <FeaturedEmptyCTA onAdd={handleAdd} />
        ) : !readOnly ? null : null}

        {/* ── Section header ── */}
        <div className="mt-5 mb-[10px] flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <div
              style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                background: "var(--v5-gold)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--v5-text)",
              }}
            >
              전체 클립
            </span>
            <span
              style={{
                fontFamily: "var(--font-stat)",
                fontSize: 11,
                color: "var(--v5-text-dim)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: "1px 7px",
              }}
            >
              {dedupedClips.length}
            </span>
          </div>
          {!readOnly && (
            <Link
              href="/upload"
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "var(--v5-gold-bg)",
                border: "1px solid var(--v5-gold-border)",
                color: "var(--v5-gold-light)",
                fontSize: 10,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              + 영상 추가
            </Link>
          )}
        </div>

        {/* ── Tag filter pills ── */}
        {!tagClipsLoading && tagCounts.length > 0 && (
          <div
            className="-mx-4 flex gap-[6px] overflow-x-auto px-4"
            style={{ paddingBottom: 10, marginBottom: 4 }}
          >
            <TagPill
              label="전체"
              count={dedupedClips.length}
              active={activeTag === "전체"}
              onClick={() => setActiveTag("전체")}
            />
            {tagCounts.map(({ label, count }) => (
              <TagPill
                key={label}
                label={`#${label}`}
                count={count}
                active={activeTag === label}
                onClick={() => setActiveTag(label)}
              />
            ))}
          </div>
        )}

        {/* ── 2-column 3:4 grid ── */}
        {tagClipsLoading ? (
          <div className="grid grid-cols-2 gap-[10px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[14px]"
                style={{
                  aspectRatio: "3/4",
                  background: "var(--v5-card)",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[10px]">
            {/* Upload card */}
            {!readOnly && (
              <Link
                href="/upload"
                className="flex flex-col items-center justify-center gap-2"
                style={{
                  aspectRatio: "3/4",
                  borderRadius: 14,
                  border: "1.5px dashed rgba(201,168,76,0.2)",
                  background: "rgba(201,168,76,0.02)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--v5-gold-bg)",
                    fontSize: 20,
                    color: "var(--v5-gold-dim)",
                  }}
                >
                  +
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--v5-gold-dim)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  영상 추가
                </span>
              </Link>
            )}

            {filteredClips.map((clip, i) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={i}
                onPlay={() => {
                  setPlayingIndex(i);
                  setPlayingSource("grid");
                }}
                onEditTags={
                  !readOnly && onEditTags
                    ? () => setEditingClipId(clip.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!tagClipsLoading && filteredClips.length === 0 && activeTag !== "전체" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--v5-text-dim)",
                fontFamily: "var(--font-body)",
              }}
            >
              #{activeTag} 태그의 클립이 없어요
            </p>
          </div>
        )}

        {!tagClipsLoading && !hasClips && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-3xl">🎬</span>
            <p className="text-[13px] font-semibold text-text-1">
              {readOnly ? "아직 등록된 영상이 없습니다" : "아직 영상이 없어요"}
            </p>
            {!readOnly && (
              <p className="text-[11px] text-text-3 leading-relaxed">
                첫 영상을 올려 나만의 포트폴리오를
                <br />
                시작해보세요
              </p>
            )}
          </div>
        )}

        {/* Players */}
        {playingSource === "featured" &&
          playingIndex !== null &&
          featuredPlayable.length > 0 && (
            <ClipPlayerSheet
              clips={featuredPlayable}
              initialIndex={playingIndex}
              onClose={() => {
                setPlayingIndex(null);
                setPlayingSource(null);
              }}
            />
          )}
        {playingSource === "grid" &&
          playingIndex !== null &&
          gridPlayable.length > 0 && (
            <ClipPlayerSheet
              clips={gridPlayable}
              initialIndex={playingIndex}
              onClose={() => {
                setPlayingIndex(null);
                setPlayingSource(null);
              }}
              onDelete={readOnly ? undefined : onDeleteClip}
              onEditTags={
                !readOnly && onEditTags
                  ? (clipId) => {
                      setPlayingIndex(null);
                      setPlayingSource(null);
                      setEditingClipId(clipId);
                    }
                  : undefined
              }
            />
          )}

        {/* Clip Picker */}
        {!readOnly && pickerOpen && (
          <ClipPickerSheet
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handleSelect}
            excludeClipIds={excludeClipIds}
          />
        )}

        {/* Tag Edit */}
        {!readOnly && editingClipId && onEditTags && (
          <TagEditSheet
            clipId={editingClipId}
            currentTags={[]}
            onClose={() => setEditingClipId(null)}
            onSave={onEditTags}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

/* ── Featured Card (v5: 16:9, gold border + glow) ── */
function FeaturedCard({
  clip,
  onPlay,
  onRemove,
}: {
  clip: {
    clip_id: string;
    clips?: {
      video_url: string;
      thumbnail_url?: string | null;
      duration_seconds?: number | null;
      highlight_start?: number | null;
      highlight_end?: number | null;
    } | null;
  };
  onPlay: () => void;
  onRemove?: () => void;
}) {
  const thumbUrl = clip.clips?.thumbnail_url;
  const hs = clip.clips?.highlight_start;
  const he = clip.clips?.highlight_end;
  const dur = hs != null && he != null ? he - hs : (clip.clips?.duration_seconds ?? 30);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div
        className="mb-2 flex items-center gap-[6px]"
      >
        <span style={{ fontSize: 14 }}>⭐</span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--v5-gold-light)",
          }}
        >
          대표 영상
        </span>
        <span
          className="ml-auto"
          style={{
            fontSize: 9,
            color: "var(--v5-text-dim)",
            fontFamily: "var(--font-body)",
          }}
        >
          스카우터가 가장 먼저 봅니다
        </span>
      </div>

      {/* Video card */}
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={onPlay}
        style={{
          borderRadius: 16,
          border: "1px solid rgba(201,168,76,0.25)",
          boxShadow: "0 4px 24px rgba(201,168,76,0.1)",
        }}
      >
        {/* 16:9 area */}
        <div
          className="relative flex w-full items-center justify-center"
          style={{
            aspectRatio: "16/9",
            background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)",
          }}
        >
          {/* Gold radial */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 40% 50%, rgba(201,168,76,0.06), transparent 60%)",
            }}
          />

          {/* Thumbnail */}
          {thumbUrl && (
            <Image
              src={thumbUrl}
              alt="대표 영상"
              fill
              sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
              className="object-cover"
            />
          )}

          {/* Play button */}
          <div
            className="relative z-10 flex items-center justify-center"
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(201,168,76,0.15)",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(201,168,76,0.4)",
            }}
          >
            <span
              style={{
                fontSize: 22,
                marginLeft: 3,
                color: "var(--v5-gold-light)",
              }}
            >
              ▶
            </span>
          </div>

          {/* FEATURED badge (top-left) */}
          <div
            className="absolute left-[10px] top-[10px]"
            style={{
              background: "var(--v5-gold)",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "var(--font-stat)",
              color: "#000",
              letterSpacing: "0.08em",
            }}
          >
            ⭐ FEATURED
          </div>

          {/* Duration (top-right) */}
          <div
            className="absolute right-[10px] top-[10px]"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              borderRadius: 4,
              padding: "3px 7px",
              fontSize: 10,
              color: "var(--v5-text-sub)",
              fontFamily: "var(--font-stat)",
            }}
          >
            {formatDuration(Math.round(dur))}
          </div>

          {/* Remove button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute right-[10px] bottom-[10px] z-20 flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
              }}
              aria-label="대표 영상 해제"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Featured Empty CTA ── */
function FeaturedEmptyCTA({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-full text-left"
      style={{
        background:
          "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))",
        border: "1px solid var(--v5-gold-border)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 20,
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "var(--v5-gold-bg)",
            border: "1px solid var(--v5-gold-border)",
            fontSize: 18,
          }}
        >
          ⭐
        </div>
        <div className="flex-1">
          <p
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--v5-gold-light)",
            }}
          >
            대표 영상을 설정해보세요
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "var(--v5-text-dim)",
              margin: "3px 0 0",
            }}
          >
            스카우터가 가장 먼저 보는 영상이에요
          </p>
        </div>
        <span style={{ color: "var(--v5-gold-dim)", fontSize: 18 }}>›</span>
      </div>
    </button>
  );
}

/* ── Tag filter pill (v5 style) ── */
function TagPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0"
      style={{
        padding: "5px 12px",
        borderRadius: 16,
        whiteSpace: "nowrap",
        background: active
          ? "var(--v5-gold-bg)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "var(--v5-gold-border)" : "var(--v5-card-border)"}`,
        color: active
          ? "var(--v5-gold-light)"
          : "var(--v5-text-dim)",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
      {count > 0 && (
        <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Clip card (v5: 3:4 ratio, tags + info overlay) ── */
function ClipCard({
  clip,
  index,
  onPlay,
  onEditTags,
}: {
  clip: TagClip & { tagLabel?: string; tagEmoji?: string };
  index: number;
  onPlay: () => void;
  onEditTags?: () => void;
}) {
  return (
    <div
      className="relative cursor-pointer overflow-hidden"
      onClick={onPlay}
      style={{
        aspectRatio: "3/4",
        borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--v5-card-border)",
      }}
    >
      {/* Background / Thumbnail */}
      {clip.thumbnailUrl ? (
        <Image
          src={clip.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 430px) 45vw, 200px"
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(${140 + index * 10}deg, rgba(74,222,128,0.02), rgba(201,168,76,0.03))`,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(4px)",
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            ▶
          </div>
        </div>
      )}

      {/* Duration (top-right) */}
      <div className="absolute right-2 top-2 flex gap-1">
        <span
          style={{
            background: "rgba(0,0,0,0.7)",
            borderRadius: 3,
            padding: "2px 5px",
            fontSize: 9,
            color: "var(--v5-text-sub)",
            fontFamily: "var(--font-stat)",
          }}
        >
          {formatDuration(Math.round(clip.duration))}
        </span>
      </div>

      {/* Tags (top-left) */}
      {clip.tagLabel && (
        <div className="absolute left-2 top-2 flex gap-[3px]">
          <span
            style={{
              padding: "1px 5px",
              borderRadius: 3,
              fontSize: 8,
              background: "rgba(201,168,76,0.15)",
              color: "var(--v5-gold-light)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            #{clip.tagLabel}
          </span>
        </div>
      )}

      {/* Bottom info overlay */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          padding: "24px 10px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        }}
      >
        <p
          className="m-0 mb-[3px]"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clip.tag || "미분류"}
        </p>
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: 9,
              color: "var(--v5-text-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            {formatDuration(Math.round(clip.duration))}
          </span>
        </div>
      </div>

      {/* Edit tags button (untagged only) */}
      {!clip.tagLabel && onEditTags && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditTags();
          }}
          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: "rgba(201,168,76,0.8)",
            color: "#000",
          }}
          aria-label="태그 추가"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
