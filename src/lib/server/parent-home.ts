import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import type { LinkedChild, ParentDashboardData } from "@/lib/home-types";

type QueryResult<T> = {
  data: T | null;
  error?: { message?: string } | null;
  count?: number | null;
};

type ServerSupabase = SupabaseClient<Database>;

type ChildProfile = NonNullable<ParentDashboardData["child"]>;

export async function fetchLinkedChildren(
  supabase: ServerSupabase,
  parentId: string
): Promise<LinkedChild[]> {
  const { data: links, error } = await supabase
    .from("parent_links")
    .select(
      "id, child_id, created_at, profiles!parent_links_child_id_fkey(id, handle, name, avatar_url, position, level)"
    )
    .eq("parent_id", parentId);

  if (error || !links?.length) {
    return [];
  }

  return Promise.all(
    links.map(async (link) => {
      const child = link.profiles as unknown as {
        id: string;
        handle: string;
        name: string;
        avatar_url: string | null;
        position: string | null;
        level: number;
      } | null;

      if (!child) {
        return {
          linkId: link.id,
          childId: link.child_id,
          handle: "",
          name: "",
          avatarUrl: null,
          position: null,
          level: 1,
          medalCount: 0,
          clipCount: 0,
          linkedAt: link.created_at,
        };
      }

      const [medals, clips] = await Promise.all([
        supabase
          .from("medals")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", child.id),
        supabase
          .from("clips")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", child.id),
      ]);

      return {
        linkId: link.id,
        childId: child.id,
        handle: child.handle,
        name: child.name,
        avatarUrl: child.avatar_url,
        position: child.position,
        level: child.level ?? 1,
        medalCount: medals.count ?? 0,
        clipCount: clips.count ?? 0,
        linkedAt: link.created_at,
      };
    })
  );
}

export async function fetchParentDashboard(
  supabase: ServerSupabase,
  childId: string,
  parentName: string
): Promise<ParentDashboardData | null> {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString();

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekStartISO = prevWeekStart.toISOString();

  const [
    childProfileResult,
    weeklyClipsResult,
    weeklyKudosResult,
    weeklyViewsResult,
    mvpResultResult,
    recentActivityResult,
    teamNewsResult,
    prevWeeklyClipsResult,
    prevWeeklyKudosResult,
  ] = await Promise.allSettled([
    supabase
      .from("profiles")
      .select(
        "id, name, handle, avatar_url, position, level, xp, followers_count, views_count"
      )
      .eq("id", childId)
      .maybeSingle(),
    supabase
      .from("clips")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", childId)
      .gte("created_at", weekStartISO),
    (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, string>
        ) => Promise<{ data: number | null }>;
      }
    ).rpc("count_weekly_kudos", {
      p_profile_id: childId,
      p_week_start: weekStartISO,
    }),
    supabase.from("profiles").select("views_count").eq("id", childId).maybeSingle(),
    supabase
      .from("weekly_mvp_results")
      .select("rank, total_score")
      .eq("profile_id", childId)
      .gte("week_start", weekStartISO)
      .order("rank", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("feed_items")
      .select("id, type, metadata, created_at")
      .eq("profile_id", childId)
      .order("created_at", { ascending: false })
      .limit(5),
    getTeamNews(supabase, childId),
    supabase
      .from("clips")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", childId)
      .gte("created_at", prevWeekStartISO)
      .lt("created_at", weekStartISO),
    (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, string>
        ) => Promise<{ data: number | null }>;
      }
    ).rpc("count_weekly_kudos", {
      p_profile_id: childId,
      p_week_start: prevWeekStartISO,
    }),
  ]);

  const childProfile = getSettledQueryData<ChildProfile>(childProfileResult);
  if (!childProfile) {
    return null;
  }

  const weeklyClipsCount = getSettledCount(weeklyClipsResult);
  const weeklyKudos = getSettledQueryData<number>(weeklyKudosResult) ?? 0;
  const weeklyViews = getSettledQueryData<{ views_count: number | null }>(
    weeklyViewsResult
  );
  const mvpResult = getSettledQueryData<{
    rank: number | null;
    total_score: number | null;
  }>(mvpResultResult);
  const recentActivity =
    getSettledQueryData<{
      id: string;
      type: string;
      metadata: unknown;
      created_at: string;
    }[]>(recentActivityResult) ?? [];
  const teamNews = teamNewsResult.status === "fulfilled" ? teamNewsResult.value : [];
  const prevWeeklyClipsCount = getSettledCount(prevWeeklyClipsResult);
  const prevWeeklyKudos = getSettledQueryData<number>(prevWeeklyKudosResult) ?? 0;

  return {
    parentName,
    child: childProfile,
    weeklyStats: {
      newClips: weeklyClipsCount,
      kudosReceived: typeof weeklyKudos === "number" ? weeklyKudos : 0,
      profileViews: weeklyViews?.views_count ?? 0,
      mvpRank: mvpResult?.rank ?? null,
      level: childProfile.level ?? 1,
    },
    prevWeeklyStats: {
      newClips: prevWeeklyClipsCount,
      kudosReceived: typeof prevWeeklyKudos === "number" ? prevWeeklyKudos : 0,
    },
    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      type: item.type,
      metadata: toMetadata(item.metadata),
      createdAt: item.created_at,
    })),
    teamNews,
  };
}

async function getTeamNews(
  supabase: ServerSupabase,
  childId: string
): Promise<ParentDashboardData["teamNews"]> {
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("profile_id", childId)
    .neq("role", "alumni")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return [];
  }

  const teamId = membership.team_id;
  const teamName =
    (membership as unknown as { teams?: { name?: string | null } }).teams?.name ?? "팀";

  const { data: memberRows, error: membersError } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", teamId)
    .neq("role", "alumni");

  if (membersError) {
    return [];
  }

  const memberIds = memberRows?.map((member) => member.profile_id) ?? [];
  if (memberIds.length === 0) {
    return [];
  }

  const { count: teamClipCount, error: teamClipsError } = await supabase
    .from("clips")
    .select("id", { count: "exact", head: true })
    .in("owner_id", memberIds)
    .gte(
      "created_at",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (teamClipsError) {
    return [];
  }

  return [
    {
      teamId,
      teamName,
      newClips: teamClipCount ?? 0,
    },
  ];
}

function toMetadata(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSettledQueryData<T>(result: PromiseSettledResult<QueryResult<T>>): T | null {
  if (result.status !== "fulfilled" || result.value.error) {
    return null;
  }

  return result.value.data ?? null;
}

function getSettledCount(
  result: PromiseSettledResult<QueryResult<unknown>>
): number {
  if (result.status !== "fulfilled" || result.value.error) {
    return 0;
  }

  return result.value.count ?? 0;
}
