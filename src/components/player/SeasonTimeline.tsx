import type { Season } from "@/lib/types";

interface SeasonTimelineProps {
  seasons: Season[];
}

export default function SeasonTimeline({ seasons }: SeasonTimelineProps) {
  if (seasons.length === 0) return null;

  // Sort: current seasons first, then by year descending
  const sorted = [...seasons].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.year - a.year;
  });

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute top-2 left-2 bottom-2 w-px bg-border" />

      {sorted.map((season, i) => {
        const isCurrent = season.isCurrent === true;

        return (
          <div
            key={season.id}
            className="animate-fade-up relative pb-5 last:pb-0"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Dot: filled accent for current, hollow gray for past */}
            <div
              className="absolute left-[-18px] top-1.5 h-2.5 w-2.5 rounded-full border-2"
              style={{
                borderColor: isCurrent ? "var(--color-accent)" : "#71717A",
                background: isCurrent ? "var(--color-accent)" : "var(--color-bg)",
              }}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-stat text-[16px] font-bold ${
                    isCurrent ? "text-text-1" : "text-text-3"
                  }`}
                >
                  {season.year}
                </span>
                <span
                  className={`text-[12px] ${
                    isCurrent ? "text-accent" : "text-text-3"
                  }`}
                >
                  {season.teamName}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[9px] font-bold text-accent">
                    현재 소속
                  </span>
                ) : (
                  <span className="text-[10px] text-text-3">(졸업)</span>
                )}
              </div>
              <div
                className={`flex flex-wrap gap-3 text-[12px] ${
                  isCurrent ? "text-text-2" : "text-text-3"
                }`}
              >
                {season.gamesPlayed != null && (
                  <span>
                    <span
                      className={`font-stat font-semibold ${
                        isCurrent ? "text-text-1" : "text-text-3"
                      }`}
                    >
                      {season.gamesPlayed}
                    </span>{" "}
                    경기
                  </span>
                )}
                {season.goals != null && (
                  <span>
                    <span
                      className={`font-stat font-semibold ${
                        isCurrent ? "text-text-1" : "text-text-3"
                      }`}
                    >
                      {season.goals}
                    </span>{" "}
                    골
                  </span>
                )}
                {season.assists != null && (
                  <span>
                    <span
                      className={`font-stat font-semibold ${
                        isCurrent ? "text-text-1" : "text-text-3"
                      }`}
                    >
                      {season.assists}
                    </span>{" "}
                    어시
                  </span>
                )}
              </div>
              {season.notes && (
                <span
                  className={`mt-0.5 text-[11px] ${
                    isCurrent ? "text-text-2" : "text-text-3"
                  }`}
                >
                  {season.notes}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
