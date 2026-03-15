"use client";

import { useEffect, useRef } from "react";
import { useRenderJob, type RenderJobStatus } from "@/hooks/useRenderJob";

interface RenderProgressProps {
  jobId: string | null;
  onComplete?: (outputKey: string) => void;
  onError?: (error: string) => void;
  onRetry?: () => void;
  onBackToEdit?: () => void;
}

const STATUS_TEXT: Record<RenderJobStatus, string> = {
  queued: "대기 중...",
  processing: "영상을 처리하고 있어요",
  done: "완료!",
  failed: "영상 처리에 실패했어요",
};

export default function RenderProgress({
  jobId,
  onComplete,
  onError,
  onRetry,
  onBackToEdit,
}: RenderProgressProps) {
  const { job } = useRenderJob(jobId);
  const calledRef = useRef(false);

  useEffect(() => {
    calledRef.current = false;
  }, [jobId]);

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

  if (!jobId) return null;

  if (!job) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm">
        <div className="flex w-72 flex-col items-center gap-5 rounded-2xl border border-white/[0.06] bg-card p-8">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/10 border-t-accent" />
          <p className="text-center text-[15px] font-semibold text-text-1">
            렌더 상태를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

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

        {/* 실패 시 에러 메시지 + 액션 버튼 */}
        {isFailed && (
          <>
            {job.error && (
              <p className="text-center text-[12px] text-red-400">{job.error}</p>
            )}
            <p className="text-center text-[11px] text-text-3">
              잠시 후 다시 시도하거나, 편집 설정을 변경해보세요
            </p>
            <div className="flex w-full gap-2">
              {onBackToEdit && (
                <button
                  type="button"
                  onClick={onBackToEdit}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-[#1E1E22] py-2.5 text-[13px] font-semibold text-text-2 active:scale-[0.99]"
                >
                  편집으로 돌아가기
                </button>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-[13px] font-bold text-bg active:scale-[0.99]"
                >
                  다시 시도
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
