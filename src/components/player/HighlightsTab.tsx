"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard } from "@/components/ui/Card";
import FeaturedSlot from "./FeaturedSlot";
import TagAccordion from "./TagAccordion";
import dynamic from "next/dynamic";
import Link from "next/link";

const ClipPickerSheet = dynamic(() => import("./ClipPickerSheet"), { ssr: false });
import VideoThumb from "./VideoThumb";
import ClipPlayerSheet, { type PlayableClip } from "./ClipPlayerSheet";
import TagEditSheet from "./TagEditSheet";
import { useFeaturedClips } from "@/hooks/useClips";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { MAX_FEATURED_SLOTS, getSkillTagsForPosition } from "@/lib/constants";

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface HighlightsTabProps {
  level: number;
  tagClips: Record<string, TagClip[]>;
  untaggedClips?: TagClip[];
  tagClipsLoading?: boolean;
  position?: string | null;
  onDeleteClip?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string, tags: string[]) => Promise<boolean>;
}

function maxSlotsByLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 1;
  if (level === 3) return 2;
  return MAX_FEATURED_SLOTS; // 3
}

export default function HighlightsTab({
  level,
  tagClips,
  untaggedClips = [],
  tagClipsLoading,
  position,
  onDeleteClip,
  onEditTags,
}: HighlightsTabProps) {
  const { featured, fetchFeatured, addFeatured, removeFeatured } = useFeaturedClips();
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const handleAdd = useCallback(() => setPickerOpen(true), []);
  const handleSelect = useCallback(async (clipId: string) => {
    await addFeatured(clipId);
  }, [addFeatured]);
  const handleRemove = useCallback(async (clipId: string) => {
    await removeFeatured(clipId);
  }, [removeFeatured]);

  const [featuredPlayIndex, setFeaturedPlayIndex] = useState<number | null>(null);

  const maxSlots = maxSlotsByLevel(level);
  const slotsToShow = maxSlots === 0 ? 0 : Math.min(featured.length + 1, maxSlots);
  const excludeClipIds = featured.map((f) => f.clip_id);

  const tagsToShow = getSkillTagsForPosition(position);

  // Convert featured clips to PlayableClip format
  const featuredPlayable: PlayableClip[] = featured
    .filter((f) => f.clips?.video_url)
    .map((f) => ({
      id: f.clip_id,
      videoUrl: f.clips!.video_url,
      thumbnailUrl: f.clips?.thumbnail_url,
    }));

  return (
    <ErrorBoundary>
    <div className="flex flex-col gap-5">
      {/* Featured Highlights */}
      <SectionCard title="대표 하이라이트" icon="⭐">
        {slotsToShow > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: slotsToShow }).map((_, i) => {
              const feat = featured[i];
              return (
                <div
                  key={i}
                  className="animate-fade-up cursor-pointer"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => {
                    if (feat?.clips?.video_url) {
                      const idx = featuredPlayable.findIndex((p) => p.id === feat.clip_id);
                      if (idx >= 0) setFeaturedPlayIndex(idx);
                    }
                  }}
                >
                  <FeaturedSlot
                    clipId={feat?.clip_id}
                    videoUrl={feat?.clips?.video_url}
                    thumbnailUrl={feat?.clips?.thumbnail_url}
                    highlightStart={feat?.clips?.highlight_start ?? undefined}
                    highlightEnd={feat?.clips?.highlight_end ?? undefined}
                    sortOrder={i + 1}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-2xl">🔒</span>
            <p className="text-[12px] text-text-3">
              <span className="font-semibold text-accent">Lv.2</span>부터 대표 영상을 등록할 수 있습니다
            </p>
          </div>
        )}
        {maxSlots > 0 && maxSlots < MAX_FEATURED_SLOTS && (
          <p className="mt-2 text-center text-xs text-text-3">
            다음 레벨에서 <span className="font-semibold text-accent">{maxSlots + 1}슬롯</span>이 열립니다
          </p>
        )}
      </SectionCard>

      {/* Featured clip player */}
      {featuredPlayIndex !== null && featuredPlayable.length > 0 && (
        <ClipPlayerSheet
          clips={featuredPlayable}
          initialIndex={featuredPlayIndex}
          onClose={() => setFeaturedPlayIndex(null)}
        />
      )}

      {/* Upload CTA */}
      <Link
        href="/upload"
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-card)] py-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
      >
        <span>+</span> 영상 추가
      </Link>

      {/* 태그 없는 클립 → 상단 "최근 업로드" 섹션 */}
      {!tagClipsLoading && untaggedClips.length > 0 && (
        <UntaggedClipsSection
          clips={untaggedClips}
          onDeleteClip={onDeleteClip}
          onEditTags={onEditTags}
        />
      )}

      {/* Tag accordions */}
      {tagClipsLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {tagsToShow.map((tag, i) => (
            <div key={tag.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <TagAccordion
                emoji={tag.emoji}
                label={tag.label}
                clips={tagClips[tag.id] ?? []}
                onDeleteClip={onDeleteClip}
              />
            </div>
          ))}
        </>
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
    </div>
    </ErrorBoundary>
  );
}

/* ── Untagged clips section — opens shared player with swipe nav ── */
function UntaggedClipsSection({
  clips,
  onDeleteClip,
  onEditTags,
}: {
  clips: TagClip[];
  onDeleteClip?: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string, tags: string[]) => Promise<boolean>;
}) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  const playableClips: PlayableClip[] = clips.map((c) => ({
    id: c.id,
    videoUrl: c.videoUrl,
    thumbnailUrl: c.thumbnailUrl,
    duration: c.duration,
  }));

  return (
    <div className="animate-fade-up">
      <div className="overflow-hidden rounded-xl border border-accent/20 bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[16px]">📹</span>
            <span className="text-[13px] font-semibold text-text-1">최근 업로드</span>
            <span className="text-[11px] text-text-3">{clips.length}개</span>
          </div>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
            태그를 추가해 포트폴리오를 정리하세요
          </span>
        </div>
        <div className="px-4 pb-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {clips.map((clip, i) => (
              <div key={clip.id} className="relative w-[160px] shrink-0">
                <button type="button" onClick={() => setPlayingIndex(i)} className="w-full text-left">
                  <VideoThumb
                    thumbnailUrl={clip.thumbnailUrl ?? undefined}
                    duration={clip.duration}
                    aspectRatio="4/3"
                  />
                </button>
                {onEditTags && (
                  <button
                    type="button"
                    onClick={() => setEditingClipId(clip.id)}
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg bg-accent/10 py-1.5 text-[11px] font-medium text-accent active:bg-accent/20"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    태그 추가
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared player for all untagged clips */}
      {playingIndex !== null && (
        <ClipPlayerSheet
          clips={playableClips}
          initialIndex={playingIndex}
          onClose={() => setPlayingIndex(null)}
          onDelete={onDeleteClip}
          onEditTags={onEditTags ? (clipId) => {
            setPlayingIndex(null);
            setEditingClipId(clipId);
          } : undefined}
        />
      )}

      {/* Tag edit sheet */}
      {editingClipId && onEditTags && (
        <TagEditSheet
          clipId={editingClipId}
          currentTags={[]}
          onClose={() => setEditingClipId(null)}
          onSave={onEditTags}
        />
      )}
    </div>
  );
}
