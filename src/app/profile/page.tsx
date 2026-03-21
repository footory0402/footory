"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import HeroSection from "@/components/profile/HeroSection";
import ProfileTabBar, { type ProfileTabKey } from "@/components/profile/ProfileTabBar";
import HighlightsTabV5 from "@/components/profile/HighlightsTabV5";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";

const RecordsTabV5 = dynamic(() => import("@/components/profile/RecordsTabV5"), { ssr: false });
const CareerTabV5 = dynamic(() => import("@/components/profile/CareerTabV5"), { ssr: false });
const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const ProfilePdfExport = dynamic(() => import("@/components/portfolio/ProfilePdfExport"), { ssr: false });
const PlayStyleTest = dynamic(() => import("@/components/player/PlayStyleTest"), { ssr: false });

import { useProfile } from "@/hooks/useProfile";
import { usePlayStyle } from "@/hooks/usePlayStyle";
import { toast } from "sonner";
import { useStats } from "@/hooks/useStats";
import { useClips, useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
import { useAchievements } from "@/hooks/useAchievements";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("highlights");
  const [teamTransferring, setTeamTransferring] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [statInputType, setStatInputType] = useState<string | undefined>();
  const [seasonAddOpen, setSeasonAddOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);
  const [playStyleTestOpen, setPlayStyleTestOpen] = useState(false);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const isScoutProfile = profile?.role === "scout";
  const { playStyle, savePlayStyle } = usePlayStyle(profile?.id);

  useEffect(() => {
    if (profile?.role === "parent") {
      router.replace("/");
    }
  }, [profile?.role, router]);

  const shouldLoadData = !!profile && !isScoutProfile;
  const { stats, addStat, deleteStat, loading: statsLoading } = useStats({ enabled: shouldLoadData });
  const { tagClips, untaggedClips, loading: tagClipsLoading, fetchTagClips } = useTagClips({ enabled: shouldLoadData });
  const { deleteClip } = useClips();
  const { seasons, addSeason, loading: seasonsLoading } = useSeasons({ enabled: shouldLoadData });
  const { achievements } = useAchievements({ enabled: shouldLoadData });

  if (loading && !profile) return <ProfileSkeleton />;

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <span className="text-3xl">😢</span>
        <p className="text-[14px] font-medium text-text-1">프로필을 불러올 수 없습니다</p>
        <p className="text-[12px] text-text-3">네트워크를 확인하고 다시 시도해주세요</p>
        <button
          onClick={() => router.refresh()}
          className="mt-2 rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-bg"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // ── Handlers ──

  const handleDeleteClip = async (clipId: string) => {
    const ok = await deleteClip(clipId);
    if (ok) {
      toast.success("영상이 삭제되었습니다.");
      await fetchTagClips();
    }
    return ok;
  };

  const handleEditTags = async (clipId: string, tags: string[]) => {
    try {
      const res = await fetch(`/api/clips/${clipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) return false;
      toast.success("태그가 수정되었습니다.");
      await fetchTagClips();
      return true;
    } catch {
      toast.error("태그 수정에 실패했습니다.");
      return false;
    }
  };

  const handleAddStat = async (statType: string, value: number, evidenceClipId?: string) => {
    const result = await addStat(statType, value, evidenceClipId);
    if (result.warning) {
      toast.warning(result.warning, { duration: 5000 });
    }
    toast.success("기록이 저장되었습니다.");
  };

  const handleDeleteStat = (statId: string) => {
    setDeletingStatId(statId);
  };

  const confirmDeleteStat = async () => {
    if (!deletingStatId) return;
    const id = deletingStatId;
    setDeletingStatId(null);
    try {
      await deleteStat(id);
      toast.success("기록이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/p/${profile.handle}`;
    const title = `${profile.name} (@${profile.handle}) — Footory`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${profile.name} 선수 프로필을 확인해보세요`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("프로필 링크가 복사되었습니다.");
    } catch {
      // cancelled
    }
  };

  const mappedTagClips: Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]> = {};
  for (const [key, clips] of Object.entries(tagClips)) {
    mappedTagClips[key] = clips.map((c) => ({
      id: c.id, duration: c.duration, tag: c.tag, isTop: c.isTop, videoUrl: c.videoUrl, thumbnailUrl: c.thumbnailUrl,
    }));
  }

  // ── Team state logic ──
  const teamState = teamTransferring
    ? "transferring" as const
    : profile.teamName
      ? "has-team" as const
      : "no-team" as const;

  // ── Scout view (unchanged) ──
  if (isScoutProfile) {
    return (
      <div className="px-4 pt-4">
        <HeroSection
          profile={profile}
          playStyle={playStyle}
          teamState={teamState}
          onEdit={() => setEditOpen(true)}
          onShare={handleShareProfile}
          onPdf={() => setPdfExportOpen(true)}
          onAvatarUpload={uploadAvatar}
        />
        <div className="mt-5 flex flex-col gap-4">
          {(!profile.bio && !profile.city && !profile.teamName) ? (
            <div className="card-elevated flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">👤</span>
              <p className="text-sm font-semibold text-text-1">프로필을 완성해보세요</p>
              <p className="text-xs text-text-3 leading-relaxed">
                자기소개와 소속 기관을 추가하면<br />선수들에게 신뢰감을 줄 수 있어요
              </p>
              <button
                onClick={() => setEditOpen(true)}
                className="mt-1 rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg"
              >
                프로필 편집
              </button>
            </div>
          ) : (
            <div className="card-elevated p-4">
              <p className="text-xs font-semibold text-text-3 mb-3">스카우터 정보</p>
              <div className="space-y-2.5">
                {profile.bio && <p className="text-sm text-text-2">{profile.bio}</p>}
                {profile.city && <div className="flex items-center gap-2 text-sm text-text-2"><span>📍</span><span>{profile.city}</span></div>}
                {profile.teamName && <div className="flex items-center gap-2 text-sm text-text-2"><span>🏟</span><span>{profile.teamName}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Sheets */}
        {editOpen && (
          <ProfileEditSheet
            profile={profile}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSave={updateProfile}
            onAvatarUpload={uploadAvatar}
            onCheckHandle={checkHandle}
          />
        )}
        {pdfExportOpen && (
          <ProfilePdfExport
            open={pdfExportOpen}
            onClose={() => setPdfExportOpen(false)}
            loading={false}
            profile={profile}
            stats={[]}
            seasons={[]}
            achievements={[]}
          />
        )}
      </div>
    );
  }

  // ── Player view — v5 redesign ──
  return (
    <div style={{ background: "var(--v5-dark)" }}>
      {/* Hero */}
      <HeroSection
        profile={profile}
        playStyle={playStyle}
        teamState={teamState}
        onEdit={() => setEditOpen(true)}
        onShare={handleShareProfile}
        onPdf={() => setPdfExportOpen(true)}
        onAvatarUpload={uploadAvatar}
        onTeamChange={() => setTeamTransferring(true)}
      />

      {/* Tab bar (sticky) */}
      <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="px-4 pb-6">
        {activeTab === "highlights" && (
          <HighlightsTabV5
            tagClips={mappedTagClips}
            untaggedClips={untaggedClips}
            tagClipsLoading={tagClipsLoading}
            position={profile.position}
            onDeleteClip={handleDeleteClip}
            onEditTags={handleEditTags}
          />
        )}
        {activeTab === "records" && (
          <RecordsTabV5
            stats={stats}
            playStyle={playStyle}
            onAddStat={() => { setStatInputType(undefined); setStatInputOpen(true); }}
            onUpdateStat={(type) => { setStatInputType(type); setStatInputOpen(true); }}
            onDeleteStat={handleDeleteStat}
            onPlayStyleTest={() => setPlayStyleTestOpen(true)}
          />
        )}
        {activeTab === "career" && (
          <CareerTabV5
            profile={profile}
            seasons={seasons}
            achievements={achievements}
            onAddSeason={() => setSeasonAddOpen(true)}
          />
        )}
      </div>

      {/* Sheets */}
      {editOpen && (
        <ProfileEditSheet
          profile={profile}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={updateProfile}
          onAvatarUpload={uploadAvatar}
          onCheckHandle={checkHandle}
        />
      )}
      {statInputOpen && (
        <StatInputSheet
          open={statInputOpen}
          onClose={() => { setStatInputOpen(false); setStatInputType(undefined); }}
          onSave={handleAddStat}
          initialStatType={statInputType}
        />
      )}
      {seasonAddOpen && (
        <SeasonAddSheet
          open={seasonAddOpen}
          onClose={() => setSeasonAddOpen(false)}
          onSave={addSeason}
        />
      )}
      {pdfExportOpen && (
        <ProfilePdfExport
          open={pdfExportOpen}
          onClose={() => setPdfExportOpen(false)}
          loading={statsLoading || seasonsLoading}
          profile={profile}
          stats={stats}
          seasons={seasons}
          achievements={[]}
        />
      )}

      {/* Delete stat dialog */}
      {deletingStatId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setDeletingStatId(null)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-[430px] rounded-t-2xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 text-[15px] font-semibold text-text-1">성장 기록 삭제</div>
            <p className="mb-5 text-[13px] text-text-3 leading-relaxed">
              이 기록을 삭제하면 복구할 수 없어요.<br />정말 삭제할까요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingStatId(null)}
                className="flex-1 rounded-xl border border-white/[0.08] py-3 text-[13px] font-semibold text-text-2 active:bg-white/[0.04]"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteStat}
                className="flex-1 rounded-xl bg-red-500/90 py-3 text-[13px] font-semibold text-white active:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PlayStyle test fullscreen */}
      {playStyleTestOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setPlayStyleTestOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-text-2"
              aria-label="닫기"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-10">
            <PlayStyleTest
              onComplete={async (result) => {
                try {
                  await savePlayStyle(result);
                  toast.success("플레이 스타일이 저장되었습니다!");
                } catch {
                  toast.error("저장에 실패했습니다.");
                }
                setPlayStyleTestOpen(false);
              }}
              onSkip={() => setPlayStyleTestOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
