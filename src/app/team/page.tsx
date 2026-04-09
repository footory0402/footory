import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamPageClient from "@/components/team/TeamPageClient";
import type { Team } from "@/lib/types";

async function fetchInitialTeams(userId: string): Promise<Team[]> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, handle, name, logo_url, description, city, founded_year, invite_code, created_by, created_at, team_members(count))")
    .eq("profile_id", userId);

  if (error || !memberships) return [];

  const teamIds = memberships.map((membership) => membership.team_id);
  const lastActivityMap: Record<string, string> = {};

  if (teamIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("team_members")
      .select("team_id, joined_at")
      .in("team_id", teamIds)
      .order("joined_at", { ascending: false });

    for (const member of allMembers ?? []) {
      if (!lastActivityMap[member.team_id]) {
        lastActivityMap[member.team_id] = member.joined_at;
      }
    }
  }

  return memberships.map((membership) => {
    const team = membership.teams as unknown as Record<string, unknown> & {
      team_members?: { count: number }[];
    };
    const { team_members: members, ...rest } = team;

    return {
      id: String(rest.id ?? ""),
      handle: String(rest.handle ?? ""),
      name: String(rest.name ?? ""),
      logoUrl: typeof rest.logo_url === "string" ? rest.logo_url : undefined,
      description: typeof rest.description === "string" ? rest.description : undefined,
      city: typeof rest.city === "string" ? rest.city : undefined,
      foundedYear: typeof rest.founded_year === "number" ? rest.founded_year : undefined,
      memberCount: members?.[0]?.count ?? 0,
      inviteCode: String(rest.invite_code ?? ""),
      createdBy: typeof rest.created_by === "string" ? rest.created_by : "",
      createdAt: String(rest.created_at ?? ""),
      myRole: membership.role,
      lastActivity: lastActivityMap[membership.team_id] ?? undefined,
    };
  });
}

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const initialRole = profile?.role ?? "player";
  const initialTeams =
    initialRole === "scout" ? [] : await fetchInitialTeams(user.id);

  return (
    <TeamPageClient
      initialRole={initialRole}
      initialTeams={initialTeams}
    />
  );
}
