"use client";

import { useState } from "react";
import ProfileCard from "@/components/player/ProfileCard";
import ProfileTabs, { type ProfileTab } from "@/components/player/ProfileTabs";
import RecordsTab from "@/components/player/RecordsTab";
import FeaturedSlot from "@/components/player/FeaturedSlot";
import StatCard from "@/components/player/StatCard";
import MedalBadge from "@/components/player/MedalBadge";
import FollowButton from "@/components/social/FollowButton";
import dynamic from "next/dynamic";

const ShareSheet = dynamic(() => import("@/components/ui/ShareSheet"), { ssr: false });
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SectionCard } from "@/components/ui/Card";
import { SKILL_TAGS, POSITION_LABELS } from "@/lib/constants";
import { APP_URL } from "@/lib/constants";
import type { Profile, Stat, Medal, Season } from "@/lib/types";

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
    teamName: (data.teamName as string) ?? undefined,
    teamId: (data.teamId as string) ?? undefined,
    mvpCount: (data.mvp_count as number) ?? 0,
    mvpTier: (data.mvp_tier as Profile["mvpTier"]) ?? null,
    createdAt: data.created_at,
  };
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
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");
  const [shareOpen, setShareOpen] = useState(false);

  const profile = toProfile(data);
  const stats = mapStats(data.stats);
  const medals = mapMedals(data.medals);
  const seasons = mapSeasons(data.seasons);
  const featured = data.featured;

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `${APP_URL}/p/${profile.handle}`;

  return (
    <ErrorBoundary>
    <div className="mx-auto max-w-[430px] px-4 pb-24 pt-4">
      {/* Profile card (read-only, no edit button) */}
      <ProfileCard profile={profile} />

      {/* Follow + Share buttons */}
      <div className="mt-3 flex items-center gap-2">
        {!data.isOwnProfile && (
          <FollowButton targetId={profile.id} initialFollowing={!!data.isFollowing} size="md" />
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
          <RecordsTab stats={stats} medals={medals} seasons={seasons} />
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
