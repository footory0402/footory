"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import SummaryTab from "@/components/player/SummaryTab";
import SkillsTab from "@/components/player/SkillsTab";
import RecordsTab from "@/components/player/RecordsTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";
import ProfileEditSheet from "@/components/player/ProfileEditSheet";
import StatInputSheet from "@/components/stats/StatInputSheet";
import SeasonAddSheet from "@/components/player/SeasonAddSheet";
import MedalCelebration from "@/components/stats/MedalCelebration";
import AchievementList from "@/components/portfolio/AchievementList";
import GrowthTimeline from "@/components/portfolio/GrowthTimeline";
import { SectionCard } from "@/components/ui/Card";
import QuestChecklist from "@/components/quest/QuestChecklist";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
import { useAchievements } from "@/hooks/useAchievements";
import { useTimeline } from "@/hooks/useTimeline";
import type { AwardedMedal } from "@/lib/medals";

const ProfilePdfExport = dynamic(
  () => import("@/components/portfolio/ProfilePdfExport"),
  { ssr: false }
);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [seasonAddOpen, setSeasonAddOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [celebrationMedals, setCelebrationMedals] = useState<AwardedMedal[]>([]);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const { stats, medals, addStat } = useStats();
  const { tagClips, loading: tagClipsLoading, fetchTagClips } = useTagClips();
  const { seasons, addSeason } = useSeasons();
  const { achievements, addAchievement, removeAchievement } = useAchievements();
  const { events: timelineEvents, loading: timelineLoading } = useTimeline();

  const displayProfile = profile;

  useEffect(() => {
    fetchTagClips();
  }, [fetchTagClips]);

  if (loading && !displayProfile) {
    return <ProfileSkeleton />;
  }

  if (error || !displayProfile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <span className="text-3xl">😢</span>
        <p className="text-[14px] font-medium text-text-1">프로필을 불러올 수 없습니다</p>
        <p className="text-[12px] text-text-3">네트워크를 확인하고 다시 시도해주세요</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-bg"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const handleAddStat = async (statType: string, value: number, evidenceClipId?: string) => {
    const newMedals = await addStat(statType, value, evidenceClipId);
    if (newMedals.length > 0) {
      setCelebrationMedals(newMedals);
    }
  };

  const handleOpenStatInput = () => setStatInputOpen(true);

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/p/${displayProfile.handle}`;
    const title = `${displayProfile.name} (@${displayProfile.handle}) — Footory`;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `${displayProfile.name} 선수 프로필을 확인해보세요`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("프로필 링크가 복사되었습니다.");
    } catch {
      // User cancelled share sheet or clipboard denied.
    }
  };

  // Map tagClips from db tag_name keys to SKILL_TAGS id keys
  const mappedTagClips: Record<string, { id: string; duration: number; tag: string; isTop: boolean }[]> = {};
  for (const [key, clips] of Object.entries(tagClips)) {
    mappedTagClips[key] = clips.map((c) => ({
      id: c.id,
      duration: c.duration,
      tag: c.tag,
      isTop: c.isTop,
    }));
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <ProfileCard profile={displayProfile} onEdit={() => setEditOpen(true)} onAvatarUpload={uploadAvatar} />

      {/* PDF Export button */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {displayProfile.isVerified && ["coach", "scout"].includes(displayProfile.role) && (
            <Link
              href="/profile/watchlist"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-accent hover:text-accent"
            >
              <span>⭐</span>
              관심 선수
            </Link>
          )}
        </div>
        <button
          onClick={() => setPdfExportOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-accent hover:text-accent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PDF 내보내기
        </button>
      </div>

      {/* I13: 이번 주 조회 수 (본인 제외) */}
      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-3">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        이번 주 조회 {displayProfile.views ?? 0}회
      </div>

      {/* Quest Checklist — 레벨 아래, 탭 위 */}
      <div className="mt-3 relative">
        <QuestChecklist profileId={displayProfile.id} />
      </div>

      <div className="mt-3">
        <ProfileTabs active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-5">
        {activeTab === "summary" && (
          <SummaryTab
            level={displayProfile.level}
            stats={stats}
            medals={medals}
            onAddStat={handleOpenStatInput}
            onShareProfile={handleShareProfile}
          />
        )}
        {activeTab === "skills" && (
          <SkillsTab tagClips={mappedTagClips} loading={tagClipsLoading} />
        )}
        {activeTab === "records" && (
          <div className="flex flex-col gap-5">
            <RecordsTab
              stats={stats}
              medals={medals}
              seasons={seasons}
              onAddStat={() => setStatInputOpen(true)}
              onAddSeason={() => setSeasonAddOpen(true)}
            />

            {/* Achievements */}
            <AchievementList
              achievements={achievements}
              onAdd={addAchievement}
              onRemove={removeAchievement}
            />

            {/* Growth Timeline */}
            <SectionCard title="성장 타임라인" icon="📈">
              <GrowthTimeline events={timelineEvents} loading={timelineLoading} />
            </SectionCard>
          </div>
        )}
      </div>

      <ProfileEditSheet
        profile={displayProfile}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={updateProfile}
        onAvatarUpload={uploadAvatar}
        onCheckHandle={checkHandle}
      />

      <StatInputSheet
        open={statInputOpen}
        onClose={() => setStatInputOpen(false)}
        onSave={handleAddStat}
      />

      <SeasonAddSheet
        open={seasonAddOpen}
        onClose={() => setSeasonAddOpen(false)}
        onSave={addSeason}
      />

      <MedalCelebration
        medals={celebrationMedals}
        onClose={() => setCelebrationMedals([])}
      />

      <ProfilePdfExport
        open={pdfExportOpen}
        onClose={() => setPdfExportOpen(false)}
        profile={displayProfile}
        stats={stats}
        medals={medals}
        seasons={seasons}
        achievements={achievements}
      />
    </div>
  );
}
