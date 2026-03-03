import { SectionCard } from "@/components/ui/Card";
import StatRow from "./StatRow";
import MedalBadge from "./MedalBadge";
import SeasonTimeline from "./SeasonTimeline";
import { MEASUREMENTS } from "@/lib/constants";
import type { Stat, Medal, Season } from "@/lib/types";

interface RecordsTabProps {
  stats: Stat[];
  medals: Medal[];
  seasons: Season[];
  onAddStat?: () => void;
}

export default function RecordsTab({ stats, medals, seasons, onAddStat }: RecordsTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Measurement Records */}
      <SectionCard title="측정 기록" icon="📊" onEdit={onAddStat}>
        {stats.length > 0 ? (
          <div className="divide-y divide-[var(--divider)]">
            {stats.map((stat) => {
              const m = MEASUREMENTS.find((m) => m.id === stat.type);
              return (
                <StatRow
                  key={stat.id}
                  icon={m?.icon ?? "📊"}
                  label={m?.label ?? stat.type}
                  value={stat.value}
                  unit={stat.unit}
                  previousValue={stat.previousValue}
                  verified={stat.verified}
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
      <SectionCard title="시즌 기록" icon="📅" onEdit={() => {}}>
        {seasons.length > 0 ? (
          <SeasonTimeline seasons={seasons} />
        ) : (
          <EmptyCTA text="시즌 기록을 추가하세요" />
        )}
      </SectionCard>
    </div>
  );
}

function EmptyCTA({ text, onAction }: { text: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-[var(--accent-bg)] py-6">
      <span className="text-[12px] text-text-3">{text}</span>
      <button
        onClick={onAction}
        className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-bg"
        style={{ background: "var(--accent-gradient)" }}
      >
        추가하기
      </button>
    </div>
  );
}
