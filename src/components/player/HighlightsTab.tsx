"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import VideoThumb from "./VideoThumb";
import ClipPlayerSheet, { type PlayableClip } from "./ClipPlayerSheet";
import TagEditSheet from "./TagEditSheet";
import { useFeaturedClips } from "@/hooks/useClips";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { getSkillTagsForPosition } from "@/lib/constants";

const ClipPickerSheet = dynamic(() => import("./ClipPickerSheet"), { ssr: false });

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface HighlightsTabProps {
  tagClips: Record<string, TagClip[]>;
  untaggedClips?: TagClip[];
  tagClipsLoading?: boolean;
  position?: string | null;
  onDeleteClip?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string, tags: string[]) => Promise<boolean>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}초`;
}

export default function HighlightsTab({
  tagClips,
  untaggedClips = [],
  tagClipsLoading,
  position,
  onDeleteClip,
  onEditTags,
}: HighlightsTabProps) {
  const { featured, fetchFeatured, addFeatured, removeFeatured } = useFeaturedClips();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playingSource, setPlayingSource] = useState<"featured" | "grid" | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const handleAdd = useCallback(() => setPickerOpen(true), []);
  const handleSelect = useCallback(async (clipId: string) => {
    await addFeatured(clipId);
    setPickerOpen(false);
  }, [addFeatured]);
  const handleRemove = useCallback(async (clipId: string) => {
    await removeFeatured(clipId);
  }, [removeFeatured]);

  const maxSlots = 3;
  const excludeClipIds = featured.map((f) => f.clip_id);

  const tagsToShow = getSkillTagsForPosition(position);

  // Build flat grid clips — all tagged + untagged
  const allTaggedClips: (TagClip & { tagLabel?: string; tagEmoji?: string })[] = Object.entries(tagClips).flatMap(([tagId, clips]) => {
    const tagMeta = tagsToShow.find((t) => t.id === tagId);
    return clips.map((c) => ({ ...c, tagLabel: tagMeta?.label, tagEmoji: tagMeta?.emoji }));
  });
  const allClips = [
    ...allTaggedClips,
    ...untaggedClips.map((c) => ({ ...c, tagLabel: undefined, tagEmoji: undefined })),
  ];
  // Deduplicate by id
  const seenIds = new Set<string>();
  const dedupedClips = allClips.filter((c) => {
    if (seenIds.has(c.id)) return false;
    seenIds.add(c.id);
    return true;
  });

  // Filter
  const filteredClips = activeFilter === "all"
    ? dedupedClips
    : dedupedClips.filter((c) => c.tag === activeFilter || c.tag === tagsToShow.find((t) => t.id === activeFilter)?.dbName);

  // Featured playable
  const featuredPlayable: PlayableClip[] = featured
    .filter((f) => f.clips?.video_url)
    .map((f) => ({
      id: f.clip_id,
      videoUrl: f.clips!.video_url,
      thumbnailUrl: f.clips?.thumbnail_url,
    }));

  // Grid playable — filter out clips without valid videoUrl
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

  // Filter tags that actually have clips
  const activeTagsWithClips = tagsToShow.filter((t) =>
    Object.keys(tagClips).includes(t.id) && (tagClips[t.id]?.length ?? 0) > 0
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-4">

        {/* ── Hero Zone: 대표 영상 있을 때만 표시 ── */}
        {featured.length > 0 && (
          <HeroZone
            featured={featured}
            maxSlots={maxSlots}
            featuredPlayable={featuredPlayable}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onPlay={(idx) => { setPlayingIndex(idx); setPlayingSource("featured"); }}
          />
        )}

        {/* ── 대표 영상 없을 때 배너 ── */}
        {featured.length === 0 && hasClips && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-3 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.08] to-transparent px-4 py-3 text-left transition-colors active:bg-accent/10"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-accent">대표 영상을 설정해보세요</p>
              <p className="text-[10px] text-text-3 mt-0.5">스카우터가 가장 먼저 보는 영상이에요</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-50">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* ── 필터 칩 + 그리드 (항상 표시, "+" 첫 셀 포함) ── */}
        <div className="flex flex-col gap-3">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-text-2">전체 클립</span>
            <span className="text-[10px] text-text-3">{dedupedClips.length}개</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          {/* 필터 칩 */}
          {!tagClipsLoading && activeTagsWithClips.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 scrollbar-none">
              <FilterChip
                label="전체"
                count={dedupedClips.length}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              {activeTagsWithClips.map((tag) => (
                <FilterChip
                  key={tag.id}
                  label={`${tag.emoji} ${tag.label}`}
                  count={tagClips[tag.id]?.length ?? 0}
                  active={activeFilter === tag.id}
                  onClick={() => setActiveFilter(tag.id)}
                />
              ))}
              {untaggedClips.length > 0 && (
                <FilterChip
                  label="미분류"
                  count={untaggedClips.length}
                  active={activeFilter === "untagged"}
                  onClick={() => setActiveFilter("untagged")}
                />
              )}
            </div>
          )}

          {/* 3열 그리드 (1:1 비율) */}
          {tagClipsLoading ? (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-card-alt" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {/* "+" 업로드 카드 — 첫 번째 셀 */}
              <Link
                href="/upload"
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-accent/40 bg-card transition-colors active:bg-accent/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[10px] font-semibold text-accent">영상 추가</span>
              </Link>

              {filteredClips.map((clip, i) => (
                <GridThumb
                  key={clip.id}
                  clip={clip}
                  onPlay={() => { setPlayingIndex(i); setPlayingSource("grid"); }}
                  onEditTags={onEditTags ? () => setEditingClipId(clip.id) : undefined}
                />
              ))}

              {/* 빈 상태 (영상 0개 + 필터 없음) */}
              {!tagClipsLoading && filteredClips.length === 0 && activeFilter !== "all" && (
                <div className="col-span-2 flex items-center justify-center py-8 text-[12px] text-text-3">
                  해당 태그의 영상이 없어요
                </div>
              )}
            </div>
          )}

          {/* 영상 0개 전체 빈 상태 */}
          {!tagClipsLoading && !hasClips && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="text-3xl">🎬</span>
              <p className="text-[13px] font-semibold text-text-1">아직 영상이 없어요</p>
              <p className="text-[11px] text-text-3 leading-relaxed">
                첫 영상을 올려 나만의 포트폴리오를<br />시작해보세요
              </p>
            </div>
          )}
        </div>

        {/* Players */}
        {playingSource === "featured" && playingIndex !== null && featuredPlayable.length > 0 && (
          <ClipPlayerSheet
            clips={featuredPlayable}
            initialIndex={playingIndex}
            onClose={() => { setPlayingIndex(null); setPlayingSource(null); }}
          />
        )}
        {playingSource === "grid" && playingIndex !== null && gridPlayable.length > 0 && (
          <ClipPlayerSheet
            clips={gridPlayable}
            initialIndex={playingIndex}
            onClose={() => { setPlayingIndex(null); setPlayingSource(null); }}
            onDelete={onDeleteClip}
            onEditTags={onEditTags ? (clipId) => {
              setPlayingIndex(null);
              setPlayingSource(null);
              setEditingClipId(clipId);
            } : undefined}
          />
        )}

        {/* Clip Picker */}
        {pickerOpen && (
          <ClipPickerSheet
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handleSelect}
            excludeClipIds={excludeClipIds}
          />
        )}

        {/* Tag Edit */}
        {editingClipId && onEditTags && (
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

/* ── Hero Zone ── */
function HeroZone({
  featured,
  maxSlots,
  featuredPlayable,
  onAdd,
  onRemove,
  onPlay,
}: {
  featured: Array<{ clip_id: string; clips?: { video_url: string; thumbnail_url?: string | null; highlight_start?: number | null; highlight_end?: number | null } | null }>;
  maxSlots: number;
  featuredPlayable: PlayableClip[];
  onAdd: () => void;
  onRemove: (clipId: string) => void;
  onPlay: (index: number) => void;
}) {
  const slotsToShow = Math.min(featured.length + 1, maxSlots);
  const slots = Array.from({ length: slotsToShow });

  if (slotsToShow === 0) return null;

  return (
    <div className="-mx-4 rounded-none bg-gradient-to-b from-[#D4A853]/[0.06] to-transparent px-4 pb-4 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/20">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-accent)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="text-[12px] font-bold text-accent uppercase tracking-wider">Featured</span>
          <span className="text-[10px] text-text-3">{featured.length}/{maxSlots}</span>
        </div>
        {maxSlots > featured.length && (
          <button
            onClick={onAdd}
            className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors active:bg-accent/20"
          >
            + 추가
          </button>
        )}
      </div>

      {/* 1개 = 풀폭, 2~3개 = 가로 스크롤 */}
      {featured.length <= 1 ? (
        <div>
          {featured[0] ? (
            <HeroSlot
              clip={featured[0]}
              sortOrder={1}
              fullWidth
              onPlay={() => onPlay(0)}
              onRemove={() => onRemove(featured[0].clip_id)}
            />
          ) : (
            <HeroEmptySlot sortOrder={1} onAdd={onAdd} fullWidth />
          )}
        </div>
      ) : (
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none">
          {slots.map((_, i) => {
            const feat = featured[i];
            return feat ? (
              <HeroSlot
                key={feat.clip_id}
                clip={feat}
                sortOrder={i + 1}
                onPlay={() => onPlay(i)}
                onRemove={() => onRemove(feat.clip_id)}
              />
            ) : (
              <HeroEmptySlot key={`empty-${i}`} sortOrder={i + 1} onAdd={onAdd} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeroSlot({
  clip,
  sortOrder,
  fullWidth = false,
  onPlay,
  onRemove,
}: {
  clip: { clip_id: string; clips?: { video_url: string; thumbnail_url?: string | null; highlight_start?: number | null; highlight_end?: number | null } | null };
  sortOrder: number;
  fullWidth?: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const thumbnailUrl = clip.clips?.thumbnail_url;
  const hs = clip.clips?.highlight_start;
  const he = clip.clips?.highlight_end;
  const duration = hs != null && he != null ? he - hs : 30;

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${fullWidth ? "w-full aspect-video" : "w-[160px] shrink-0 aspect-video"}`}
      style={{
        boxShadow: sortOrder === 1
          ? "0 0 0 2px #D4A853, 0 6px 20px rgba(212,168,83,0.25)"
          : "0 0 0 1.5px rgba(212,168,83,0.4), 0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={`대표 영상 ${sortOrder}`}
          fill
          sizes={fullWidth ? "(max-width: 430px) calc(100vw - 2rem), 398px" : "200px"}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-card-alt text-2xl">🎬</div>
      )}

      {/* Play 버튼 */}
      <button
        onClick={onPlay}
        className="absolute inset-0 flex items-center justify-center"
        aria-label="영상 재생"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>

      {/* 순서 뱃지 (#1 BEST / #2 / #3) */}
      <span className={`absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm ${
        sortOrder === 1
          ? "bg-accent text-bg"
          : "bg-black/60 text-white/80"
      }`}>
        {sortOrder === 1 ? "BEST" : `#${sortOrder}`}
      </span>

      {/* 재생시간 */}
      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 font-stat text-[10px] text-white">
        {formatDuration(Math.round(duration))}
      </span>

      {/* 제거 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:bg-red-500/80"
        aria-label="대표 영상 해제"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function HeroEmptySlot({
  sortOrder,
  onAdd,
  fullWidth = false,
}: {
  sortOrder: number;
  onAdd: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onAdd}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/40 bg-card ${
        fullWidth ? "w-full aspect-video" : "w-[160px] shrink-0 aspect-video"
      }`}
    >
      <span className="text-xl">✨</span>
      <span className="text-[12px] font-medium text-accent">영상 {sortOrder} 추가</span>
    </button>
  );
}

/* ── Filter Chip ── */
function FilterChip({
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
      className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? "bg-accent text-bg"
          : "bg-card border border-white/[0.08] text-text-3 hover:text-text-2"
      }`}
    >
      {label}
      <span className={`rounded-full px-1 text-[10px] font-bold ${active ? "bg-black/20 text-bg" : "text-text-3"}`}>
        {count}
      </span>
    </button>
  );
}

/* ── Grid Thumb ── */
function GridThumb({
  clip,
  onPlay,
  onEditTags,
}: {
  clip: TagClip & { tagLabel?: string; tagEmoji?: string };
  onPlay: () => void;
  onEditTags?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-card-alt aspect-square">
      {clip.thumbnailUrl ? (
        <Image
          src={clip.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 430px) 30vw, 140px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xl">🎬</div>
      )}

      {/* 탭 영역 */}
      <button
        onClick={onPlay}
        className="absolute inset-0"
        aria-label="영상 재생"
      />

      {/* 재생시간 */}
      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 font-stat text-[9px] text-white">
        {formatDuration(Math.round(clip.duration))}
      </span>

      {/* 태그 칩 오버레이 */}
      {clip.tagLabel && (
        <span className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white/80 backdrop-blur-sm">
          {clip.tagEmoji} {clip.tagLabel}
        </span>
      )}

      {/* 미분류 뱃지 */}
      {!clip.tagLabel && (
        <span className="absolute top-1 right-1 rounded bg-white/10 px-1 py-0.5 text-[8px] text-white/50">
          미분류
        </span>
      )}

      {/* 태그 추가 (미분류만) */}
      {!clip.tagLabel && onEditTags && (
        <button
          onClick={(e) => { e.stopPropagation(); onEditTags(); }}
          className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/80 text-bg"
          aria-label="태그 추가"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
