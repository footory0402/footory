import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage, fetchMvpLeader, hasUserUploadedClips } from "@/lib/server/feed";
import { isPocAdminUser } from "@/lib/poc-admin";
import MvpTeaser from "@/components/mvp/MvpTeaser";
import ChallengeBanner from "@/components/challenge/ChallengeBanner";

const ChildDashboard = dynamic(() => import("@/components/parent/ChildDashboard"));
const ScoutHome = dynamic(() => import("@/components/scout/ScoutHome"));

const FeedList = dynamic(() => import("@/components/feed/FeedList"), {
  loading: () => (
    <div className="flex flex-col gap-3 pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-4 animate-pulse">
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
  ),
});

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isPocAdminUser(user)) redirect("/admin/video-lab");

  const profileRes = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profileRes.data?.role;
  const isParent = role === "parent";

  // Parent gets a dedicated dashboard — no feed/MVP
  if (isParent) {
    return <ChildDashboard />;
  }

  // Scout gets an optimized discovery-focused home
  const isScout = role === "scout";
  if (isScout) {
    return <ScoutHome />;
  }

  // Player/coach: normal feed home
  const [feedData, hasClips, mvpLeader] = await Promise.all([
    fetchFeedPage(supabase, user.id),
    hasUserUploadedClips(supabase, user.id),
    fetchMvpLeader(supabase),
  ]);

  return (
    <div className="px-4 pt-4 pb-24">
      {/* MVP Teaser — server-fetched, renders immediately */}
      <MvpTeaser leader={mvpLeader} />

      {/* Weekly Challenge Banner */}
      <ChallengeBanner />

      {/* Recommended Feed with upload nudge for new users */}
      <FeedList
        initialItems={feedData.items}
        initialNextCursor={feedData.nextCursor}
        showNudge={!hasClips}
      />
    </div>
  );
}
