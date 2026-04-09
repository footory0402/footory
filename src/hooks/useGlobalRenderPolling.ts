"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Global render job polling hook.
 * Runs in AppShell so it persists across page navigations.
 * Polls /api/render/[id] every 3s + Supabase Realtime subscription.
 */
export function useGlobalRenderPolling() {
  const status = useUploadStore((s) => s.status);
  const renderJobId = useUploadStore((s) => s.renderJobId);
  const calledRef = useRef(false);
  const lastRealtimeUpdateRef = useRef<number>(0);

  const handleJobUpdate = useCallback((job: Record<string, unknown>) => {
    if (calledRef.current) return;

    const store = useUploadStore.getState();

    if (typeof job.progress === "number") {
      store.setRenderProgress(job.progress);
    }

    if (job.status === "done") {
      calledRef.current = true;
      store.setProgress(100);
      store.setStatus("done");
      toast.success("업로드 완료!", {
        description: "영상이 프로필에 추가되었어요",
      });
    } else if (job.status === "failed") {
      calledRef.current = true;
      store.setError(
        typeof job.error === "string" ? job.error : "영상 처리에 실패했어요"
      );
      store.setStatus("error");
      toast.error("업로드 실패", {
        description: "탭하여 다시 시도해주세요",
      });
    }
  }, []);

  // Reset called flag when jobId changes
  useEffect(() => {
    calledRef.current = false;
    lastRealtimeUpdateRef.current = 0;
  }, [renderJobId]);

  // Polling fallback: Realtime이 주 수단이고, 폴링은 느리게 보조한다.
  useEffect(() => {
    if (status !== "rendering" || !renderJobId) return;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRealtimeUpdateRef.current < 15_000) return;

      try {
        const res = await fetch(`/api/render/${renderJobId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { job } = await res.json();
        handleJobUpdate(job);
      } catch {
        // silently ignore polling errors
      }
    };

    // Initial fetch
    poll();

    const intervalId = window.setInterval(poll, 10_000);
    return () => window.clearInterval(intervalId);
  }, [handleJobUpdate, renderJobId, status]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (status !== "rendering" || !renderJobId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`global-render:${renderJobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "render_jobs",
          filter: `id=eq.${renderJobId}`,
        },
        (payload) => {
          lastRealtimeUpdateRef.current = Date.now();
          handleJobUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleJobUpdate, renderJobId, status]);
}
