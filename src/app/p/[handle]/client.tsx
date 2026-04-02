"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "@/components/profile/HeroSection";
import ProfileTabBar, { type ProfileTabKey } from "@/components/profile/ProfileTabBar";
import HighlightsTabV5 from "@/components/profile/HighlightsTabV5";
import RecordsTabV5 from "@/components/profile/RecordsTabV5";
import CareerTabV5, { type TournamentRecord, type AwardRecord } from "@/components/profile/CareerTabV5";
import FollowButton from "@/components/social/FollowButton";
import dynamic from "next/dynamic";
import { getOrCreateConversation, canSendDm } from "@/lib/dm";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

const AddToWatchlistButton = dynamic(
  () => import("@/components/scout/AddToWatchlistButton"),
  { ssr: false }
);

const ProfileEditSheet = dynamic(() => import("@/components/player/ProfileEditSheet"), { ssr: false });
const StatInputSheet = dynamic(() => import("@/components/stats/StatInputSheet"), { ssr: false });
const SeasonAddSheet = dynamic(() => import("@/components/player/SeasonAddSheet"), { ssr: false });
const TournamentAddSheet = dynamic(() => import("@/components/profile/TournamentAddSheet"), { ssr: false });
const AwardAddSheet = dynamic(() => import("@/components/profile/AwardAddSheet"), { ssr: false });
const PlayStyleTest = dynamic(() => import("@/components/player/PlayStyleTest"), { ssr: false });

const ClipPlayerSheet = dynamic(
  () => import("@/components/player/ClipPlayerSheet"),
  { ssr: false }
);
import type { PlayableClip } from "@/components/player/ClipPlayerSheet";

const ShareSheet = dynamic(() => import("@/components/social/ShareSheet"), { ssr: false });
const CompareSheet = dynamic(() => import("@/components/player/CompareSheet"), { ssr: false });
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SignupCTA from "@/components/profile/SignupCTA";
import { APP_URL, POSITION_LABELS, MEASUREMENTS, getStatMeta, type PlayStyleType } from "@/lib/constants";
import { calcRadarStats } from "@/lib/radar-calc";
import type { Profile, Stat, Season, Achievement, PlayStyle } from "@/lib/types";
import type { DmActionState, UserRole } from "@/lib/permissions";

interface FeaturedClip {
  id: string;
  clip_id: string;
  sort_order: number;
  clips?: {
    video_url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    effects?: Record<string, boolean> | null;
    spotlight_x?: number | null;
    spotlight_y?: number | null;
    freeze_at?: number | null;
    trim_start?: number | null;
    trim_end?: number | null;
  } | null;
}

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
  effects?: Record<string, boolean> | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  freezeAt?: number | null;
  trimStart?: number | null;
  trimEnd?: number | null;
}

interface PublicProfileData {
  [key: string]: unknown;
  id: string;
  handle: string;
  name: string;
  position: string | null;
  sub_position?: string | null;
  birth_year: number | null;
  city: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  followers_count: number;
  following_count: number;
  views_count: number;
  contact?: { phone?: string; email?: string } | null;
  contact_public?: boolean;
  role: string;
  created_at: string;
  teamName?: string | null;
  teamId?: string | null;
  featured: FeaturedClip[];
  stats: Record<string, unknown>[];
  seasons: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  timelineEvents: Record<string, unknown>[];
  tagClips: Record<string, TagClip[]>;
  untaggedClips?: TagClip[];
  playStyle?: Record<string, unknown> | null;
  tournamentRecords?: Record<string, unknown>[];
  awards?: Record<string, unknown>[];
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  viewerAccess?: {
    role: UserRole | null;
    verified: boolean;
    canFollow: boolean;
    watchlist: {
      visible: boolean;
      enabled: boolean;
      label: string;
      message: string;
    };
    dm: {
      state: DmActionState;
      label: string;
      message?: string;
    };
  };
}

