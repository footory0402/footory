import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { SKILL_TAGS } from "@/lib/constants";
import {
  canFollow,
  canUseWatchlist,
  getDmAction,
  type DmAction,
  type UserRole,
} from "@/lib/permissions";
import PublicProfileClient from "./client";

interface Props {
  params: Promise<{ handle: string }>;
}

interface ViewerAccess {
  role: UserRole | null;
  verified: boolean;
  canFollow: boolean;
  watchlist: {
    visible: boolean;
    enabled: boolean;
    label: string;
    message: string;
  };
  dm: DmAction;
}

const getProfile = cache(async (handle: string) => {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !profile) return null;

  const [featured, stats, medals, seasons, team, achievements, timelineEvents, tagClipsData] = await Promise.all([
    supabase
      .from("featured_clips")
      .select("id, clip_id, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("stats")
      .select("*")
      .eq("profile_id", profile.id)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("medals")
      .select("*, medal_criteria(*)")
      .eq("profile_id", profile.id)
      .order("achieved_at", { ascending: false }),
    supabase
      .from("seasons")
      .select("*")
      .eq("profile_id", profile.id)
      .order("year", { ascending: false }),
    supabase
      .from("team_members")
      .select("team_id, teams(name)")
      .eq("profile_id", profile.id)
      .neq("role", "alumni")
      .limit(1)
      .single(),
    supabase
      .from("achievements")
      .select("*")
      .eq("profile_id", profile.id)
      .order("year", { ascending: false }),
    supabase
      .from("timeline_events")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("clips")
      .select("id, video_url, thumbnail_url, duration_seconds, clip_tags(tag_name, is_top)")
      .eq("owner_id", profile.id),
  ]);

  // Filter contact
  const contact: Record<string, string> = {};
  if (profile.show_email && profile.public_email) contact.email = profile.public_email;
  if (profile.show_phone && profile.public_phone) contact.phone = profile.public_phone;

  const teamData = team.data as { team_id: string; teams: { name: string } } | null;

  // Enrich featured clips with clip data (thumbnail, duration)
  const featuredRows = featured.data ?? [];
  const clipIds = featuredRows.map((f: { clip_id: string }) => f.clip_id).filter(Boolean);
  const clipsMap: Record<string, { video_url: string; thumbnail_url: string | null; duration_seconds: number | null }> = {};
  if (clipIds.length > 0) {
    const { data: clipsData } = await supabase
      .from("clips")
      .select("id, video_url, thumbnail_url, duration_seconds")
      .in("id", clipIds);
    if (clipsData) {
      for (const c of clipsData) {
        clipsMap[c.id] = { video_url: c.video_url, thumbnail_url: c.thumbnail_url, duration_seconds: c.duration_seconds };
      }
    }
  }
  const enrichedFeatured = featuredRows.map((f: { id: string; clip_id: string; sort_order: number }) => ({
    ...f,
    clips: clipsMap[f.clip_id] ?? null,
  }));

  // Check if current user follows this profile
  let isFollowing = false;
  let viewerAccess: ViewerAccess = {
    role: null as UserRole | null,
    verified: false,
    canFollow: false,
    watchlist: {
      visible: false,
      enabled: false,
      label: "관심 선수 추가",
      message: "",
    },
    dm: {
      state: "hidden",
      label: "메시지",
      message: "",
    },
  };
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser && currentUser.id !== profile.id) {
    const [
      followRow,
      viewerProfile,
      viewerTeams,
      targetTeams,
      blockRow,
    ] = await Promise.all([
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("role, is_verified")
        .eq("id", currentUser.id)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("team_id")
        .eq("profile_id", currentUser.id)
        .neq("role", "alumni"),
      supabase
        .from("team_members")
        .select("team_id")
        .eq("profile_id", profile.id)
        .neq("role", "alumni"),
      supabase
        .from("blocks")
        .select("id")
        .or(
          `and(blocker_id.eq.${currentUser.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${currentUser.id})`
        )
        .maybeSingle(),
    ]);

    isFollowing = !!followRow.data;

    const viewerRole = (viewerProfile.data?.role ?? null) as UserRole | null;
    const viewerVerified = !!viewerProfile.data?.is_verified;
    const targetRole = (profile.role ?? "player") as UserRole;
    const viewerTeamIds = new Set((viewerTeams.data ?? []).map((item) => item.team_id));
    const isSameTeam = (targetTeams.data ?? []).some((item) => viewerTeamIds.has(item.team_id));
    const targetIsMinor = Boolean(
      profile.birth_year && new Date().getFullYear() - profile.birth_year < 18
    );

    viewerAccess = {
      role: viewerRole,
      verified: viewerVerified,
      canFollow: viewerRole === "player" && targetRole === "player" && canFollow(viewerRole),
      watchlist: {
        visible: viewerRole === "scout" && targetRole === "player",
        enabled: viewerRole !== null && canUseWatchlist(viewerRole, viewerVerified),
        label: viewerVerified ? "관심 선수 추가" : "인증 후 관심 선수 저장",
        message:
          viewerRole === "scout"
            ? viewerVerified
              ? ""
              : "관심 선수 저장은 인증된 스카우터만 사용할 수 있어요."
            : "",
      },
      dm: getDmAction({
        senderRole: viewerRole,
        senderVerified: viewerVerified,
        targetRole,
        isFollowing,
        isSameTeam,
        isBlocked: !!blockRow.data,
        targetIsMinor,
      }),
    };
  }

  // Build tagClips map from SSR data (keyed by tag id, not dbName)
  const dbNameToId = Object.fromEntries(SKILL_TAGS.map((t) => [t.dbName, t.id]));
  const tagClipsMap: Record<string, { id: string; duration: number; tag: string; isTop: boolean; videoUrl: string; thumbnailUrl: string | null }[]> = {};
  (tagClipsData.data ?? []).forEach((clip: Record<string, unknown>) => {
    const clipTags = (clip.clip_tags as unknown as { tag_name: string; is_top: boolean }[]) ?? [];
    clipTags.forEach((t) => {
      const tagId = dbNameToId[t.tag_name] ?? t.tag_name;
      if (!tagClipsMap[tagId]) tagClipsMap[tagId] = [];
      tagClipsMap[tagId].push({
        id: clip.id as string,
        duration: (clip.duration_seconds as number) ?? 0,
        tag: t.tag_name,
        isTop: t.is_top,
        videoUrl: (clip.video_url as string) ?? "",
        thumbnailUrl: (clip.thumbnail_url as string | null) ?? null,
      });
    });
  });

  // Increment view count atomically (fire and forget)
  supabase.rpc("increment_views", { profile_id: profile.id }).then(() => {});

  return {
    ...profile,
    contact: Object.keys(contact).length > 0 ? contact : null,
    teamName: teamData?.teams?.name ?? null,
    teamId: teamData?.team_id ?? null,
    featured: enrichedFeatured,
    stats: stats.data ?? [],
    medals: medals.data ?? [],
    seasons: seasons.data ?? [],
    achievements: achievements.data ?? [],
    timelineEvents: timelineEvents.data ?? [],
    tagClips: tagClipsMap,
    isFollowing,
    isOwnProfile: currentUser?.id === profile.id,
    viewerAccess,
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);

  if (!profile) {
    return { title: "선수를 찾을 수 없습니다 — Footory" };
  }

  const description = `${profile.position} · ${profile.birth_year}년생${profile.teamName ? ` · ${profile.teamName}` : ""}`;

  return {
    title: `${profile.name} (@${profile.handle}) — Footory`,
    description,
    openGraph: {
      title: `${profile.name} — Footory`,
      description,
      type: "profile",
      url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app"}/p/${handle}`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await getProfile(handle);

  if (!profile) {
    notFound();
  }

  return <PublicProfileClient profile={profile} />;
}
