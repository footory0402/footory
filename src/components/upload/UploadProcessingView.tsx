"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUploadStore, type UploadStatus } from "@/stores/upload-store";

interface UploadProcessingViewProps {
  onRetry: () => void;
  onReset: () => void;
}

type StageState = "done" | "active" | "pending" | "error";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "길이 확인 중";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getCurrentLabel(status: UploadStatus, error: string | null) {
  switch (status) {
    case "composing":
      return "원본을 업로드용으로 준비하고 있어요.";
    case "uploading":
    case "uploading_raw":
      return "원본 영상을 업로드하고 있어요.";
    case "saving":
      return "업로드 메타데이터를 저장하고 있어요.";
    case "analyzing":
      return "single clip 편집 화면을 준비하는 중이에요.";
    case "error":
      return error ?? "업로드 중 문제가 발생했어요.";
    default:
      return "업로드를 시작하는 중이에요.";
  }
}

function resolveStages({
  status,
  duration,
  clipId,
  draftReady,
}: {
  status: UploadStatus;
  duration: number | null;
  clipId: string | null;
  draftReady: boolean;
}) {
  const metadataState: StageState = status === "error"
    ? "error"
    : duration != null
      ? "done"
      : "active";

  const uploadState: StageState = status === "error"
    ? "error"
    : draftReady || status === "analyzing" || status === "done" || (status === "idle" && !!clipId)
      ? "done"
      : status === "uploading" || status === "uploading_raw" || status === "saving" || status === "composing"
        ? "active"
        : "pending";

  const analysisState: StageState = status === "error"
    ? "error"
    : draftReady
      ? "done"
      : status === "analyzing"
        ? "active"
        : "pending";

  return [
    {
      key: "metadata",
      title: "메타데이터 확인",
      description: "길이와 기본 업로드 정보를 정리합니다.",
      state: metadataState,
    },
    {
      key: "upload",
      title: "원본 업로드",
      description: "원본은 그대로 저장하고 이후 단계에서 재사용합니다.",
      state: uploadState,
    },
    {
      key: "analysis",
      title: "편집 화면 준비",
      description: "single clip preview와 기본 편집값을 정리합니다.",
      state: analysisState,
    },
  ];
}

function StageBadge({ state }: { state: StageState }) {
  if (state === "done") {
    return (
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-2 text-[10px] font-semibold text-accent">
        완료
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/8 px-2 text-[10px] font-semibold text-text-1">
        진행 중
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500/15 px-2 text-[10px] font-semibold text-red-300">
        실패
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/[0.05] px-2 text-[10px] font-semibold text-text-3">
      대기
    </span>
  );
}

export default function UploadProcessingView({ onRetry, onReset }: UploadProcessingViewProps) {
  const router = useRouter();
  const file = useUploadStore((state) => state.file);
  const progress = useUploadStore((state) => state.progress);
  const status = useUploadStore((state) => state.status);
  const duration = useUploadStore((state) => state.duration);
  const clipId = useUploadStore((state) => state.clipId);
  const error = useUploadStore((state) => state.error);
  const editorDraft = useUploadStore((state) => state.editorDraft);

  const stages = useMemo(
    () => resolveStages({
      status,
      duration,
      clipId,
      draftReady: !!editorDraft,
    }),
    [clipId, duration, editorDraft, status],
  );
  const editorHref = (() => {
    if (!clipId) return null;
    const params = new URLSearchParams();
    params.set("from", "upload");
    if (editorDraft?.projectId) {
      params.set("projectId", editorDraft.projectId);
    }

    return `/edit/${clipId}?${params.toString()}`;
  })();
  const canEnterEditor = Boolean(editorHref)
    && (status === "done" || status === "analyzing" || !!editorDraft);

  if (!file) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-text-2">
          2
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-text-1">업로드 처리</h1>
          <p className="text-[12px] text-text-3">원본 저장과 기본 제안 생성을 순서대로 진행합니다.</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1 w-6 rounded-full bg-accent" />
          <div className="h-1 w-6 rounded-full bg-accent/50" />
          <div className="h-1 w-6 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 pb-28">
        <div className="rounded-3xl border border-white/[0.06] bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-text-1">{file.name}</p>
              <p className="mt-1 text-[12px] text-text-3">
                {formatBytes(file.size)} · {formatDuration(duration)}
              </p>
            </div>
            <div className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
              {Math.max(progress, status === "analyzing" ? 100 : 0)}%
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === "error" ? "bg-red-400" : "bg-accent"
              }`}
              style={{ width: `${Math.max(progress, status === "analyzing" ? 100 : 6)}%` }}
            />
          </div>

          <p className={`mt-3 text-[13px] leading-6 ${status === "error" ? "text-red-300" : "text-text-2"}`}>
            {getCurrentLabel(status, error)}
          </p>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-text-1">
                    {index + 1}. {stage.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-text-3">{stage.description}</p>
                </div>
                <StageBadge state={stage.state} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-accent/15 bg-accent/8 p-4">
          <p className="text-[12px] font-semibold text-accent">이번 단계에서는 원본과 제안 초안만 만듭니다.</p>
          <p className="mt-1 text-[11px] leading-5 text-text-3">
            다음 화면에서는 clip 하나만 기준으로 trim, spotlight, zoom, overlay, highlight range만 다룹니다.
          </p>
        </div>

        {status === "error" ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-2xl bg-accent py-3.5 text-[14px] font-bold text-bg active:scale-[0.99]"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-2xl border border-white/[0.08] bg-card py-3.5 text-[14px] font-medium text-text-1 active:scale-[0.99]"
            >
              다른 파일 선택
            </button>
          </div>
        ) : canEnterEditor ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(editorHref!)}
              className="flex-1 rounded-2xl bg-accent py-3.5 text-[14px] font-bold text-bg active:scale-[0.99]"
            >
              편집 화면으로 이동
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium text-text-2 active:scale-[0.99]"
            >
              다른 파일 선택
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-2xl border border-white/[0.08] bg-card py-3.5 text-[14px] font-medium text-text-2 active:scale-[0.99]"
          >
            다른 파일 선택
          </button>
        )}
      </div>
    </div>
  );
}
