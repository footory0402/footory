"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProfileCard from "@/components/player/ProfileCard";
import TeamBanner from "@/components/player/TeamBanner";
import HighlightsTab from "@/components/player/HighlightsTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";

const InfoTab = dynamic(() => import("@/components/player/InfoTab"), { ssr: false });
const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const ProfilePdfExport = dynamic(() => import("@/components/portfolio/ProfilePdfExport"), { ssr: false });
const PlayStyleTest = dynamic(() => import("@/components/player/PlayStyleTest"), { ssr: false });

import SocialCard from "@/components/player/SocialCard";
import { useProfile } from "@/hooks/useProfile";
import { usePlayStyle } from "@/hooks/usePlayStyle";
import { toast } from "sonner";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { useClips, useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
import { useAchievements } from "@/hooks/useAchievements";
import { calcRadarStats, type ClipTagCount } from "@/lib/radar-calc";
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
  const [playStyleTestOpen, setPlayStyleTestOpen] = useState(false);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const isScoutProfile = profile?.role === "scout";
  const { playStyle, savePlayStyle } = usePlayStyle(profile?.id);

  useEffect(() => {
    if (profile?.role === "parent") {
      router.replace("/");
    }
  }, [profile?.role, router]);

  const [percentiles, setPercentiles] = useState<Record<string, number>>({});
  const [ageAvgs, setAgeAvgs] = useState<Record<string, number>>({});
  const [peerCounts, setPeerCounts] = useState<Record<string, number>>({});
  const [ageGroup, setAgeGroup] = useState<string>("");

  const shouldLoadData = !!profile && !isScoutProfile;
  const { stats, addStat, deleteStat, loading: statsLoading } = useStats({ enabled: shouldLoadData });
  const { tagClips, untaggedClips, loading: tagClipsLoading, fetchTagClips } = useTagClips({ enabled: shouldLoadData });
  const { deleteClip } = useClips();
  const { seasons, addSeason, loading: seasonsLoading } = useSeasons({ enabled: shouldLoadData });
  const { achievements, addAchievement, removeAchievement } = useAchievements({ enabled: shouldLoadData });

  useEffect(() => {
    if (!shouldLoadData) return;
    fetch("/api/stats/percentile")
      .then((r) => (r.ok ? r.json() : { percentiles: {}, ageAvgs: {}, peerCounts: {}, ageGroup: "" }))
      .then((d) => {
        setPercentiles(d.percentiles ?? {});
        setAgeAvgs(d.ageAvgs ?? {});
        setPeerCounts(d.peerCounts ?? {});
        setAgeGroup(d.ageGroup ?? "");
      })
      .catch(() => {});
  }, [shouldLoadData]);

  const clipTagCounts: ClipTagCount[] = useMemo(() => {
    return Object.entries(tagClips)
      .map(([, clips]) => {
        const tagName = clips[0]?.tag ?? "";
        return { tagName, count: clips.length };
      })
      .filter((tag) => tag.tagName);
  }, [tagClips]);

  const radarStats = useMemo(() => {
    return calcRadarStats(stats, clipTagCounts, percentiles);
  }, [stats, clipTagCounts, percentiles]);

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
      <ProfileCard
        profile={profile}
        radarStats={radarStats}
        stats={stats}
        onEdit={() => setEditOpen(true)}
        onAvatarUpload={uploadAvatar}
        onAddStat={() => { setStatInputType(undefined); setStatInputOpen(true); }}
      />

      {/* 소셜 지표 카드 */}
      <SocialCard
        followers={profile.followers}
        following={profile.following}
        views={profile.views}
        followsHref="/profile/follows"
        className="mt-2.5"
      />

      {/* 소속 팀 배너 */}
      {!isScoutProfile && (
        <TeamBanner
          profile={profile}
          seasons={seasons}
          onAddSeason={() => setSeasonAddOpen(true)}
        />
      )}

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
          <button onClick={handleShareProfile} className="action-btn" aria-label="프로필 링크 공유">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            공유
          </button>
          <button onClick={() => setPdfExportOpen(true)} className="action-btn" aria-label="PDF 내보내기">
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
          <div className="-mx-4 mt-4 px-4 py-2.5 border-b border-white/[0.05]">
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
                percentiles={percentiles}
                ageAvgs={ageAvgs}
                peerCounts={peerCounts}
                ageGroup={ageGroup}
                radarStats={radarStats}
                clipTagCounts={clipTagCounts}
                playStyle={playStyle}
                onAddStat={() => { setStatInputType(undefined); setStatInputOpen(true); }}
                onUpdateStat={(type) => { setStatInputType(type); setStatInputOpen(true); }}
                onDeleteStat={handleDeleteStat}
                onPlayStyleTest={() => setPlayStyleTestOpen(true)}
                achievements={achievements}
                onAddAchievement={addAchievement}
                onRemoveAchievement={removeAchievement}
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

      {/* 플레이 스타일 테스트 풀스크린 */}
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
