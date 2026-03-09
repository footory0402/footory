"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard } from "@/components/ui/Card";
import FeaturedSlot from "./FeaturedSlot";
import StatRow from "./StatRow";
import MedalBadge from "./MedalBadge";
import dynamic from "next/dynamic";

const ClipPickerSheet = dynamic(() => import("./ClipPickerSheet"), { ssr: false });
import { useFeaturedClips } from "@/hooks/useClips";
import EmptyCTA from "@/components/ui/EmptyCTA";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { MAX_FEATURED_SLOTS, MEASUREMENTS } from "@/lib/constants";
import type { Stat, Medal } from "@/lib/types";

interface SummaryTabProps {
  level: number;
  stats: Stat[];
  medals: Medal[];
  onAddStat?: () => void;
  onShareProfile?: () => void;
}

/**
 * Progressive Disclosure: max featured slots by level.
 * Lv.1: 0 (empty profile), Lv.2: 1, Lv.3: 2, Lv.4+: 3
 */
function maxSlotsByLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 1;
  if (level === 3) return 2;
  return MAX_FEATURED_SLOTS; // 3
}

export default function SummaryTab({
  level,
  stats,
  medals,
  onAddStat,
  onShareProfile,
}: SummaryTabProps) {
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

  // Progressive disclosure: max slots determined by level
  const maxSlots = maxSlotsByLevel(level);
  // Within the level cap, show filled + 1 empty slot (for adding)
  const slotsToShow = maxSlots === 0 ? 0 : Math.min(featured.length + 1, maxSlots);
  const excludeClipIds = featured.map((f) => f.clip_id);

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

      {/* Key Stats — FM-style bar chart */}
      <SectionCard title="핵심 스탯" icon="📊">
        {stats.length > 0 ? (
          <div>
            {stats.map((stat) => {
              const m = MEASUREMENTS.find((m) => m.id === stat.type);
              return (
                <StatRow
                  key={stat.id}
                  icon={m?.icon ?? "📊"}
                  label={m?.label ?? stat.type}
                  value={stat.value}
                  unit={stat.unit}
                  type={stat.type}
                  previousValue={stat.previousValue}
                  verified={stat.verified}
                  lowerIsBetter={m?.lowerIsBetter}
                />
              );
            })}
          </div>
        ) : (
          <EmptyCTA text="첫 측정 기록을 추가하세요" onAction={onAddStat} />
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
      <button
        onClick={onShareProfile}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[13px] font-semibold text-bg transition-opacity active:opacity-80"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
        프로필 공유하기
      </button>

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
