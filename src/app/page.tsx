import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPocAdminUser } from "@/lib/poc-admin";
import ChildDashboard from "@/components/parent/ChildDashboard";
import ScoutHome from "@/components/scout/ScoutHome";
import MvpTeaser from "@/components/mvp/MvpTeaser";
import ChallengeBanner from "@/components/challenge/ChallengeBanner";
import FeedListClient from "@/components/feed/FeedList";
import WelcomeModal from "@/components/onboarding/WelcomeModal";

/* ── Async server components (heavy data fetch, streamed via Suspense) ── */

async function PlayerFeed({ userId }: { userId: string }) {
  const { fetchFeedPage, fetchMvpLeader, hasUserUploadedClips } = await import(
    "@/lib/server/feed"
  );

  const supabase = await createClient();
  const [feedData, hasClips, mvpLeader] = await Promise.all([
    fetchFeedPage(supabase, userId),
    hasUserUploadedClips(supabase, userId),
    fetchMvpLeader(supabase),
  ]);

  return (
    <>
      <WelcomeModal />
      <MvpTeaser leader={mvpLeader} />
      <ChallengeBanner />
      <FeedListClient
        initialItems={feedData.items}
        initialNextCursor={feedData.nextCursor}
        showNudge={!hasClips}
      />
    </>
  );
}

async function ParentDashboardServer({ userId, name }: { userId: string; name: string }) {
  const { fetchLinkedChildren, fetchParentDashboard } = await import(
    "@/lib/server/parent-home"
  );

  const supabase = await createClient();
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

async function ScoutHomeServer({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const { fetchScoutHomeData } = await import("@/lib/server/scout-home");

  const supabase = await createClient();
  const initialData = await fetchScoutHomeData(
    supabase,
    userId,
    isVerified // scout role already confirmed by caller
  );

  return <ScoutHome initialData={initialData} />;
}

/* ── Skeleton loaders (shown instantly while data streams) ── */

function PlayerFeedSkeleton() {
  return (
    <div className="px-4 pt-4 animate-pulse">
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
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-4 pt-4 animate-pulse">
      <div className="h-10 w-40 rounded bg-card-alt mb-4" />
      <div className="rounded-xl bg-card p-4 mb-4">
        <div className="h-20 rounded bg-card-alt" />
      </div>
      <div className="rounded-xl bg-card p-4">
        <div className="h-32 rounded bg-card-alt" />
      </div>
    </div>
  );
}

/* ── Role resolver (runs inside Suspense → skeleton shows instantly) ── */

async function HomeContent() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");
  const user = session.user;
  if (isPocAdminUser(user)) redirect("/admin/video-lab");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const role = profile?.role;

  if (role === "parent") {
    return <ParentDashboardServer userId={user.id} name={profile?.name ?? "보호자"} />;
  }

  if (role === "scout") {
    return <ScoutHomeServer userId={user.id} isVerified={profile?.is_verified ?? false} />;
  }

  return (
    <div className="px-4 pt-4">
      <PlayerFeed userId={user.id} />
    </div>
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
