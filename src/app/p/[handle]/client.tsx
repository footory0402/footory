"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import SeasonTimeline from "@/components/player/SeasonTimeline";
import FollowButton from "@/components/social/FollowButton";
import dynamic from "next/dynamic";
import { getOrCreateConversation, canSendDm, sendDmRequest } from "@/lib/dm";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const AddToWatchlistButton = dynamic(
  () => import("@/components/scout/AddToWatchlistButton"),
  { ssr: false }
);

const InfoTab = dynamic(() => import("@/components/player/InfoTab"), { ssr: false });
const HighlightsTab = dynamic(() => import("@/components/player/HighlightsTab"), { ssr: false });
const ShareSheet = dynamic(() => import("@/components/social/ShareSheet"), { ssr: false });
const CompareSheet = dynamic(() => import("@/components/player/CompareSheet"), { ssr: false });
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SectionCard } from "@/components/ui/Card";
import AchievementList from "@/components/portfolio/AchievementList";
import { APP_URL, POSITION_LABELS, MEASUREMENTS, type PlayStyleType } from "@/lib/constants";
import { calcRadarStats, type ClipTagCount } from "@/lib/radar-calc";
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
  } | null;
}

interface TagClip {
  id: string;
  duration: number;
  tag: string;
  isTop: boolean;
  videoUrl: string;
  thumbnailUrl: string | null;
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
  playStyle?: Record<string, unknown> | null;
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
  }));
}

function footLabel(foot: string): string {
  if (foot === "right") return "오른발";
  if (foot === "left") return "왼발";
  if (foot === "both") return "양발";
  return foot;
}

