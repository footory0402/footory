import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import PublicProfileClient from "./client";

interface Props {
  params: Promise<{ handle: string }>;
}

async function getProfile(handle: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !profile) return null;

  const [featured, stats, medals, seasons, team] = await Promise.all([
    supabase
      .from("featured_clips")
      .select("id, clip_id, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("stats")
      .select("*")
      .eq("profile_id", profile.id)
      .order("measured_at", { ascending: false }),
    supabase
      .from("medals")
      .select("*")
      .eq("profile_id", profile.id)
      .order("awarded_at", { ascending: false }),
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
  ]);

  // Filter contact
  const contact: Record<string, string> = {};
  if (profile.show_email && profile.public_email) contact.email = profile.public_email;
  if (profile.show_phone && profile.public_phone) contact.phone = profile.public_phone;

  const teamData = team.data as unknown as { team_id: string; teams: { name: string } } | null;

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
    featured: featured.data ?? [],
    stats: stats.data ?? [],
    medals: medals.data ?? [],
    seasons: seasons.data ?? [],
  };
}

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
