"use client";

import { TIMELINE_EVENT_CONFIG, formatTimelineDate } from "@/lib/timeline";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

interface GrowthTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

export default function GrowthTimeline({ events, loading }: GrowthTimelineProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-card-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-card-alt" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-card-alt" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-[12px] text-text-3">
        아직 기록된 성장 이벤트가 없습니다
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {events.map((event, i) => {
        const config = TIMELINE_EVENT_CONFIG[event.eventType as TimelineEventType];
        if (!config) return null;

        const title = config.getTitle(event.eventData);

        return (
          <div
            key={event.id}
            className="animate-fade-up relative mb-4 last:mb-0"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Dot */}
            <div
              className="absolute -left-6 top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-card text-[11px]"
              style={{
                border: "2px solid var(--color-border)",
              }}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="ml-2">
              <p className="text-[13px] font-medium text-text-1">{title}</p>
              <p className="mt-0.5 text-[11px] text-text-3">
                {formatTimelineDate(event.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
