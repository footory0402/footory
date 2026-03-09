import { SectionCard } from "@/components/ui/Card";
import SeasonTimeline from "./SeasonTimeline";
import MyTeamSection from "./MyTeamSection";
import EmptyCTA from "@/components/ui/EmptyCTA";
import type { Season } from "@/lib/types";

interface RecordsTabProps {
  seasons: Season[];
  onAddSeason?: () => void;
}

export default function RecordsTab({ seasons, onAddSeason }: RecordsTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* My Team */}
      <MyTeamSection />

      {/* Season History */}
      <SectionCard title="시즌 기록" icon="📅" onEdit={onAddSeason}>
        {seasons.length > 0 ? (
          <SeasonTimeline seasons={seasons} />
        ) : (
          <EmptyCTA text="시즌 기록을 추가하세요" onAction={onAddSeason} />
        )}
      </SectionCard>
    </div>
  );
}
