"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadStore, type UploadStatus } from "@/stores/upload-store";

interface UploadProcessingViewProps {
  onRetry: () => void;
  onReset: () => void;
  onSaveNow: () => Promise<void> | void;
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
      return "영상 정보를 확인하고 있어요.";
    case "uploading":
    case "uploading_raw":
      return "영상 파일을 올리고 있어요.";
    case "saving":
      return "저장에 필요한 정보를 정리하고 있어요.";
    case "analyzing":
      return "이제 편집하거나 바로 저장할 수 있게 준비하고 있어요.";
    case "error":
      return error ?? "업로드 중 문제가 생겼어요.";
    default:
      return "업로드를 시작하고 있어요.";
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

  const choiceState: StageState = status === "error"
    ? "error"
    : draftReady
      ? "done"
      : status === "analyzing"
        ? "active"
        : "pending";

  return [
    { key: "metadata", title: "영상 확인", state: metadataState },
    { key: "upload", title: "올리는 중", state: uploadState },
    { key: "choice", title: "저장 선택", state: choiceState },
  ];
}

function StageDot({ state, label, showConnector }: { state: StageState; label: string; showConnector: boolean }) {
  const isDone = state === "done";
  const isActive = state === "active";
  const isError = state === "error";

  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            isDone
              ? "bg-accent text-[#09090b]"
              : isActive
                ? "bg-white/[0.08] text-text-1 ring-1 ring-accent/30"
                : isError
                  ? "bg-red-500/15 text-red-200"
                  : "bg-white/[0.05] text-text-3"
          }`}
        >
          {isDone ? "✓" : isError ? "!" : ""}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-text-1">{label}</p>
          <p className="text-[10px] text-text-3">
            {isDone ? "완료" : isActive ? "진행 중" : isError ? "실패" : "대기"}
          </p>
        </div>
      </div>
      {showConnector ? (
        <div className={`h-[2px] flex-1 rounded-full ${isDone ? "bg-accent/50" : "bg-white/[0.08]"}`} />
      ) : null}
    </div>
  );
}

export default function UploadProcessingView({
  onRetry,
  onReset,
  onSaveNow,
}: UploadProcessingViewProps) {
  const router = useRouter();
  const file = useUploadStore((state) => state.file);
  const progress = useUploadStore((state) => state.progress);
  const status = useUploadStore((state) => state.status);
  const duration = useUploadStore((state) => state.duration);
  const clipId = useUploadStore((state) => state.clipId);
  const error = useUploadStore((state) => state.error);
  const editorDraft = useUploadStore((state) => state.editorDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
  const readyForChoice = Boolean(editorHref)
    && (status === "done" || status === "analyzing" || !!editorDraft);
  const canSaveNow = Boolean(clipId)
    && (readyForChoice || !!editorDraft);
  const progressValue = Math.max(progress, status === "analyzing" || readyForChoice ? 100 : 6);

  if (!file) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709]">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-text-1">
              {readyForChoice ? "올리기는 끝났어요" : "영상을 올리고 있어요"}
            </h1>
            <p className="mt-1 text-[12px] leading-5 text-text-3">
              {readyForChoice ? "이대로 저장하거나, 필요한 것만 편집할 수 있어요." : getCurrentLabel(status, error)}
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-text-2"
          >
            다른 영상
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 pb-28">
        <div className="rounded-3xl border border-white/[0.06] bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-text-1">{file.name}</p>
              <p className="mt-1 text-[12px] text-text-3">
                {formatBytes(file.size)} · {formatDuration(duration)}
              </p>
            </div>
            <div className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
              {progressValue}%
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === "error" ? "bg-red-400" : "bg-accent"
              }`}
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <div className="mt-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
            {stages.map((stage, index) => (
              <StageDot
                key={stage.key}
                state={stage.state}
                label={stage.title}
                showConnector={index < stages.length - 1}
              />
            ))}
          </div>
        </div>

        {saveMessage ? (
          <div className={`rounded-2xl border p-4 text-[12px] leading-5 ${
            saveState === "error"
              ? "border-red-400/20 bg-red-500/10 text-red-200"
              : "border-accent/20 bg-accent/10 text-[#f5ddb1]"
          }`}>
            {saveMessage}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-2xl bg-accent py-3.5 text-[14px] font-bold text-bg active:scale-[0.99]"
            >
              다시 올리기
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-2xl border border-white/[0.08] bg-card py-3.5 text-[14px] font-medium text-text-1 active:scale-[0.99]"
            >
              다른 영상 고르기
            </button>
          </div>
        ) : readyForChoice ? (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  setSaveState("saving");
                  setSaveMessage(null);
                  await onSaveNow();
                } catch (saveError) {
                  setSaveState("error");
                  setSaveMessage(
                    saveError instanceof Error
                      ? saveError.message
                      : "지금은 바로 저장하지 못했어요. 편집으로 들어가서 다시 저장해보세요.",
                  );
                }
              }}
              disabled={saveState === "saving" || !canSaveNow}
              className="w-full rounded-2xl bg-accent py-3.5 text-[15px] font-bold text-bg disabled:opacity-60"
            >
              {saveState === "saving" ? "저장 중..." : "이대로 저장"}
            </button>
            <button
              type="button"
              onClick={() => router.push(editorHref!)}
              className="w-full rounded-2xl border border-white/[0.08] bg-card py-3.5 text-[14px] font-medium text-text-1 active:scale-[0.99]"
            >
              편집하고 저장
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-accent/15 bg-accent/8 p-4">
            <p className="text-[12px] font-semibold text-accent">업로드가 끝나면 바로 저장하거나 편집하고 저장할 수 있어요.</p>
            <p className="mt-1 text-[11px] leading-5 text-text-3">
              지금은 영상만 올리고 있으니 잠시만 기다려주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