// Map DB row to Profile type for ProfileCard
function toProfile(data: PublicProfileData): Profile {
  return {
    id: data.id,
    handle: data.handle,
    name: data.name,
    position: (data.position ?? "FW") as Profile["position"],
    subPosition: data.sub_position ?? undefined,
    birthYear: data.birth_year ?? 2010,
    city: data.city ?? "",
    avatarUrl: data.avatar_url ?? undefined,
    bio: data.bio ?? undefined,
    followers: data.followers_count ?? 0,
    following: data.following_count ?? 0,
    views: data.views_count ?? 0,
    contact: (data.contact as Profile["contact"]) ?? undefined,
    contactPublic: !!data.contact_public,
    role: (data.role ?? "player") as Profile["role"],
    isVerified: !!(data.is_verified as boolean),
    teamName: (data.teamName as string) ?? undefined,
    teamId: (data.teamId as string) ?? undefined,
    heightCm: (data.height_cm as number) ?? null,
    weightKg: (data.weight_kg as number) ?? null,
    preferredFoot: (data.preferred_foot as string) ?? null,
    mvpCount: (data.mvp_count as number) ?? 0,
    mvpTier: (data.mvp_tier as Profile["mvpTier"]) ?? null,
    createdAt: data.created_at,
  };
}

function mapAchievements(rows: Record<string, unknown>[]): Achievement[] {
  return rows.map((r) => ({
    id: r.id as string,
    profileId: r.profile_id as string,
    title: r.title as string,
    competition: (r.competition as string) ?? undefined,
    year: (r.year as number) ?? undefined,
    evidenceUrl: (r.evidence_url as string) ?? undefined,
    createdAt: r.created_at as string,
  }));
}

function statMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Compute aggregated stats: deduplicate by type, compute PR/first/best/measureCount
function computeAggregatedStats(rows: Record<string, unknown>[]): Stat[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort(
    (a, b) => new Date(b.recorded_at as string).getTime() - new Date(a.recorded_at as string).getTime()
  );
  const byType = new Map<string, Record<string, unknown>[]>();
  for (const row of sorted) {
    const type = row.stat_type as string;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(row);
  }
  const VALID_IDS = new Set<string>(MEASUREMENTS.map((m) => m.id));
  const result: Stat[] = [];

  for (const [type, records] of byType.entries()) {
    if (!VALID_IDS.has(type)) continue;
    const latest = records[0];
    const m = MEASUREMENTS.find((x) => x.id === type);
    const lowerIsBetter = m?.lowerIsBetter ?? false;

    const allValues = records.map((r) => r.value as number);
    const bestValue = lowerIsBetter ? Math.min(...allValues) : Math.max(...allValues);
    const recent3 = records.slice(0, 3).map((r) => r.value as number);
    const representativeValue = recent3.length >= 3 ? statMedian(recent3) : (latest.value as number);
    const previous = records.length > 1 ? records[1] : null;
    const oldest = records[records.length - 1];

    result.push({
      id: latest.id as string,
      playerId: latest.profile_id as string,
      type,
      value: representativeValue,
      previousValue: previous ? (previous.value as number) : undefined,
      unit: latest.unit as string,
      measuredAt: latest.recorded_at as string,
      evidenceClipId: (latest.evidence_clip_id as string) ?? undefined,
      verified: (latest.verified as boolean) ?? false,
      bestValue,
      isPR: (latest.value as number) === bestValue && records.length > 1,
      firstValue: oldest.value as number,
      firstMeasuredAt: oldest.recorded_at as string,
      measureCount: records.length,
    });
  }

  return result;
}

// Map DB season rows (DB has year, team_name, league, highlight_clip_id only)
function mapSeasons(rows: Record<string, unknown>[]): Season[] {
  return rows.map((r) => ({
    id: r.id as string,
    playerId: r.profile_id as string,
    year: r.year as number,
    teamName: r.team_name as string,
    position: (r.position as Season["position"]) ?? "FW",
    isCurrent: !!(r.is_current),
  }));
}


