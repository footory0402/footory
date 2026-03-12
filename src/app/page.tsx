import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPocAdminUser } from "@/lib/poc-admin";
import ChildDashboard from "@/components/parent/ChildDashboard";
import ScoutHome from "@/components/scout/ScoutHome";
import MvpTeaser from "@/components/mvp/MvpTeaser";
import ChallengeBanner from "@/components/challenge/ChallengeBanner";
import QuestChecklist from "@/components/quest/QuestChecklist";
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
      <QuestChecklist />
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
      {/* Quest skeleton */}
      <div className="mb-4 rounded-xl bg-card p-4">
        <div className="h-4 w-28 rounded bg-card-alt mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-card-alt" />
          <div className="h-3 w-3/4 rounded bg-card-alt" />
        </div>
      </div>
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

/* ── Page (fast: auth check + role → Suspense stream) ── */

export default async function HomePage() {
  const supabase = await createClient();

  // Middleware(proxy.ts)에서 이미 getUser()로 인증 검증됨 → 빠른 getSession() 사용
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

  // 프로필 없는 인증 사용자 → 온보딩 (proxy.ts에서 제거된 체크를 여기서 처리)
  if (!profile) redirect("/onboarding");

  const role = profile?.role;

  if (role === "parent") {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <ParentDashboardServer userId={user.id} name={profile?.name ?? "보호자"} />
      </Suspense>
    );
  }

  if (role === "scout") {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <ScoutHomeServer userId={user.id} isVerified={profile?.is_verified ?? false} />
      </Suspense>
    );
  }

  return (
    <div className="px-4 pt-4">
      <Suspense fallback={<PlayerFeedSkeleton />}>
        <PlayerFeed userId={user.id} />
      </Suspense>
    </div>
  );
}
