import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage } from "@/lib/server/feed";
import FeedList from "@/components/feed/FeedList";
import ParentHomeSection from "@/components/parent/ParentHomeSection";

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
