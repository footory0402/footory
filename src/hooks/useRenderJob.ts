"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type RenderJobStatus = "queued" | "processing" | "done" | "failed";

export interface RenderJob {
  id: string;
  clip_id: string;
  status: RenderJobStatus;
  progress: number;
  error: string | null;
  output_key: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Supabase Realtime으로 render_job 상태를 구독
 *
 * @param jobId - render_jobs.id (null이면 구독하지 않음)
 */
export function useRenderJob(jobId: string | null) {
  const [job, setJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(false);

  // 초기 로드
  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/render/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    fetchJob();
  }, [fetchJob]);

  // Realtime이 없거나 지연되는 환경에서도 상태가 갱신되도록 polling fallback 유지
  useEffect(() => {
    if (!jobId) return;
    if (job?.status === "done" || job?.status === "failed") return;

    const intervalId = window.setInterval(() => {
      void fetchJob();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [fetchJob, job?.status, jobId]);

  // Realtime 구독
  useEffect(() => {
    if (!jobId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`render:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "render_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new as RenderJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading, refetch: fetchJob };
}
