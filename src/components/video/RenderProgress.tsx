"use client";

import { useEffect, useRef } from "react";
import { useRenderJob, type RenderJobStatus } from "@/hooks/useRenderJob";

interface RenderProgressProps {
  jobId: string | null;
  onComplete?: (outputKey: string) => void;
  onError?: (error: string) => void;
}

const STATUS_TEXT: Record<RenderJobStatus, string> = {
  queued: "대기 중...",
  processing: "영상을 렌더링하고 있어요",
  done: "완료!",
  failed: "렌더링 실패",
};

export default function RenderProgress({
  jobId,
  onComplete,
  onError,
}: RenderProgressProps) {
  const { job } = useRenderJob(jobId);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    if (job?.status === "done" && job.output_key && onComplete) {
      calledRef.current = true;
      onComplete(job.output_key);
    }
    if (job?.status === "failed" && job.error && onError) {
      calledRef.current = true;
      onError(job.error);
    }
  }, [job?.status, job?.output_key, job?.error, onComplete, onError]);

  if (!jobId || !job) return null;

  const isDone = job.status === "done";
  const isFailed = job.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm">
      <div className="flex w-72 flex-col items-center gap-5 rounded-2xl border border-white/[0.06] bg-card p-8">
        {/* 아이콘 */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          {isDone ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A853"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isFailed ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F87171"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/10 border-t-accent" />
          )}
        </div>

        {/* 상태 텍스트 */}
        <p className="text-center text-[15px] font-semibold text-text-1">
          {STATUS_TEXT[job.status]}
        </p>

        {/* 프로그레스 바 */}
        {!isDone && !isFailed && (
          <div className="w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[12px] text-text-3">
              {job.progress}%
            </p>
          </div>
        )}

        {/* 실패 시 에러 메시지 */}
        {isFailed && job.error && (
          <p className="text-center text-[12px] text-red-400">{job.error}</p>
        )}
      </div>
    </div>
  );
}
