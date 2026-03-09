import { SectionCard } from "@/components/ui/Card";
import StatRow from "./StatRow";
import MedalBadge from "./MedalBadge";
import SeasonTimeline from "./SeasonTimeline";
import { MEASUREMENTS } from "@/lib/constants";
import EmptyCTA from "@/components/ui/EmptyCTA";
import type { Stat, Medal, Season } from "@/lib/types";

interface RecordsTabProps {
  stats: Stat[];
  medals: Medal[];
  seasons: Season[];
  onAddStat?: () => void;
  onAddSeason?: () => void;
}

export default function RecordsTab({ stats, medals, seasons, onAddStat, onAddSeason }: RecordsTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Measurement Records */}
      <SectionCard title="측정 기록" icon="📊" onEdit={onAddStat}>
        {stats.length > 0 ? (
          <div>
            {stats.map((stat) => {
              const m = MEASUREMENTS.find((m) => m.id === stat.type);
              return (
                <StatRow
                  key={stat.id}
                  icon={m?.icon ?? "📊"}
                  label={m?.label ?? stat.type}
                  value={stat.value}
                  unit={stat.unit}
                  type={stat.type}
                  previousValue={stat.previousValue}
                  verified={stat.verified}
                  lowerIsBetter={m?.lowerIsBetter}
                />
              );
            })}
          </div>
        ) : (
          <EmptyCTA text="측정 기록을 추가하세요" onAction={onAddStat} />
        )}
      </SectionCard>

      {/* All Medals */}
      <SectionCard title="메달" icon="🏅">
        {medals.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {medals.map((medal, i) => (
              <div key={medal.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <MedalBadge label={medal.label} value={medal.value} unit={medal.unit} verified={medal.verified} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-[12px] text-text-3">아직 획득한 메달이 없습니다</p>
        )}
      </SectionCard>

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

