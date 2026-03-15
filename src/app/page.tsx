import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPocAdminUser } from "@/lib/poc-admin";
import { fetchFeedPage, fetchMvpLeader, hasUserUploadedClips } from "@/lib/server/feed";
import { fetchLinkedChildren, fetchParentDashboard } from "@/lib/server/parent-home";
import { fetchScoutHomeData } from "@/lib/server/scout-home";
import ChildDashboard from "@/components/parent/ChildDashboard";
import ScoutHome from "@/components/scout/ScoutHome";
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import HomePlayerView from "@/components/home/HomePlayerView";
import ProfileHydrator from "@/components/layout/ProfileHydrator";

/* ── Full profile select (same as /api/profile — fetched once, shared) ── */
const PROFILE_SELECT =
  "id, handle, name, position, birth_year, city, bio, avatar_url, role, followers_count, following_count, views_count, public_email, public_phone, show_email, show_phone, created_at, mvp_count, mvp_tier, is_verified, height_cm, weight_kg, preferred_foot" as const;

/* ── Async server components (heavy data fetch, streamed via Suspense) ── */

async function PlayerHome({
  supabase,
  userId,
  profileHint,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  profileHint: { city: string | null; birth_year: number | null; position: string | null };
}) {
  const [feedData, hasClips, mvpLeader] = await Promise.all([
    fetchFeedPage(supabase, userId, null, profileHint),
    hasUserUploadedClips(supabase, userId),
    fetchMvpLeader(supabase),
  ]);

  return (
    <>
      <WelcomeModal />
      <HomePlayerView
        mvpLeader={mvpLeader}
        initialFeedItems={feedData.items}
        initialNextCursor={feedData.nextCursor}
        showNudge={!hasClips}
      />
    </>
  );
}

async function ParentDashboardServer({
  supabase,
  userId,
  name,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  name: string;
}) {
  const initialChildren = await fetchLinkedChildren(supabase, userId);
  const initialSelectedChildId = initialChildren[0]?.childId ?? null;
  const initialDashboard = initialSelectedChildId
    ? await fetchParentDashboard(supabase, initialSelectedChildId, name)
    : null;

  return (
    <ChildDashboard
      initialChildren={initialChildren}
      hasInitialChildrenData
      initialSelectedChildId={initialSelectedChildId}
      initialDashboard={initialDashboard}
    />
  );
}

async function ScoutHomeServer({
  supabase,
  userId,
  isVerified,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  isVerified: boolean;
}) {
  const initialData = await fetchScoutHomeData(supabase, userId, isVerified);
  return <ScoutHome initialData={initialData} />;
}

/* ── Skeleton loaders (shown instantly while data streams) ── */

function PlayerFeedSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Pill tabs skeleton */}
      <div className="flex gap-1.5 px-4 py-2">
        <div className="flex-1 h-9 rounded-full bg-accent/30" />
        <div className="flex-1 h-9 rounded-full bg-white/[0.06]" />
      </div>
      <div className="px-4 pt-2">
        {/* MVP teaser skeleton */}
        <div className="mb-4 rounded-xl bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-card-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-card-alt" />
              <div className="h-3 w-20 rounded bg-card-alt" />
            </div>
          </div>
        </div>
        {/* Feed skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3 rounded-xl bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-card-alt" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-card-alt" />
                <div className="h-2.5 w-16 rounded bg-card-alt" />
              </div>
            </div>
            <div className="aspect-video w-full rounded-xl bg-card-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Role resolver (runs inside Suspense → skeleton shows instantly) ── */

async function HomeContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  if (isPocAdminUser(user)) redirect("/admin/video-lab");

  // Full profile + team 동시 조회 (클라이언트 /api/profile 호출 제거)
  const [profileResult, teamResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("team_id, teams(name)")
      .eq("profile_id", user.id)
      .neq("role", "alumni")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profileResult.data) redirect("/onboarding");
  const profile = profileResult.data;
  const role = profile.role as string;

  const teamData = teamResult.data as unknown as {
    team_id: string;
    teams: { name: string };
  } | null;
  const profilePayload = {
    ...profile,
    teamName: teamData?.teams?.name ?? null,
    teamId: teamData?.team_id ?? null,
  };

  if (role === "parent") {
    return (
      <>
        <ProfileHydrator data={profilePayload} />
        <ParentDashboardServer
          supabase={supabase}
          userId={user.id}
          name={profile.name ?? "보호자"}
        />
      </>
    );
  }

  if (role === "scout") {
    return (
      <>
        <ProfileHydrator data={profilePayload} />
        <ScoutHomeServer
          supabase={supabase}
          userId={user.id}
          isVerified={profile.is_verified ?? false}
        />
      </>
    );
  }

  return (
    <>
      <ProfileHydrator data={profilePayload} />
      <WelcomeModal />
      <PlayerHome
        supabase={supabase}
        userId={user.id}
        profileHint={{
          city: profile.city ?? null,
          birth_year: profile.birth_year ?? null,
          position: profile.position ?? null,
        }}
      />
    </>
  );
}

/* ── Page (instant skeleton → stream content) ── */

export default function HomePage() {
  return (
    <Suspense fallback={<PlayerFeedSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
