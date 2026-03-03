import type { Season } from "@/lib/types";

interface SeasonTimelineProps {
  seasons: Season[];
}

export default function SeasonTimeline({ seasons }: SeasonTimelineProps) {
  if (seasons.length === 0) return null;

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute top-2 left-2 bottom-2 w-px bg-border" />

      {seasons.map((season, i) => (
        <div key={season.id} className="animate-fade-up relative pb-5 last:pb-0" style={{ animationDelay: `${i * 0.08}s` }}>
          {/* Dot */}
          <div
            className="absolute left-[-18px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent"
            style={{ background: i === 0 ? "#D4A853" : "var(--color-bg)" }}
          />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-stat text-[16px] font-bold text-text-1">{season.year}</span>
              <span className="text-[12px] text-accent">{season.teamName}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[12px] text-text-2">
              {season.gamesPlayed != null && (
                <span><span className="font-stat font-semibold text-text-1">{season.gamesPlayed}</span> 경기</span>
              )}
              {season.goals != null && (
                <span><span className="font-stat font-semibold text-text-1">{season.goals}</span> 골</span>
              )}
              {season.assists != null && (
                <span><span className="font-stat font-semibold text-text-1">{season.assists}</span> 어시</span>
              )}
            </div>
            {season.notes && (
              <span className="mt-0.5 text-[11px] text-text-3">{season.notes}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
