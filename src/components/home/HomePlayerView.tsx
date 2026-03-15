"use client";

import type { FeedItemEnriched } from "@/hooks/useFeed";
import type { MvpLeaderData } from "@/lib/server/feed";
import MvpTeaser from "@/components/mvp/MvpTeaser";
import ChallengeBanner from "@/components/challenge/ChallengeBanner";
import FeedListClient from "@/components/feed/FeedList";

interface HomePlayerViewProps {
  mvpLeader: MvpLeaderData | null;
  initialFeedItems: FeedItemEnriched[];
  initialNextCursor: string | null;
  showNudge: boolean;
}

export default function HomePlayerView({
  mvpLeader,
  initialFeedItems,
  initialNextCursor,
  showNudge,
}: HomePlayerViewProps) {
  return (
    <div className="px-4 pt-2">
      <MvpTeaser leader={mvpLeader} />
      <ChallengeBanner />
      <FeedListClient
        initialItems={initialFeedItems}
        initialNextCursor={initialNextCursor}
        showNudge={showNudge}
      />
    </div>
  );
}
