"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProfileCard from "@/components/player/ProfileCard";
import HighlightsTab from "@/components/player/HighlightsTab";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";


const StatsCollapsible = dynamic(() => import("@/components/player/StatsTab"), { ssr: false });
const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const MedalCelebration = dynamic(() => import("@/components/stats/MedalCelebration"), { ssr: false });
const ProfilePdfExport = dynamic(() => import("@/components/portfolio/ProfilePdfExport"), { ssr: false });

import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { useClips, useTagClips } from "@/hooks/useClips";
import { useSeasons } from "@/hooks/useSeasons";
import type { AwardedMedal } from "@/lib/medals";

export default function ProfilePage() {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [seasonAddOpen, setSeasonAddOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [celebrationMedals, setCelebrationMedals] = useState<AwardedMedal[]>([]);
  const { profile, loading, error, updateProfile, uploadAvatar, checkHandle } = useProfile();
  const isScoutProfile = profile?.role === "scout";

  // 부모 역할은 홈 대시보드 사용
  useEffect(() => {
    if (profile?.role === "parent") {
      router.replace("/");
    }
  }, [profile?.role, router]);

  // 원페이지이므로 모든 데이터를 바로 로드
  const shouldLoadData = !!profile && !isScoutProfile;
  const { stats, medals, addStat, loading: statsLoading } = useStats({ enabled: shouldLoadData });
  const { tagClips, untaggedClips, loading: tagClipsLoading, fetchTagClips } = useTagClips({ enabled: shouldLoadData });
  const { deleteClip } = useClips();
  const { seasons, addSeason, loading: seasonsLoading } = useSeasons({ enabled: shouldLoadData });

  const displayProfile = profile;

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

  const handleDeleteClip = async (clipId: string) => {
    const ok = await deleteClip(clipId);
    if (ok) {
      toast.success("영상이 삭제되었습니다.");
      await fetchTagClips();
    }
    return ok;
  };

  const handleAddStat = async (statType: string, value: number, evidenceClipId?: string) => {
    const newMedals = await addStat(statType, value, evidenceClipId);
    if (newMedals.length > 0) {
      setCelebrationMedals(newMedals);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/p/${displayProfile.handle}`;
    const title = `${displayProfile.name} (@${displayProfile.handle}) — Footory`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${displayProfile.name} 선수 프로필을 확인해보세요`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("프로필 링크가 복사되었습니다.");
    } catch {
      // User cancelled
    }
  };

  // Map tagClips — pass videoUrl + thumbnailUrl for playback & thumbnails
  const mappedTagClips: Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]> = {};
  for (const [key, clips] of Object.entries(tagClips)) {
    mappedTagClips[key] = clips.map((c) => ({ id: c.id, duration: c.duration, tag: c.tag, isTop: c.isTop, videoUrl: c.videoUrl, thumbnailUrl: c.thumbnailUrl }));
  }

  return (
    <div className="px-4 pb-24 pt-4">
      {/* 1. Profile Card */}
      <ProfileCard profile={displayProfile} onEdit={() => setEditOpen(true)} onAvatarUpload={uploadAvatar} />

      {/* Action row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {displayProfile.isVerified && displayProfile.role === "scout" && (
            <Link
              href="/profile/watchlist"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-accent hover:text-accent"
            >
              <span>⭐</span> 관심 선수
            </Link>
          )}
        </div>
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
                  onClick={() => { setMoreMenuOpen(false); handleShareProfile(); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-text-2 transition-colors hover:bg-card-alt hover:text-text-1"
                >
                  프로필 공유
                </button>
                <button
                  onClick={() => { setMoreMenuOpen(false); setPdfExportOpen(true); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-text-2 transition-colors hover:bg-card-alt hover:text-text-1"
                >
                  PDF 내보내기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Views */}
      {(displayProfile.views ?? 0) > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          이번 주 조회 {displayProfile.views}회
        </div>
      )}



      {/* Scout: simplified view */}
      {displayProfile.role === "scout" ? (
        <div className="mt-5 flex flex-col gap-4">
          {(!displayProfile.bio && !displayProfile.city && !displayProfile.teamName) ? (
            <div className="card-elevated flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">👤</span>
              <p className="text-sm font-semibold text-text-1">스카우터 프로필 준비 중</p>
              <p className="text-xs text-text-3">관심 선수를 추가하고 메모를 남겨보세요</p>
            </div>
          ) : (
            <div className="card-elevated p-4">
              <p className="text-xs font-semibold text-text-3 mb-3">스카우터 정보</p>
              <div className="space-y-2.5">
                {displayProfile.bio && <p className="text-sm text-text-2">{displayProfile.bio}</p>}
                {displayProfile.city && (
                  <div className="flex items-center gap-2 text-sm text-text-2"><span>📍</span><span>{displayProfile.city}</span></div>
                )}
                {displayProfile.teamName && (
                  <div className="flex items-center gap-2 text-sm text-text-2"><span>🏟</span><span>{displayProfile.teamName}</span></div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Player: Single-page scroll */
        <div className="mt-5 flex flex-col gap-5">

          {/* 2. Featured Highlights + Skill Videos */}
          <HighlightsTab
            level={displayProfile.level}
            tagClips={mappedTagClips}
            untaggedClips={untaggedClips}
            tagClipsLoading={tagClipsLoading}
            position={displayProfile.position}
            onDeleteClip={handleDeleteClip}
          />

          {/* 3. Physical Records (collapsible) */}
          <StatsCollapsible
            stats={stats}
            medals={medals}
            onAddStat={() => setStatInputOpen(true)}
          />

          {/* 4. Team Info */}
          <div className="rounded-xl border border-white/[0.06] bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚽</span>
                <span className="text-[13px] font-semibold text-text-1">소속 팀</span>
              </div>
              <button
                onClick={() => setSeasonAddOpen(true)}
                className="text-[11px] font-medium text-accent"
              >
                + 추가
              </button>
            </div>

            {displayProfile.teamName ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-lg">🏟</div>
                <div>
                  <p className="text-[13px] font-semibold text-text-1">{displayProfile.teamName}</p>
                  {displayProfile.city && <p className="text-[11px] text-text-3">{displayProfile.city}</p>}
                </div>
                {displayProfile.teamId && (
                  <Link href={`/team/${displayProfile.teamId}`} className="ml-auto text-[11px] text-accent">
                    상세 →
                  </Link>
                )}
              </div>
            ) : (
              <p className="py-2 text-center text-[12px] text-text-3">
                아직 소속 팀이 없어요
              </p>
            )}

            {/* Previous teams from seasons */}
            {seasons.filter((s) => !s.isCurrent).length > 0 && (
              <div className="mt-3 border-t border-white/[0.04] pt-3">
                <p className="mb-2 text-[11px] text-text-3">이전 소속</p>
                <div className="flex flex-col gap-1.5">
                  {seasons.filter((s) => !s.isCurrent).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-[12px] text-text-2">
                      <span className="text-text-3">•</span>
                      <span>{s.teamName}</span>
                      <span className="text-text-3">({s.year})</span>
                      {s.gamesPlayed != null && (
                        <span className="ml-auto text-[11px] text-text-3">
                          {s.gamesPlayed}경기{s.goals ? ` ${s.goals}골` : ""}{s.assists ? ` ${s.assists}어시` : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sheets */}
      {editOpen && (
        <ProfileEditSheet
          profile={displayProfile}
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
          onClose={() => setStatInputOpen(false)}
          onSave={handleAddStat}
        />
      )}

      {seasonAddOpen && (
        <SeasonAddSheet
          open={seasonAddOpen}
          onClose={() => setSeasonAddOpen(false)}
          onSave={addSeason}
        />
      )}

      {celebrationMedals.length > 0 && (
        <MedalCelebration
          medals={celebrationMedals}
          onClose={() => setCelebrationMedals([])}
        />
      )}

      {pdfExportOpen && (
        <ProfilePdfExport
          open={pdfExportOpen}
          onClose={() => setPdfExportOpen(false)}
          loading={statsLoading || seasonsLoading}
          profile={displayProfile}
          stats={stats}
          medals={medals}
          seasons={seasons}
          achievements={[]}
        />
      )}
    </div>
  );
}
