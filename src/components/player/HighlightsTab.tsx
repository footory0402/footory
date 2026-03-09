"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard } from "@/components/ui/Card";
import FeaturedSlot from "./FeaturedSlot";
import TagAccordion from "./TagAccordion";
import dynamic from "next/dynamic";
import Link from "next/link";

const ClipPickerSheet = dynamic(() => import("./ClipPickerSheet"), { ssr: false });
import { useFeaturedClips } from "@/hooks/useClips";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { MAX_FEATURED_SLOTS, SKILL_TAGS } from "@/lib/constants";

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
}

interface HighlightsTabProps {
  level: number;
  tagClips: Record<string, TagClip[]>;
  tagClipsLoading?: boolean;
}

function maxSlotsByLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 1;
  if (level === 3) return 2;
  return MAX_FEATURED_SLOTS; // 3
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? "bg-accent text-bg"
          : "bg-card text-text-3 active:bg-card-alt"
      }`}
    >
      {label}
    </button>
  );
}

export default function HighlightsTab({
  level,
  tagClips,
  tagClipsLoading,
}: HighlightsTabProps) {
  const { featured, fetchFeatured, addFeatured, removeFeatured } = useFeaturedClips();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

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

  const maxSlots = maxSlotsByLevel(level);
  const slotsToShow = maxSlots === 0 ? 0 : Math.min(featured.length + 1, maxSlots);
  const excludeClipIds = featured.map((f) => f.clip_id);

  const tagsWithClips = SKILL_TAGS.filter((t) => (tagClips[t.id]?.length ?? 0) > 0);
  const tagsToShow = filter
    ? SKILL_TAGS.filter((t) => t.id === filter)
    : SKILL_TAGS;

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
                <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
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

      {/* Upload CTA */}
      <Link
        href="/upload"
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-card)] py-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
      >
        <span>+</span> 영상 추가
      </Link>

      {/* Filter bar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip label="전체" active={filter === null} onClick={() => setFilter(null)} />
        {tagsWithClips.map((tag) => (
          <FilterChip
            key={tag.id}
            label={`${tag.emoji} ${tag.label}`}
            active={filter === tag.id}
            onClick={() => setFilter(filter === tag.id ? null : tag.id)}
          />
        ))}
      </div>

      {/* Tag accordions */}
      {tagClipsLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        tagsToShow.map((tag, i) => (
          <div key={tag.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <TagAccordion
              emoji={tag.emoji}
              label={tag.label}
              clips={tagClips[tag.id] ?? []}
            />
          </div>
        ))
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
