"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import RecordsTab from "@/components/player/RecordsTab";
import FeaturedSlot from "@/components/player/FeaturedSlot";
import StatCard from "@/components/player/StatCard";
import MedalBadge from "@/components/player/MedalBadge";
import FollowButton from "@/components/social/FollowButton";
import dynamic from "next/dynamic";
import { getOrCreateConversation, canSendDm, sendDmRequest } from "@/lib/dm";
import { createClient } from "@/lib/supabase/client";

const AddToWatchlistButton = dynamic(
  () => import("@/components/scout/AddToWatchlistButton"),
  { ssr: false }
);

const ShareSheet = dynamic(() => import("@/components/ui/ShareSheet"), { ssr: false });
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SectionCard } from "@/components/ui/Card";
import AchievementList from "@/components/portfolio/AchievementList";
import GrowthTimeline from "@/components/portfolio/GrowthTimeline";
import { APP_URL } from "@/lib/constants";
import type { Profile, Stat, Medal, Season, Achievement, TimelineEvent, TimelineEventType } from "@/lib/types";

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
  level: number;
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
  medals: Record<string, unknown>[];
  seasons: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  timelineEvents: Record<string, unknown>[];
  isFollowing?: boolean;
  isOwnProfile?: boolean;
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
    level: data.level,
    xp: 0,
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

function mapTimelineEvents(rows: Record<string, unknown>[]): TimelineEvent[] {
  return rows.map((r) => ({
    id: r.id as string,
    profileId: r.profile_id as string,
    eventType: r.event_type as TimelineEventType,
    eventData: (r.event_data as Record<string, unknown>) ?? {},
    clipId: (r.clip_id as string) ?? undefined,
    createdAt: r.created_at as string,
  }));
}

// Map DB stat rows (DB uses recorded_at, not measured_at)
function mapStats(rows: Record<string, unknown>[]): Stat[] {
  return rows.map((r) => ({
    id: r.id as string,
    playerId: r.profile_id as string,
    type: r.stat_type as string,
    value: r.value as number,
    previousValue: r.previous_value as number | undefined,
    unit: r.unit as string,
    measuredAt: r.recorded_at as string,
    evidenceClipId: (r.evidence_clip_id as string) ?? undefined,
    verified: (r.verified as boolean) ?? false,
  }));
}

// Map DB medal rows (DB uses medal_code + medal_criteria JOIN, not medal_type/label/value)
function mapMedals(rows: Record<string, unknown>[]): Medal[] {
  return rows.map((r) => {
    const c = r.medal_criteria as { stat_type?: string; label?: string; threshold?: number; code?: string } | null;
    return {
      id: r.id as string,
      playerId: r.profile_id as string,
      type: c?.stat_type ?? "",
      label: c?.label ?? (r.medal_code as string),
      value: c?.threshold ?? 0,
      unit: "",
      verified: false,
      awardedAt: r.achieved_at as string,
    };
  });
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

export default function PublicProfileClient({ profile: data }: { profile: PublicProfileData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");
  const [shareOpen, setShareOpen] = useState(false);

  const profile = toProfile(data);
  const stats = mapStats(data.stats);
  const medals = mapMedals(data.medals);
  const seasons = mapSeasons(data.seasons);
  const achievements = mapAchievements(data.achievements ?? []);
  const timelineEvents = mapTimelineEvents(data.timelineEvents ?? []);
  const featured = data.featured;

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `${APP_URL}/p/${profile.handle}`;

  const handleBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  return (
    <ErrorBoundary>
    <div className="mx-auto max-w-[430px] px-4 pb-24 pt-4">
      {/* Floating back button */}
      <button
        onClick={handleBack}
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-card text-text-2 active:bg-elevated"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {/* Profile card (read-only, no edit button) */}
      <ProfileCard profile={profile} />

      {/* Follow + Share buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!data.isOwnProfile && (
          <>
            <FollowButton targetId={profile.id} initialFollowing={!!data.isFollowing} size="md" />
            <AddToWatchlistButton playerId={profile.id} />
            <button
              onClick={async () => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const perm = await canSendDm(user.id, profile.id);
                if (perm === "blocked") {
                  alert("이 사용자에게 메시지를 보낼 수 없습니다.");
                  return;
                }
                if (perm === "request") {
                  const msg = prompt("대화 요청 메시지를 입력하세요:");
                  if (msg === null) return;
                  await sendDmRequest(profile.id, msg);
                  alert("대화 요청을 보냈습니다.");
                  return;
                }

                const convId = await getOrCreateConversation(user.id, profile.id);
                router.push(`/dm/${convId}`);
              }}
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-[13px] font-semibold text-text-2 transition-colors hover:border-accent hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              메시지
            </button>
          </>
        )}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-[13px] font-semibold text-text-2 transition-colors hover:border-accent hover:text-accent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
          공유
        </button>
      </div>

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
        {activeTab === "summary" && (
          <PublicSummaryTab featured={featured} stats={stats} medals={medals} />
        )}
        {activeTab === "skills" && (
          <div className="py-8 text-center text-[13px] text-text-3">
            스킬 태그 영상은 비공개입니다
          </div>
        )}
        {activeTab === "records" && (
          <div className="flex flex-col gap-5">
            <RecordsTab stats={stats} medals={medals} seasons={seasons} />
            {achievements.length > 0 && (
              <AchievementList achievements={achievements} />
            )}
            {timelineEvents.length > 0 && (
              <SectionCard title="성장 타임라인" icon="📈">
                <GrowthTimeline events={timelineEvents} />
              </SectionCard>
            )}
          </div>
        )}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={`${profile.name} — Footory`}
        text={`${profile.name}${profile.position ? ` | ${POSITION_LABELS[profile.position] ?? profile.position}` : ""} | Footory 선수 프로필`}
      />
    </div>
    </ErrorBoundary>
  );
}

function PublicSummaryTab({
  featured,
  stats,
  medals,
}: {
  featured: FeaturedClip[];
  stats: Stat[];
  medals: Medal[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Featured Highlights (read-only) */}
      {featured.length > 0 && (
        <SectionCard title="대표 하이라이트" icon="⭐">
          <div className="grid grid-cols-2 gap-2">
            {featured.map((feat, i) => (
              <div key={feat.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <FeaturedSlot
                  clipId={feat.clip_id}
                  thumbnailUrl={feat.clips?.thumbnail_url}
                  durationSeconds={feat.clips?.duration_seconds ?? undefined}
                  sortOrder={i + 1}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Key Stats */}
      {stats.length > 0 && (
        <SectionCard title="핵심 스탯" icon="📊">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {stats.map((stat, i) => (
              <div key={stat.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Medals */}
      {medals.length > 0 && (
        <SectionCard title="메달" icon="🏅">
          <div className="flex flex-wrap gap-2">
            {medals.map((medal, i) => (
              <div key={medal.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <MedalBadge label={medal.label} value={medal.value} unit={medal.unit} verified={medal.verified} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Empty state */}
      {featured.length === 0 && stats.length === 0 && medals.length === 0 && (
        <div className="py-12 text-center text-[13px] text-text-3">
          아직 등록된 정보가 없습니다
        </div>
      )}
    </div>
  );
}
