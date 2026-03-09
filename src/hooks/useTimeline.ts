"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

interface TimelineEventRow {
  id: string;
  profile_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  clip_id: string | null;
  created_at: string;
}

function toTimelineEvent(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    profileId: row.profile_id,
    eventType: row.event_type as TimelineEventType,
    eventData: row.event_data ?? {},
    clipId: row.clip_id ?? undefined,
    createdAt: row.created_at,
  };
}

interface UseTimelineOptions {
  enabled?: boolean;
}

export function useTimeline(profileId?: string, { enabled = true }: UseTimelineOptions = {}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(enabled);
  const hasFetchedRef = useRef(false);

  const fetchTimeline = useCallback(async () => {
    hasFetchedRef.current = true;
    try {
      setLoading(true);
      const url = profileId
        ? `/api/timeline?profile_id=${profileId}`
        : "/api/timeline";
      const res = await fetch(url);
      if (!res.ok) return;
      const data: TimelineEventRow[] = await res.json();
      setEvents(data.map(toTimelineEvent));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;
    void fetchTimeline();
  }, [enabled, fetchTimeline]);

  return { events, loading, refetch: fetchTimeline };
}
