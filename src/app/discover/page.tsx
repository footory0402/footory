"use client";

import HotHighlights from "@/components/discover/HotHighlights";
import RecentMedals from "@/components/discover/RecentMedals";
import RecommendedPlayers from "@/components/discover/RecommendedPlayers";
import PopularTeams from "@/components/discover/PopularTeams";
import DiscoverSearch from "@/components/discover/DiscoverSearch";
import { useDiscoverHome } from "@/hooks/useDiscover";

export default function DiscoverPage() {
  const discover = useDiscoverHome();

  return (
    <div className="px-4 pt-4 pb-24">
      <DiscoverSearch />

      <div className="mt-6 space-y-6">
        <Section title="인기 하이라이트" emoji="🔥">
          <HotHighlights items={discover.highlights} loading={discover.loading} />
        </Section>

        <Section title="최근 메달" emoji="🏅">
          <RecentMedals medals={discover.medals} loading={discover.loading} />
        </Section>

        <Section title="추천 선수" emoji="⭐">
          <RecommendedPlayers players={discover.players} loading={discover.loading} />
        </Section>

        <Section title="인기 팀" emoji="🏟">
          <PopularTeams teams={discover.teams} loading={discover.loading} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-text-1">
          {emoji} {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
