"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard } from "@/components/ui/Card";
import FeaturedSlot from "./FeaturedSlot";
import StatCard from "./StatCard";
import MedalBadge from "./MedalBadge";
import ClipPickerSheet from "./ClipPickerSheet";
import { useFeaturedClips } from "@/hooks/useClips";
import EmptyCTA from "@/components/ui/EmptyCTA";
import type { Stat, Medal } from "@/lib/types";

interface SummaryTabProps {
  stats: Stat[];
  medals: Medal[];
}

export default function SummaryTab({ stats, medals }: SummaryTabProps) {
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

  // Progressive disclosure: show slots based on how many are filled
  const slotsToShow = Math.min(featured.length + 1, 3);
  const excludeClipIds = featured.map((f) => f.clip_id);

  return (
    <div className="flex flex-col gap-5">
      {/* Featured Highlights */}
      <SectionCard title="대표 하이라이트" icon="⭐">
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
      </SectionCard>

      {/* Key Stats */}
      <SectionCard title="핵심 스탯" icon="📊">
        {stats.length > 0 ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {stats.map((stat, i) => (
              <div key={stat.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyCTA text="첫 측정 기록을 추가하세요" />
        )}
      </SectionCard>

      {/* Medals */}
      <SectionCard title="메달" icon="🏅">
        {medals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {medals.map((medal, i) => (
              <div key={medal.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <MedalBadge label={medal.label} value={medal.value} unit={medal.unit} verified={medal.verified} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyCTA text="측정 기록을 달성하면 메달이 자동 부여됩니다" />
        )}
      </SectionCard>

      {/* Share CTA */}
      <button className="flex w-full items-center justify-center gap-2 rounded-[10px] py-3 text-[13px] font-semibold text-accent transition-colors active:bg-card">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
        프로필 공유하기
      </button>

      {/* Clip Picker */}
      <ClipPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        excludeClipIds={excludeClipIds}
      />
    </div>
  );
}

