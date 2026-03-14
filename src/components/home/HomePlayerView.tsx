"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PillTabs from "@/components/ui/PillTabs";
import type { FeedItemEnriched } from "@/hooks/useFeed";
import type { MvpLeaderData } from "@/lib/server/feed";
import MvpTeaser from "@/components/mvp/MvpTeaser";
import ChallengeBanner from "@/components/challenge/ChallengeBanner";
import FeedListClient from "@/components/feed/FeedList";

const MyRecordsTab = dynamic(() => import("@/components/home/MyRecordsTab"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 px-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-elevated p-4 h-24" />
        ))}
      </div>
    </div>
  ),
});

type HomeTab = "video" | "record";

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
  const [activeTab, setActiveTab] = useState<HomeTab>("video");

  return (
    <>
      <PillTabs
        tabs={[
          { key: "video" as HomeTab, label: "영상" },
          { key: "record" as HomeTab, label: "기록" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        sticky
      />

      {activeTab === "video" ? (
        <div className="px-4 pt-2">
          <MvpTeaser leader={mvpLeader} />
          <ChallengeBanner />
          <FeedListClient
            initialItems={initialFeedItems}
            initialNextCursor={initialNextCursor}
            showNudge={showNudge}
          />
        </div>
      ) : (
        <div className="px-4 pt-2">
          <MyRecordsTab />
        </div>
      )}
    </>
  );
}
