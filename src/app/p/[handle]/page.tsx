import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import PublicProfileClient from "./client";

interface Props {
  params: Promise<{ handle: string }>;
}

const getProfile = cache(async (handle: string) => {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !profile) return null;

  const [featured, stats, medals, seasons, team, achievements, timelineEvents] = await Promise.all([
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
  ]);

  // Filter contact
  const contact: Record<string, string> = {};
  if (profile.show_email && profile.public_email) contact.email = profile.public_email;
  if (profile.show_phone && profile.public_phone) contact.phone = profile.public_phone;

  const teamData = team.data as { team_id: string; teams: { name: string } } | null;

  // Enrich featured clips with clip data (thumbnail, duration)
  const featuredRows = featured.data ?? [];
  const clipIds = featuredRows.map((f: { clip_id: string }) => f.clip_id).filter(Boolean);
  let clipsMap: Record<string, { video_url: string; thumbnail_url: string | null; duration_seconds: number | null }> = {};
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
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser && currentUser.id !== profile.id) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  // Increment view count (fire and forget)
  supabase
    .from("profiles")
    .update({ views_count: (profile.views_count ?? 0) + 1 })
    .eq("id", profile.id)
    .then(() => {});

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
    isFollowing,
    isOwnProfile: currentUser?.id === profile.id,
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
