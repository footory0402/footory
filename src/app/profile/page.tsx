"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProfileCard from "@/components/player/ProfileCard";
import HighlightsTab from "@/components/player/HighlightsTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";

const InfoTab = dynamic(() => import("@/components/player/InfoTab"), { ssr: false });
const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const ProfilePdfExport = dynamic(() => import("@/components/portfolio/ProfilePdfExport"), { ssr: false });

import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { useClips, useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
type ProfileTab = "highlight" | "stat";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("highlight");
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [statInputType, setStatInputType] = useState<string | undefined>();
  const [seasonAddOpen, setSeasonAddOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const isScoutProfile = profile?.role === "scout";

  useEffect(() => {
    if (profile?.role === "parent") {
      router.replace("/");
    }
  }, [profile?.role, router]);

  const [percentiles, setPercentiles] = useState<Record<string, number>>({});

  const shouldLoadData = !!profile && !isScoutProfile;
  const { stats, medals, addStat, deleteStat, loading: statsLoading } = useStats({ enabled: shouldLoadData });
  const { tagClips, untaggedClips, loading: tagClipsLoading, fetchTagClips } = useTagClips({ enabled: shouldLoadData });
  const { deleteClip } = useClips();
  const { seasons, addSeason, loading: seasonsLoading } = useSeasons({ enabled: shouldLoadData });

  useEffect(() => {
    if (!shouldLoadData) return;
    fetch("/api/stats/percentile")
      .then((r) => (r.ok ? r.json() : { percentiles: {} }))
      .then((d) => setPercentiles(d.percentiles ?? {}))
      .catch(() => {});
  }, [shouldLoadData]);

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

  return (
    <div className="px-4 pt-4">
      {/* 프로필 카드 */}
      <ProfileCard profile={profile} onEdit={() => setEditOpen(true)} onAvatarUpload={uploadAvatar} />

      {/* 액션 행 */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {profile.isVerified && profile.role === "scout" && (
            <Link href="/profile/watchlist" className="action-btn">
              <span>⭐</span> 관심 선수
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShareProfile} className="action-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            공유
          </button>
          <button onClick={() => setPdfExportOpen(true)} className="action-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* 스카우터: 단순 뷰 */}
      {profile.role === "scout" ? (
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
      ) : (
        /* 선수: 2탭 구조 */
        <>
          {/* 탭 바 — 세그먼트 컨트롤 */}
          <div className="sticky top-[70px] z-30 -mx-4 mt-4 px-4 py-2.5 bg-bg/95 backdrop-blur-sm border-b border-white/[0.05]">
            <div className="flex rounded-xl bg-white/[0.06] p-1 gap-1">
              {(["highlight", "stat"] as const).map((tab) => {
                const label = tab === "highlight" ? "하이라이트" : "기록";
                const icon = tab === "highlight" ? "▶" : "📊";
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold transition-all ${
                      isActive
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-text-3 hover:text-text-2"
                    }`}
                  >
                    <span className="text-[13px]">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="mt-4 pb-6">
            {activeTab === "highlight" ? (
              <HighlightsTab
                tagClips={mappedTagClips}
                untaggedClips={untaggedClips}
                tagClipsLoading={tagClipsLoading}
                position={profile.position}
                onDeleteClip={handleDeleteClip}
                onEditTags={handleEditTags}
              />
            ) : (
              <InfoTab
                stats={stats}
                seasons={seasons}
                profile={profile}
                percentiles={percentiles}
                onAddStat={() => { setStatInputType(undefined); setStatInputOpen(true); }}
                onUpdateStat={(type) => { setStatInputType(type); setStatInputOpen(true); }}
                onDeleteStat={handleDeleteStat}
                onAddSeason={() => setSeasonAddOpen(true)}
              />
            )}
          </div>
        </>
      )}

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
          medals={medals}
          seasons={seasons}
          achievements={[]}
        />
      )}

      {/* 성장 기록 삭제 확인 다이얼로그 */}
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
    </div>
  );
}