export default function PublicProfileClient({ profile: data }: { profile: PublicProfileData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(
    () => data.viewerAccess?.role === "scout" ? "records" : "highlights"
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  // 내 프로필 편집 상태
  const [editOpen, setEditOpen] = useState(false);
  const [statInputOpen, setStatInputOpen] = useState(false);
  const [statInputType, setStatInputType] = useState<string | undefined>();
  const [statInputId, setStatInputId] = useState<string | undefined>();
  const [seasonAddOpen, setSeasonAddOpen] = useState(false);
  const [tournamentAddOpen, setTournamentAddOpen] = useState(false);
  const [awardAddOpen, setAwardAddOpen] = useState(false);
  const [playStyleTestOpen, setPlayStyleTestOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentRecord | null>(null);
  const [editingAward, setEditingAward] = useState<AwardRecord | null>(null);

  // 또래 비교 (percentile) 데이터
  const [percentileData, setPercentileData] = useState<{
    percentiles: Record<string, number>;
    ageAvgs: Record<string, number>;
    peerCounts: Record<string, number>;
    ageGroup: string;
  } | null>(null);
  const [percentileLoading, setPercentileLoading] = useState(false);

  // 내 프로필일 때만 사용 (훅은 항상 호출)
  const { profile: ownProfile, updateProfile, uploadAvatar, checkHandle } = useProfile({
    enabled: !!data.isOwnProfile,
  });

  const profile = toProfile(data);
  const stats = useMemo(() => computeAggregatedStats(data.stats), [data.stats]);
  const seasons = mapSeasons(data.seasons);
  const achievements = mapAchievements(data.achievements ?? []);
  const tagClips = data.tagClips ?? {};

  // 스탯 탭 활성화 시 또래 비교 데이터 로드
  useEffect(() => {
    if (activeTab !== "records" || percentileData || percentileLoading) return;
    setPercentileLoading(true);
    fetch(`/api/stats/percentile?profileId=${data.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setPercentileData(d); })
      .finally(() => setPercentileLoading(false));
  }, [activeTab, data.id, percentileData, percentileLoading]);

  // Map tournament records and awards from SSR data
  const tournaments = useMemo(() => {
    return (data.tournamentRecords ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      type: r.type as "공식대회" | "리그" | "친선",
      dateText: (r.date_text as string) ?? null,
      result: (r.result as string) ?? null,
      goals: (r.goals as number) ?? 0,
      assists: (r.assists as number) ?? 0,
      isMvp: !!(r.is_mvp),
      source: (r.source as "team" | "self") ?? "self",
      verifier: (r.verifier as string) ?? null,
    }));
  }, [data.tournamentRecords]);

  const mappedAwards = useMemo(() => {
    return (data.awards ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      detail: (r.detail as string) ?? null,
      source: (r.source as "team" | "self") ?? "self",
      verifier: (r.verifier as string) ?? null,
    }));
  }, [data.awards]);

  // Map play style from SSR data to PlayStyle type
  const mappedPlayStyle: PlayStyle | null = useMemo(() => {
    if (!data.playStyle) return null;
    return {
      id: data.playStyle.id as string,
      profileId: data.playStyle.profile_id as string,
      styleType: data.playStyle.style_type as PlayStyleType,
      traitBreakthrough: data.playStyle.trait_breakthrough as number,
      traitCreativity: data.playStyle.trait_creativity as number,
      traitFinishing: data.playStyle.trait_finishing as number,
      traitTenacity: data.playStyle.trait_tenacity as number,
      createdAt: data.playStyle.created_at as string,
      updatedAt: data.playStyle.updated_at as string,
    };
  }, [data.playStyle]);

  // Radar stats for CompareSheet
  const targetRadarStats = useMemo(() => {
    return calcRadarStats(stats, []);
  }, [stats]);

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `${APP_URL}/p/${profile.handle}`;
  const viewerAccess = data.viewerAccess;
  const showWatchlistAction =
    !!viewerAccess?.watchlist.visible && profile.role === "player";
  const helperTexts = [
    viewerAccess?.dm.state === "blocked" ? viewerAccess.dm.message : "",
    showWatchlistAction && !viewerAccess?.watchlist.enabled
      ? viewerAccess?.watchlist.message
      : "",
  ].filter(Boolean);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  return (
    <ErrorBoundary>
    <div className="mx-auto max-w-[430px] pb-24">
      {/* 뒤로가기 헤더 — 타인 프로필만 */}
      {!data.isOwnProfile && (
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 glass-nav">
          <button
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-text-2 active:bg-white/[0.15]"
            aria-label="뒤로가기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="flex-1 truncate text-[14px] font-semibold text-text-1">{profile.name}</span>
          <button
            onClick={() => setShareOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-text-2 active:bg-white/[0.15]"
            aria-label="공유"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      )}

      {/* Profile hero */}
      <HeroSection
        profile={profile}
        playStyle={mappedPlayStyle}
        teamState={profile.teamName ? "has-team" : "no-team"}
        {...(data.isOwnProfile ? {
          onEdit: () => setEditOpen(true),
          onShare: async () => {
            const url = `${window.location.origin}/p/${profile.handle}`;
            try {
              if (navigator.share) {
                await navigator.share({ title: `${profile.name} — Footory`, url });
                return;
              }
              await navigator.clipboard.writeText(url);
              toast.success("프로필 링크가 복사되었습니다.");
            } catch { /* cancelled */ }
          },
        } : {})}
      />

      {/* 액션 버튼 — 프로필 카드 바로 아래 */}
      {!data.isOwnProfile && (
        <div className="px-4 mt-3 flex gap-2">
          {viewerAccess?.canFollow && (
            <FollowButton targetId={profile.id} initialFollowing={!!data.isFollowing} size="md" />
          )}
          {/* 나와 비교 버튼 */}
          {viewerAccess?.role === "player" && profile.role === "player" && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-accent/30 py-2.5 text-[13px] font-semibold text-accent transition-colors active:bg-accent/[0.08]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
              나와 비교
            </button>
          )}
          {showWatchlistAction && viewerAccess?.watchlist.enabled && (
            <AddToWatchlistButton playerId={profile.id} />
          )}
          {showWatchlistAction && !viewerAccess?.watchlist.enabled && (
            <button
              type="button"
              disabled
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-[13px] font-semibold text-text-3 opacity-70"
            >
              <span>☆</span>
              <span>{viewerAccess?.watchlist.label}</span>
            </button>
          )}
          {viewerAccess?.dm.state !== "hidden" && (
            <button
              onClick={async () => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                if (viewerAccess?.dm.state === "blocked") {
                  toast.error(viewerAccess.dm.message || "이 사용자에게 메시지를 보낼 수 없습니다.");
                  return;
                }

                const perm = await canSendDm(user.id, profile.id);
                if (perm === "blocked") {
                  toast.error("차단된 사용자와는 대화할 수 없어요.");
                  return;
                }

                const convId = await getOrCreateConversation(user.id, profile.id);
                router.push(`/dm/${convId}`);
              }}
              disabled={viewerAccess?.dm.state === "blocked"}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-[13px] font-semibold text-text-2 transition-colors active:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {viewerAccess?.dm.label ?? "메시지"}
            </button>
          )}
        </div>
      )}
      {helperTexts.length > 0 && (
        <div className="px-4 mt-2 flex flex-col gap-1 text-[12px] text-text-3">
          {helperTexts.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}

      {/* Contact info */}
      {data.contact && (
        <div className="px-4 mt-3 flex flex-wrap gap-2 text-[12px]">
          {data.contact.email && (
            <a href={`mailto:${data.contact.email}`} className="rounded-full bg-surface px-3 py-1 text-text-2 hover:text-accent">
              {data.contact.email}
            </a>
          )}
          {data.contact.phone && (
            <a href={`tel:${data.contact.phone}`} className="rounded-full bg-surface px-3 py-1 text-text-2 hover:text-accent">
              {data.contact.phone}
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="px-4">
        {activeTab === "highlights" && (
          <HighlightsTabV5
            readOnly={!data.isOwnProfile}
            tagClips={tagClips}
            untaggedClips={data.untaggedClips ?? []}
            initialFeatured={data.featured}
            position={profile.position}
            playerName={profile.name}
            playerBirthYear={profile.birthYear ?? null}
            playerTeamName={profile.teamName ?? null}
            onShare={async () => {
              const url = `${window.location.origin}/p/${profile.handle}`;
              try {
                if (navigator.share) {
                  await navigator.share({ title: `${profile.name} — Footory`, url });
                  return;
                }
                await navigator.clipboard.writeText(url);
                toast.success("프로필 링크가 복사되었습니다.");
              } catch { /* cancelled */ }
            }}
            {...(data.isOwnProfile ? {
              onDeleteClip: async (clipId: string) => {
                const res = await fetch(`/api/clips/${clipId}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("영상이 삭제되었습니다.");
                  router.refresh();
                }
                return res.ok;
              },
              onEditTags: async (clipId: string, tags: string[]) => {
                const res = await fetch(`/api/clips/${clipId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tags }),
                });
                if (res.ok) {
                  toast.success("태그가 수정되었습니다.");
                  router.refresh();
                }
                return res.ok;
              },
            } : {})}
          />
        )}

        {activeTab === "records" && (
          <RecordsTabV5
            stats={stats}
            playStyle={mappedPlayStyle}
            percentiles={percentileData?.percentiles}
            ageAvgs={percentileData?.ageAvgs}
            peerCounts={percentileData?.peerCounts}
            ageGroup={percentileData?.ageGroup}
            percentileLoading={percentileLoading}
            {...(data.isOwnProfile ? {
              onAddStat: () => { setStatInputType(undefined); setStatInputId(undefined); setStatInputOpen(true); },
              onUpdateStat: (type: string, statId: string) => { setStatInputType(type); setStatInputId(statId); setStatInputOpen(true); },
              onDeleteStat: async (statId: string) => {
                const res = await fetch(`/api/stats/${statId}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("기록이 삭제되었습니다.");
                  router.refresh();
                }
              },
              onPlayStyleTest: () => setPlayStyleTestOpen(true),
            } : {})}
          />
        )}

        {activeTab === "career" && (
          <CareerTabV5
            readOnly={!data.isOwnProfile}
            profile={profile}
            seasons={seasons}
            tournaments={tournaments}
            awards={mappedAwards}
            achievements={achievements}
            {...(data.isOwnProfile ? {
              onAddSeason: () => setSeasonAddOpen(true),
              onAddTournament: () => setTournamentAddOpen(true),
              onAddAward: () => setAwardAddOpen(true),
              onDeleteTournament: async (id: string) => {
                const res = await fetch(`/api/tournament-records/${id}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("대회 기록이 삭제되었습니다.");
                  router.refresh();
                }
              },
              onDeleteAward: async (id: string) => {
                const res = await fetch(`/api/awards/${id}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("수상 기록이 삭제되었습니다.");
                  router.refresh();
                }
              },
              onEditTournament: (t) => {
                setEditingTournament(t);
                setTournamentAddOpen(true);
              },
              onEditAward: (a) => {
                setEditingAward(a);
                setAwardAddOpen(true);
              },
              onDeleteSeason: async (id: string) => {
                const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("소속 이력이 삭제되었습니다.");
                  router.refresh();
                }
              },
            } : {})}
          />
        )}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={`${profile.name} — Footory`}
        text={`${profile.name}${profile.position ? ` | ${POSITION_LABELS[profile.position] ?? profile.position}` : ""} | Footory 선수 프로필`}
      />

      {/* 내 프로필 편집 시트 */}
      {data.isOwnProfile && ownProfile && editOpen && (
        <ProfileEditSheet
          profile={ownProfile}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={async (updates) => {
            await updateProfile(updates);
            router.refresh();
          }}
          onAvatarUpload={async (file) => {
            const url = await uploadAvatar(file);
            router.refresh();
            return url;
          }}
          onCheckHandle={checkHandle}
        />
      )}
      {data.isOwnProfile && statInputOpen && (
        <StatInputSheet
          open={statInputOpen}
          onClose={() => { setStatInputOpen(false); setStatInputType(undefined); setStatInputId(undefined); }}
          onSave={async (statType, value, evidenceClipId) => {
            const isUpdate = !!statInputId;
            const res = isUpdate
              ? await fetch(`/api/stats/${statInputId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ value, evidenceClipId }),
                })
              : await fetch("/api/stats", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stat_type: statType, value, evidence_clip_id: evidenceClipId }),
                });
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "저장에 실패했습니다.");
            }
            toast.success(isUpdate ? "기록이 수정되었습니다." : "기록이 저장되었습니다.");
            setStatInputOpen(false);
            setStatInputId(undefined);
            router.refresh();
          }}
          initialStatType={statInputType}
        />
      )}
      {data.isOwnProfile && seasonAddOpen && (
        <SeasonAddSheet
          open={seasonAddOpen}
          onClose={() => setSeasonAddOpen(false)}
          onSave={async (input) => {
            await fetch("/api/seasons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            toast.success("시즌 기록이 추가되었습니다.");
            setSeasonAddOpen(false);
            router.refresh();
          }}
        />
      )}
      {data.isOwnProfile && tournamentAddOpen && (
        <TournamentAddSheet
          open={tournamentAddOpen}
          initialValues={editingTournament ?? undefined}
          editingId={editingTournament?.id}
          onClose={() => { setTournamentAddOpen(false); setEditingTournament(null); }}
          onSave={async (input) => {
            if (editingTournament) {
              await fetch(`/api/tournament-records/${editingTournament.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
              });
              toast.success("대회 기록이 수정되었습니다.");
            } else {
              await fetch("/api/tournament-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
              });
              toast.success("대회 기록이 추가되었습니다.");
            }
            setTournamentAddOpen(false);
            setEditingTournament(null);
            router.refresh();
          }}
        />
      )}
      {data.isOwnProfile && awardAddOpen && (
        <AwardAddSheet
          open={awardAddOpen}
          initialValues={editingAward ?? undefined}
          editingId={editingAward?.id}
          onClose={() => { setAwardAddOpen(false); setEditingAward(null); }}
          onSave={async (input) => {
            if (editingAward) {
              await fetch(`/api/awards/${editingAward.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
              });
              toast.success("수상 기록이 수정되었습니다.");
            } else {
              await fetch("/api/awards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
              });
              toast.success("수상 기록이 추가되었습니다.");
            }
            setAwardAddOpen(false);
            setEditingAward(null);
            router.refresh();
          }}
        />
      )}
      {data.isOwnProfile && playStyleTestOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPlayStyleTestOpen(false)} />
          <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="max-h-[80vh] overflow-y-auto px-5 pb-8">
              <PlayStyleTest
                onComplete={async (result) => {
                  await fetch("/api/play-style", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result),
                  });
                  toast.success("플레이 스타일이 저장되었습니다.");
                  setPlayStyleTestOpen(false);
                  router.refresh();
                }}
                onSkip={() => setPlayStyleTestOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 비교 시트 */}
      {compareOpen && (
        <CompareSheet
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          target={{
            profile,
            stats,
            radarStats: targetRadarStats,
          }}
        />
      )}

    </div>
      {/* 비로그인 가입 유도 CTA */}
      {!data.isOwnProfile && !data.viewerAccess?.role && (
        <SignupCTA handle={data.handle} />
      )}
    </ErrorBoundary>
  );
}
