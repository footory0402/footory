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
  createdAt: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
  effects?: Record<string, boolean> | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
}

interface Reel {
  id: string;
  title: string | null;
  clip_ids: string[];
  status: string;
  created_at: string;
  thumbnail_url: string | null;
  total_duration: number;
}

interface HighlightsTabV5Props {
  tagClips: Record<string, TagClip[]>;
  untaggedClips?: TagClip[];
  tagClipsLoading?: boolean;
  position?: string | null;
  playerName?: string | null;
  playerBirthYear?: number | null;
  playerTeamName?: string | null;
  onDeleteClip?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string, tags: string[]) => Promise<boolean>;
  onShare?: (clipId: string) => void;
  readOnly?: boolean;
  initialReels?: Reel[];
  initialFeatured?: Array<{
    clip_id: string;
    clips?: {
      video_url: string;
      thumbnail_url?: string | null;
      effects?: Record<string, boolean> | null;
      spotlight_x?: number | null;
      spotlight_y?: number | null;
      freeze_at?: number | null;
      trim_start?: number | null;
      trim_end?: number | null;
    } | null;
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
  playerName,
  playerBirthYear,
  playerTeamName,
  onDeleteClip,
  onEditTags,
  onShare,
  readOnly,
  initialReels,
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
  const [editMode, setEditMode] = useState(false);
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 릴 상태
  const [reels, setReels] = useState<Reel[]>(initialReels ?? []);
  const [reelsLoading, setReelsLoading] = useState(!readOnly && !initialReels);
  const [playingReelClips, setPlayingReelClips] = useState<PlayableClip[] | null>(null);
  const [loadingReelId, setLoadingReelId] = useState<string | null>(null);
  const [deletingReelId, setDeletingReelId] = useState<string | null>(null);
  const [isDeletingReel, setIsDeletingReel] = useState(false);

  useEffect(() => {
    if (readOnly) return;
    fetchFeatured();
  }, [fetchFeatured, readOnly]);

  useEffect(() => {
    if (readOnly || initialReels) return;
    fetch("/api/highlights")
      .then((r) => r.json())
      .then((data) => setReels(data.highlights ?? []))
      .catch(() => {})
      .finally(() => setReelsLoading(false));
  }, [readOnly, initialReels]);

  const handlePlayReel = async (reelId: string) => {
    setLoadingReelId(reelId);
    try {
      const res = await fetch(`/api/highlights/${reelId}`);
      const data = await res.json();
      const clips: PlayableClip[] = (data.clips ?? []).map((c: {
        id: string; video_url: string; thumbnail_url?: string | null;
        spotlight_x?: number | null; spotlight_y?: number | null;
        freeze_at?: number | null; trim_start?: number | null; trim_end?: number | null;
        slowmo_start?: number | null; slowmo_end?: number | null; slowmo_speed?: number | null;
        bgm_id?: string | null; effects?: PlayableClip["effects"];
      }) => ({
        id: c.id,
        videoUrl: c.video_url,
        thumbnailUrl: c.thumbnail_url,
        spotlightX: c.spotlight_x,
        spotlightY: c.spotlight_y,
        freezeAt: c.freeze_at,
        trimStart: c.trim_start,
        trimEnd: c.trim_end,
        slowmoStart: c.slowmo_start,
        slowmoEnd: c.slowmo_end,
        slowmoSpeed: c.slowmo_speed,
        bgmId: c.bgm_id,
        effects: c.effects,
        playerName: playerName ?? undefined,
        playerPosition: position ?? undefined,
        playerBirthYear: playerBirthYear ?? undefined,
        teamName: playerTeamName ?? undefined,
      }));
      setPlayingReelClips(clips);
    } catch {
      // silent
    } finally {
      setLoadingReelId(null);
    }
  };

  const handleDeleteReel = async () => {
    if (!deletingReelId) return;
    setIsDeletingReel(true);
    try {
      await fetch(`/api/highlights/${deletingReelId}`, { method: "DELETE" });
      setReels((prev) => prev.filter((r) => r.id !== deletingReelId));
    } catch {
      // silent
    } finally {
      setIsDeletingReel(false);
      setDeletingReelId(null);
    }
  };

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
  }).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
    return bTime - aTime;
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
      effects: f.clips?.effects ? (f.clips.effects as PlayableClip["effects"]) : null,
      spotlightX: f.clips?.spotlight_x ?? null,
      spotlightY: f.clips?.spotlight_y ?? null,
      freezeAt: f.clips?.freeze_at ?? null,
      trimStart: f.clips?.trim_start ?? null,
      trimEnd: f.clips?.trim_end ?? null,
      playerName: playerName ?? undefined,
      playerPosition: position ?? undefined,
      playerBirthYear: playerBirthYear ?? undefined,
      teamName: playerTeamName ?? undefined,
    }));

  const gridPlayable: PlayableClip[] = filteredClips
    .filter((c) => !!c.videoUrl)
    .map((c) => ({
      id: c.id,
      videoUrl: c.videoUrl,
      thumbnailUrl: c.thumbnailUrl,
      duration: c.duration,
      tag: c.tag,
      effects: c.effects ?? null,
      spotlightX: c.spotlightX ?? null,
      spotlightY: c.spotlightY ?? null,
      freezeAt: c.freezeAt ?? null,
      trimStart: c.trimStart ?? null,
      trimEnd: c.trimEnd ?? null,
      playerName: playerName ?? undefined,
      playerPosition: position ?? undefined,
      playerBirthYear: playerBirthYear ?? undefined,
      teamName: playerTeamName ?? undefined,
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
      <div className="pt-3 pb-24">

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
        ) : !readOnly ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/[0.08]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <div>
              <p className="mb-1 text-[14px] font-bold text-text-1">
                첫 하이라이트를 올려보세요
              </p>
              <p className="text-[12px] text-text-3">
                스킬을 태그하면 포지션별로 정리돼요
              </p>
            </div>
            <Link
              href="/upload"
              className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-bg no-underline"
            >
              영상 업로드 →
            </Link>
          </div>
        ) : null}

        {/* ── Section header ── */}
        {hasClips && (
        <div className="mt-5 mb-[10px] flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <div
              style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                background: "var(--color-accent)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-text-1)",
              }}
            >
              전체 클립
            </span>
            <span
              style={{
                fontFamily: "var(--font-stat)",
                fontSize: 11,
                color: "var(--color-text-3)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: "1px 7px",
              }}
            >
              {dedupedClips.length}
            </span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Link
                href="/upload"
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(212,168,83,0.08)",
                  border: "1px solid rgba(212,168,83,0.2)",
                  color: "var(--color-accent)",
                  fontSize: 10,
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                + 영상 추가
              </Link>
              {dedupedClips.length >= 2 && (
                <Link
                  href="/reel/create"
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--color-text-2)",
                    fontSize: 10,
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  🎬 릴 만들기
                </Link>
              )}
              {dedupedClips.length > 0 && (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: editMode ? "rgba(212,168,83,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${editMode ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.08)"}`,
                    color: editMode ? "var(--color-accent)" : "var(--color-text-3)",
                    fontSize: 10,
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {editMode ? "완료" : "편집"}
                </button>
              )}
            </div>
          )}
        </div>
        )}

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

        {/* ── 3-column 1:1 grid (Instagram style) ── */}
        {tagClipsLoading ? (
          <div className="-mx-4 grid grid-cols-3 gap-[2px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  aspectRatio: "1/1",
                  background: "var(--color-card)",
                }}
              />
            ))}
          </div>
        ) : hasClips ? (
          <div className="-mx-4 grid grid-cols-3 gap-[2px]">
            {/* 릴 카드 — col-span-2, 그리드 최상단 */}
            {!reelsLoading && reels.map((reel) => (
              <div key={reel.id} className="col-span-2">
                <ReelCard
                  reel={reel}
                  loading={loadingReelId === reel.id}
                  onPlay={() => handlePlayReel(reel.id)}
                  onDelete={!readOnly ? () => setDeletingReelId(reel.id) : undefined}
                  isEditMode={editMode}
                />
              </div>
            ))}

            {/* Upload card — only show when clips exist (empty state CTA handles 0 clips) */}
            {!readOnly && hasClips && (
              <Link
                href="/upload"
                className="flex flex-col items-center justify-center gap-1"
                style={{
                  aspectRatio: "1/1",
                  background: "rgba(212,168,83,0.02)",
                  border: "1px dashed rgba(212,168,83,0.15)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(212,168,83,0.08)",
                    fontSize: 18,
                    color: "rgba(212,168,83,0.5)",
                  }}
                >
                  +
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(212,168,83,0.5)",
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
                  if (editMode) return;
                  setPlayingIndex(i);
                  setPlayingSource("grid");
                }}
                onEditTags={
                  !readOnly && !editMode && onEditTags
                    ? () => setEditingClipId(clip.id)
                    : undefined
                }
                isEditMode={editMode}
                onDeleteInEditMode={
                  editMode && onDeleteClip
                    ? () => setDeletingClipId(clip.id)
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {!tagClipsLoading && filteredClips.length === 0 && activeTag !== "전체" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-3)",
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

        {/* 릴 플레이어 */}
        {playingReelClips && playingReelClips.length > 0 && (
          <ClipPlayerSheet
            clips={playingReelClips}
            initialIndex={0}
            onClose={() => setPlayingReelClips(null)}
            onShare={onShare}
          />
        )}

        {/* 릴 삭제 확인 바텀시트 */}
        {deletingReelId && (
          <>
            <div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => { if (!isDeletingReel) setDeletingReelId(null); }}
            />
            <div
              className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px]"
              style={{ transform: "translateX(-50%)", background: "var(--color-card)", borderTop: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "24px 20px calc(24px + env(safe-area-inset-bottom))" }}
            >
              <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.1)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)", fontFamily: "var(--font-body)", marginBottom: 6 }}>릴을 삭제할까요?</p>
                <p style={{ fontSize: 12, color: "var(--color-text-3)", fontFamily: "var(--font-body)", marginBottom: 24 }}>클립은 삭제되지 않아요.</p>
                <button
                  disabled={isDeletingReel}
                  onClick={handleDeleteReel}
                  className="mb-3 flex w-full items-center justify-center"
                  style={{ height: 48, borderRadius: 12, background: "rgb(239,68,68)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)", opacity: isDeletingReel ? 0.6 : 1, cursor: isDeletingReel ? "not-allowed" : "pointer" }}
                >
                  {isDeletingReel ? (
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  ) : "삭제"}
                </button>
                <button
                  disabled={isDeletingReel}
                  onClick={() => setDeletingReelId(null)}
                  style={{ width: "100%", height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "var(--color-text-2)", fontSize: 15, fontFamily: "var(--font-body)", cursor: "pointer" }}
                >
                  취소
                </button>
              </div>
            </div>
          </>
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
              onShare={onShare}
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
              onShare={onShare}
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
            currentTags={
              Object.entries(tagClips)
                .filter(([, clips]) => clips.some((c) => c.id === editingClipId))
                .map(([tagId]) => tagsToShow.find((t) => t.id === tagId)?.dbName ?? tagId)
                .filter(Boolean) as string[]
            }
            onClose={() => setEditingClipId(null)}
            onSave={onEditTags}
          />
        )}

        {/* Delete confirm bottom sheet (edit mode) */}
        {deletingClipId && (
          <>
            <div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => { if (!isDeleting) setDeletingClipId(null); }}
            />
            <div
              className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px]"
              style={{
                transform: "translateX(-50%)",
                background: "var(--color-card)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px 20px 0 0",
                padding: "24px 20px calc(24px + env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="mb-4 flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.1)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)", fontFamily: "var(--font-body)", marginBottom: 6 }}>
                  클립을 삭제할까요?
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-3)", fontFamily: "var(--font-body)", marginBottom: 24 }}>
                  이 작업은 되돌릴 수 없어요.
                </p>
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!onDeleteClip || !deletingClipId) return;
                    setIsDeleting(true);
                    const ok = await onDeleteClip(deletingClipId);
                    setIsDeleting(false);
                    setDeletingClipId(null);
                    if (ok) setEditMode(false);
                  }}
                  className="mb-3 flex w-full items-center justify-center"
                  style={{
                    height: 48,
                    borderRadius: 12,
                    background: "rgb(239,68,68)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    opacity: isDeleting ? 0.6 : 1,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                  }}
                >
                  {isDeleting ? (
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  ) : "삭제"}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setDeletingClipId(null)}
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--color-text-2)",
                    fontSize: 15,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </>
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
            color: "var(--color-accent)",
          }}
        >
          대표 영상
        </span>
        <span
          className="ml-auto"
          style={{
            fontSize: 9,
            color: "var(--color-text-3)",
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
          border: "1px solid rgba(212,168,83,0.2)",
          boxShadow: "0 4px 20px rgba(212,168,83,0.06)",
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
                "radial-gradient(circle at 40% 50%, rgba(212,168,83,0.06), transparent 60%)",
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
              background: "rgba(212,168,83,0.15)",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(212,168,83,0.4)",
            }}
          >
            <span
              style={{
                fontSize: 22,
                marginLeft: 3,
                color: "var(--color-accent)",
              }}
            >
              ▶
            </span>
          </div>

          {/* FEATURED badge (top-left) */}
          <div
            className="absolute left-[10px] top-[10px]"
            style={{
              background: "var(--color-accent)",
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
              color: "var(--color-text-2)",
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
          "linear-gradient(135deg, rgba(212,168,83,0.06), rgba(212,168,83,0.02))",
        border: "1px solid rgba(212,168,83,0.2)",
        borderRadius: 12,
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
            background: "rgba(212,168,83,0.08)",
            border: "1px solid rgba(212,168,83,0.2)",
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
              color: "var(--color-accent)",
            }}
          >
            대표 영상을 설정해보세요
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "var(--color-text-3)",
              margin: "3px 0 0",
            }}
          >
            스카우터가 가장 먼저 보는 영상이에요
          </p>
        </div>
        <span style={{ color: "rgba(212,168,83,0.5)", fontSize: 18 }}>›</span>
      </div>
    </button>
  );
}

/* ── Reel Card ── */
function ReelCard({
  reel,
  loading,
  onPlay,
  onDelete,
  isEditMode,
}: {
  reel: Reel;
  loading: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}) {
  return (
    <div
      className="relative w-full cursor-pointer overflow-hidden"
      style={{ aspectRatio: "2/1", background: "#111" }}
      onClick={isEditMode ? onDelete : onPlay}
    >
      {/* 썸네일 */}
      {reel.thumbnail_url && (
        <Image
          src={reel.thumbnail_url}
          alt={reel.title ?? "하이라이트 릴"}
          fill
          sizes="(max-width: 430px) 66vw, 280px"
          className="object-cover"
        />
      )}

      {/* 하단 그라디언트 — 텍스트 가독성 */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" }} />

      {/* 편집 모드: dim + 빨간 X 배지 (ClipCard와 동일 패턴) */}
      {isEditMode && (
        <>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
          <div
            className="absolute left-[4px] top-[4px] z-10 flex items-center justify-center"
            style={{ width: 20, height: 20, borderRadius: "50%", background: "rgb(239,68,68)", border: "1.5px solid rgba(0,0,0,0.4)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        </>
      )}

      {/* 일반 모드 오버레이 */}
      {!isEditMode && (
        <>
          {/* REEL 배지 (top-left) */}
          <div className="absolute left-[5px] top-[5px]" style={{ background: "var(--color-accent)", borderRadius: 3, padding: "1px 5px", fontSize: 8, fontWeight: 800, fontFamily: "var(--font-stat)", color: "#000", letterSpacing: "0.06em" }}>
            REEL
          </div>

          {/* 클립 수 (top-right) */}
          <div className="absolute right-[5px] top-[5px]" style={{ background: "rgba(0,0,0,0.75)", borderRadius: 3, padding: "1px 4px", fontSize: 10, color: "#fff", fontFamily: "var(--font-stat)", lineHeight: 1.4 }}>
            {reel.clip_ids.length}
          </div>

          {/* 로딩 스피너 (중앙) */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,83,0.8)" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
          )}

          {/* 제목 (bottom-left) */}
          <div
            className="absolute bottom-[5px] left-[6px]"
            style={{ fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: "var(--font-body)", maxWidth: "calc(100% - 52px)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", lineHeight: 1.4, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {reel.title ?? "하이라이트 릴"}
          </div>

          {/* 총 재생시간 (bottom-right) — ClipCard duration과 동일 스타일 */}
          <div className="absolute bottom-[5px] right-[5px]" style={{ background: "rgba(0,0,0,0.75)", borderRadius: 3, padding: "1px 4px", fontSize: 10, color: "#fff", fontFamily: "var(--font-stat)", lineHeight: 1.4 }}>
            {formatDuration(Math.round(reel.total_duration))}
          </div>
        </>
      )}
    </div>
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
          ? "rgba(212,168,83,0.08)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.06)"}`,
        color: active
          ? "var(--color-accent)"
          : "var(--color-text-3)",
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

/* ── Clip card (Instagram style: 1:1 square) ── */
function ClipCard({
  clip,
  index,
  onPlay,
  onEditTags,
  isEditMode,
  onDeleteInEditMode,
}: {
  clip: TagClip & { tagLabel?: string; tagEmoji?: string };
  index: number;
  onPlay: () => void;
  onEditTags?: () => void;
  isEditMode?: boolean;
  onDeleteInEditMode?: () => void;
}) {
  return (
    <div
      className="relative cursor-pointer overflow-hidden"
      onClick={isEditMode ? onDeleteInEditMode : onPlay}
      style={{ aspectRatio: "1/1", background: "#111" }}
    >
      {/* Background / Thumbnail */}
      {clip.thumbnailUrl ? (
        <Image
          src={clip.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 430px) 33vw, 140px"
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(${140 + index * 10}deg, rgba(74,222,128,0.02), rgba(212,168,83,0.03))`,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            ▶
          </div>
        </div>
      )}

      {/* Duration (bottom-right) */}
      <div
        className="absolute bottom-[5px] right-[5px]"
        style={{
          background: "rgba(0,0,0,0.75)",
          borderRadius: 3,
          padding: "1px 4px",
          fontSize: 10,
          color: "#fff",
          fontFamily: "var(--font-stat)",
          lineHeight: 1.4,
        }}
      >
        {formatDuration(Math.round(clip.duration))}
      </div>

      {/* Edit mode delete badge (top-left) */}
      {isEditMode && (
        <div
          className="absolute left-[4px] top-[4px] z-10 flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgb(239,68,68)",
            border: "1.5px solid rgba(0,0,0,0.4)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      )}

      {/* Edit mode dim overlay */}
      {isEditMode && (
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.25)" }}
        />
      )}

      {/* Tag badge (top-left) — compact */}
      {clip.tagLabel && !isEditMode && (
        <div
          className="absolute left-[5px] top-[5px]"
          style={{
            padding: "1px 4px",
            borderRadius: 3,
            fontSize: 8,
            background: "rgba(212,168,83,0.2)",
            color: "var(--color-accent)",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}
        >
          #{clip.tagLabel}
        </div>
      )}

      {/* Edit tags button (untagged only) */}
      {!clip.tagLabel && onEditTags && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditTags();
          }}
          className="absolute bottom-[5px] left-[5px] flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            background: "rgba(212,168,83,0.8)",
            color: "#000",
          }}
          aria-label="태그 추가"
        >
          <svg
            width="9"
            height="9"
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
