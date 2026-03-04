import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import PublicTeamClient from "./client";

interface Props {
  params: Promise<{ handle: string }>;
}

async function getTeam(handle: string) {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !team) return null;

  const [members, albums] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, team_id, profile_id, role, joined_at")
      .eq("team_id", team.id)
      .order("joined_at"),
    supabase
      .from("team_albums")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    ...team,
    memberCount: members.data?.length ?? 0,
    members: members.data ?? [],
    albums: albums.data ?? [],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const team = await getTeam(handle);

  if (!team) {
    return { title: "팀을 찾을 수 없습니다 — Footory" };
  }

  const description = `${team.memberCount}명의 멤버${team.city ? ` · ${team.city}` : ""}`;

  return {
    title: `${team.name} (@${team.handle}) — Footory`,
    description,
    openGraph: {
      title: `${team.name} — Footory`,
      description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app"}/t/${handle}`,
    },
  };
}

export default async function PublicTeamPage({ params }: Props) {
  const { handle } = await params;
  const team = await getTeam(handle);

  if (!team) {
    notFound();
  }

  return <PublicTeamClient team={team as Parameters<typeof PublicTeamClient>[0]["team"]} />;
}
