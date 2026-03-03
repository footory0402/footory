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
import type { AwardedMedal } from "@/lib/medals";
import {
  MOCK_PROFILE,
  MOCK_SEASONS,
} from "@/lib/mock-data";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [celebrationMedals, setCelebrationMedals] = useState<AwardedMedal[]>([]);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const { stats, medals, loading: statsLoading, addStat } = useStats();
  const { tagClips, loading: tagClipsLoading, fetchTagClips } = useTagClips();

  const displayProfile = profile ?? (error ? MOCK_PROFILE : null);

  useEffect(() => {
    fetchTagClips();
  }, [fetchTagClips]);

  if (loading && !displayProfile) {
    return <ProfileSkeleton />;
  }

  if (!displayProfile) {
    return <ProfileSkeleton />;
  }

  const handleAddStat = async (statType: string, value: number, evidenceClipId?: string) => {
    const newMedals = await addStat(statType, value, evidenceClipId);
    if (newMedals.length > 0) {
      setCelebrationMedals(newMedals);
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
            stats={stats}
            medals={medals}
          />
        )}
        {activeTab === "skills" && (
          <SkillsTab tagClips={mappedTagClips} loading={tagClipsLoading} />
        )}
        {activeTab === "records" && (
          <RecordsTab
            stats={stats}
            medals={medals}
            seasons={MOCK_SEASONS}
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
