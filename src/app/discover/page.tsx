import { createClient } from "@/lib/supabase/server";
import HotHighlights from "@/components/discover/HotHighlights";
import RecentMedals from "@/components/discover/RecentMedals";
import RecommendedPlayers from "@/components/discover/RecommendedPlayers";
import PopularTeams from "@/components/discover/PopularTeams";
import DiscoverSearch from "@/components/discover/DiscoverSearch";

export const revalidate = 60;

async function fetchDiscoverData() {
  const supabase = await createClient();

  const [highlightsRes, medalsRes, playersRes, teamsRes] = await Promise.all([
    supabase
      .from("feed_items")
      .select("*, profiles!feed_items_profile_id_fkey(id, handle, name, avatar_url, position, level)")
      .eq("type", "highlight")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("medals")
      .select("*, profiles!medals_profile_id_fkey(id, handle, name, avatar_url, position, level)")
      .order("achieved_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, handle, name, avatar_url, position, level, city, birth_year")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("teams")
      .select("id, handle, name, logo_url, city, team_members(count)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const teams = (teamsRes.data ?? []).map((t) => {
    const { team_members, ...rest } = t as Record<string, unknown>;
    const members = team_members as { count: number }[] | undefined;
    return { ...rest, member_count: members?.[0]?.count ?? 0 };
  });

  return {
    highlights: highlightsRes.data ?? [],
    medals: medalsRes.data ?? [],
    players: playersRes.data ?? [],
    teams,
  };
}

export default async function DiscoverPage() {
  const data = await fetchDiscoverData();

  return (
    <div className="px-4 pt-4 pb-24">
      <DiscoverSearch />

      <div className="mt-6 space-y-6">
        <Section title="인기 하이라이트" emoji="🔥">
          <HotHighlights items={data.highlights} loading={false} />
        </Section>

        <Section title="최근 메달" emoji="🏅">
          <RecentMedals medals={data.medals} loading={false} />
        </Section>

        <Section title="추천 선수" emoji="⭐">
          <RecommendedPlayers players={data.players} loading={false} />
        </Section>

        <Section title="인기 팀" emoji="🏟">
          <PopularTeams teams={data.teams} loading={false} />
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