export default function PublicProfileClient({ profile: data }: { profile: PublicProfileData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("highlights");
  const [shareOpen, setShareOpen] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [dmMsg, setDmMsg] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const profile = toProfile(data);
  const stats = useMemo(() => computeAggregatedStats(data.stats), [data.stats]);
  const seasons = mapSeasons(data.seasons);
  const achievements = mapAchievements(data.achievements ?? []);
  const tagClips = data.tagClips ?? {};

  // Percentile data for InfoTab
  const [percentiles, setPercentiles] = useState<Record<string, number>>({});
  const [ageAvgs, setAgeAvgs] = useState<Record<string, number>>({});
  const [peerCounts, setPeerCounts] = useState<Record<string, number>>({});
  const [ageGroup, setAgeGroup] = useState<string>("");

  useEffect(() => {
    if (stats.length === 0) return;
    fetch(`/api/stats/percentile?profileId=${data.id}`)
      .then((r) => (r.ok ? r.json() : { percentiles: {}, ageAvgs: {}, peerCounts: {}, ageGroup: "" }))
      .then((d) => {
        setPercentiles(d.percentiles ?? {});
        setAgeAvgs(d.ageAvgs ?? {});
        setPeerCounts(d.peerCounts ?? {});
        setAgeGroup(d.ageGroup ?? "");
      })
      .catch(() => {});
  }, [data.id, stats.length]);

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

  // clipTagCounts for radar and InfoTab
  const clipTagCounts: ClipTagCount[] = useMemo(() => {
    return Object.entries(tagClips)
      .map(([, clips]) => {
        const tagName = clips[0]?.tag ?? "";
        return { tagName, count: clips.length };
      })
      .filter((t) => t.tagName);
  }, [tagClips]);

  // Compute radar stats with percentiles
  const targetRadarStats = useMemo(() => {
    return calcRadarStats(stats, clipTagCounts, percentiles);
  }, [stats, clipTagCounts, percentiles]);

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

  const hasPhysical = profile.heightCm || profile.weightKg || profile.preferredFoot;

  return (
    <ErrorBoundary>
    <div className="mx-auto max-w-[430px] pb-24">
      {/* 상단 고정 헤더 */}
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

      <div className="px-4 pt-3">
      {/* Profile card (read-only, no edit button) */}
      <ProfileCard profile={profile} />

      {/* 액션 버튼 — 프로필 카드 바로 아래 */}
      {!data.isOwnProfile && (
        <div className="mt-3 flex gap-2">
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

                // Check if conversation already exists — skip request flow
                const { data: existingConv } = await supabase
                  .from("conversations")
                  .select("id")
                  .or(
                    `and(participant_1.eq.${user.id},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${user.id})`
                  )
                  .maybeSingle();

                if (existingConv) {
                  router.push(`/dm/${existingConv.id}`);
                  return;
                }

                if (viewerAccess?.dm.state === "request") {
                  setDmModalOpen(true);
                  return;
                }

                const perm = await canSendDm(user.id, profile.id);
                if (perm === "blocked") {
                  toast.error(viewerAccess?.dm.message || "이 사용자에게 메시지를 보낼 수 없습니다.");
                  return;
                }
                if (perm === "request") {
                  setDmModalOpen(true);
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
              {viewerAccess?.dm.label ?? "대화 요청"}
            </button>
          )}
        </div>
      )}
      {helperTexts.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 text-[12px] text-text-3">
          {helperTexts.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}

      {/* Contact info */}
      {data.contact && (
        <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
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
      <div className="mt-4">
        <ProfileTabs active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === "highlights" && (
          <HighlightsTab
            readOnly
            tagClips={tagClips}
            initialFeatured={data.featured}
            position={profile.position}
          />
        )}

        {activeTab === "records" && (
          <div className="flex flex-col gap-5">
            <InfoTab
              readOnly
              stats={stats}
              percentiles={percentiles}
              ageAvgs={ageAvgs}
              peerCounts={peerCounts}
              ageGroup={ageGroup}
              radarStats={targetRadarStats}
              clipTagCounts={clipTagCounts}
              playStyle={mappedPlayStyle}
              achievements={achievements}
            />

            {/* Physical */}
            {hasPhysical && (
              <div className="flex flex-wrap gap-2">
                {profile.heightCm && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
                    <span className="text-[10px] text-text-3">키</span>
                    <span className="font-stat text-sm font-bold text-text-1">{profile.heightCm}</span>
                    <span className="text-[10px] text-text-3">cm</span>
                  </div>
                )}
                {profile.weightKg && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
                    <span className="text-[10px] text-text-3">몸무게</span>
                    <span className="font-stat text-sm font-bold text-text-1">{profile.weightKg}</span>
                    <span className="text-[10px] text-text-3">kg</span>
                  </div>
                )}
                {profile.preferredFoot && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2">
                    <span className="text-[10px] text-text-3">주발</span>
                    <span className="text-sm font-medium text-text-1">{footLabel(profile.preferredFoot)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Season records */}
            {seasons.length > 0 && (
              <SectionCard title="시즌 기록" icon="📅">
                <SeasonTimeline seasons={seasons} />
              </SectionCard>
            )}
          </div>
        )}
      </div>

      </div>{/* end px-4 */}

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={`${profile.name} — Footory`}
        text={`${profile.name}${profile.position ? ` | ${POSITION_LABELS[profile.position] ?? profile.position}` : ""} | Footory 선수 프로필`}
      />

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

      {/* DM 요청 모달 */}
      {dmModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => { setDmModalOpen(false); setDmMsg(""); }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl bg-card p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[15px] font-bold text-text-1">대화 요청</h3>
            <p className="mb-3 text-[12px] text-text-3">{profile.name}님에게 대화 요청 메시지를 보내세요.</p>
            <textarea
              value={dmMsg}
              onChange={(e) => setDmMsg(e.target.value)}
              placeholder="안녕하세요! 메시지를 입력하세요..."
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-xl bg-surface px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mb-3 text-right text-[11px] text-text-3">{dmMsg.length}/200</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setDmModalOpen(false); setDmMsg(""); }}
                className="flex-1 rounded-xl bg-surface py-3 text-[13px] font-semibold text-text-2"
              >
                취소
              </button>
              <button
                disabled={dmSending || dmMsg.trim().length === 0}
                onClick={async () => {
                  if (dmMsg.trim().length === 0) return;
                  setDmSending(true);
                  await sendDmRequest(profile.id, dmMsg.trim());
                  setDmSending(false);
                  setDmModalOpen(false);
                  setDmMsg("");
                  toast.success("대화 요청을 보냈습니다.");
                  router.push("/dm");
                }}
                className="flex-1 rounded-xl bg-accent py-3 text-[13px] font-bold text-bg disabled:opacity-50"
              >
                {dmSending ? "보내는 중..." : "요청 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
