"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import SummaryTab from "@/components/player/SummaryTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";
import { SectionCard } from "@/components/ui/Card";
import QuestChecklist from "@/components/quest/QuestChecklist";

const SkillsTab = dynamic(() => import("@/components/player/SkillsTab"), { ssr: false });
const RecordsTab = dynamic(() => import("@/components/player/RecordsTab"), { ssr: false });
const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const MedalCelebration = dynamic(() => import("@/components/stats/MedalCelebration"), { ssr: false });
const AchievementList = dynamic(() => import("@/components/portfolio/AchievementList"), { ssr: false });
const GrowthTimeline = dynamic(() => import("@/components/portfolio/GrowthTimeline"), { ssr: false });
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [questOpen, setQuestOpen] = useState(false);
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
      toast.success("프로필 링크가 복사되었습니다.");
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

      {/* Action row: scout links + more menu */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {displayProfile.isVerified && displayProfile.role === "scout" && (
            <Link
              href="/profile/watchlist"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-accent hover:text-accent"
            >
              <span>⭐</span>
              관심 선수
            </Link>
          )}
          {!displayProfile.isVerified && displayProfile.role === "scout" && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-3 opacity-70"
              >
                <span>🔒</span>
                인증 후 관심 선수 저장
              </button>
              <p className="text-xs text-text-3">
                인증된 코치·스카우터만 워치리스트를 사용할 수 있어요.
              </p>
            </div>
          )}
        </div>

        {/* ⋯ More menu */}
        <div className="relative">
          <button
            onClick={() => setMoreMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-3 transition-colors hover:border-accent hover:text-accent"
            aria-label="더 보기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {moreMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-[12px] bg-elevated shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                <button
                  onClick={() => { setMoreMenuOpen(false); setPdfExportOpen(true); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-text-2 transition-colors hover:bg-card-alt hover:text-text-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  PDF 내보내기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* I13: 이번 주 조회 수 — 1 이상일 때만 표시 */}
      {(displayProfile.views ?? 0) > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          이번 주 조회 {displayProfile.views}회
        </div>
      )}

      {/* Scout: simplified profile — no player-specific tabs */}
      {displayProfile.role === "scout" ? (
        <div className="mt-5 flex flex-col gap-4">
          {(!displayProfile.bio && !displayProfile.city && !displayProfile.teamName) ? (
            <div className="card-elevated flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">👤</span>
              <p className="text-sm font-semibold text-text-1">스카우터 프로필 준비 중</p>
              <p className="text-xs text-text-3">관심 선수를 추가하고 메모를 남겨보세요</p>
              <Link
                href="/profile/watchlist"
                className="mt-1 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg"
              >
                관심 선수 보기
              </Link>
            </div>
          ) : (
            <div className="card-elevated p-4">
              <p className="text-xs font-semibold text-text-3 mb-3">스카우터 정보</p>
              <div className="space-y-2.5">
                {displayProfile.bio && (
                  <p className="text-sm text-text-2">{displayProfile.bio}</p>
                )}
                {displayProfile.city && (
                  <div className="flex items-center gap-2 text-sm text-text-2">
                    <span>📍</span><span>{displayProfile.city}</span>
                  </div>
                )}
                {displayProfile.teamName && (
                  <div className="flex items-center gap-2 text-sm text-text-2">
                    <span>🏟</span><span>{displayProfile.teamName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Link
            href="/profile/watchlist"
            className="card-elevated flex items-center justify-between p-4 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-xl">⭐</div>
              <div>
                <p className="text-sm font-semibold text-text-1">관심 선수</p>
                <p className="text-xs text-text-3">워치리스트 관리</p>
              </div>
            </div>
            <svg className="h-4 w-4 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link
            href="/discover"
            className="card-elevated flex items-center justify-between p-4 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10 text-xl">🔍</div>
              <div>
                <p className="text-sm font-semibold text-text-1">선수 탐색</p>
                <p className="text-xs text-text-3">랭킹 · 검색 · 태그</p>
              </div>
            </div>
            <svg className="h-4 w-4 text-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <button
            onClick={handleShareProfile}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-text-2 transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            프로필 공유
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}

      {/* Quest Checklist — collapsible bottom banner */}
      {displayProfile.role === "player" && (
        <div className="mt-4">
          <button
            onClick={() => setQuestOpen((v) => !v)}
            className="card-elevated flex w-full items-center justify-between px-4 py-3 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-text-2">
              <span>🎯</span>
              퀘스트
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className={`text-text-3 transition-transform ${questOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {questOpen && (
            <div className="mt-1 card-elevated overflow-hidden">
              <QuestChecklist profileId={displayProfile.id} />
            </div>
          )}
        </div>
      )}

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
