import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage } from "@/lib/server/feed";
import ParentHomeSection from "@/components/parent/ParentHomeSection";

const FeedList = dynamic(() => import("@/components/feed/FeedList"), {
  loading: () => (
    <div className="flex flex-col gap-3 pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[12px] bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-card-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-card-alt" />
              <div className="h-2.5 w-16 rounded bg-card-alt" />
            </div>
          </div>
          <div className="aspect-video w-full rounded-[10px] bg-card-alt" />
        </div>
      ))}
    </div>
  ),
});

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Profile role + initial feed in parallel — no waterfall
  const [profileRes, feedData] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    fetchFeedPage(supabase, user.id),
  ]);

  const isParent = profileRes.data?.role === "parent";

  return (
    <div className="px-4 pt-2">
      {isParent && <ParentHomeSection />}
      <FeedList
        initialItems={feedData.items}
        initialNextCursor={feedData.nextCursor}
      />
    </div>
  );
}
