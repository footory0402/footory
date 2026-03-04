"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import SummaryTab from "@/components/player/SummaryTab";
import SkillsTab from "@/components/player/SkillsTab";
import RecordsTab from "@/components/player/RecordsTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";
import ProfileEditSheet from "@/components/player/ProfileEditSheet";
import StatInputSheet from "@/components/stats/StatInputSheet";
import MedalCelebration from "@/components/stats/MedalCelebration";
import { useProfile } from "@/hooks/useProfile";
import { useStats } from "@/hooks/useStats";
import { useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
import type { AwardedMedal } from "@/lib/medals";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [celebrationMedals, setCelebrationMedals] = useState<AwardedMedal[]>([]);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const { stats, medals, loading: statsLoading, addStat } = useStats();
  const { tagClips, loading: tagClipsLoading, fetchTagClips } = useTagClips();
  const { seasons, loading: seasonsLoading } = useSeasons();

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
      <ProfileCard profile={displayProfile} onEdit={() => setEditOpen(true)} />

      <div className="mt-4">
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
          <RecordsTab
            stats={stats}
            medals={medals}
            seasons={seasons}
            onAddStat={() => setStatInputOpen(true)}
          />
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

      <MedalCelebration
        medals={celebrationMedals}
        onClose={() => setCelebrationMedals([])}
      />
    </div>
  );
}
