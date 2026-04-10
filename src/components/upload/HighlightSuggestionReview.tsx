"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SingleClipEditorPreview from "@/components/upload/SingleClipEditorPreview";
import { getSkillTagsForPosition } from "@/lib/constants";
import { FOCUS_ZOOM_PRESETS } from "@/lib/focus-zoom";
import { publishSingleClipDraft, saveSingleClipDraft } from "@/lib/highlight-save";
import { useUploadGuide } from "@/hooks/useUploadGuide";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useUploadStore } from "@/stores/upload-store";
import {
  markSingleClipDraftPersisted,
  type SingleClipEditingDraft,
  updateSingleClipEditingDraft,
} from "@/lib/single-clip-playback";

interface HighlightSuggestionReviewProps {
  draft: SingleClipEditingDraft;
  videoSrc: string;
  onReset: () => void;
}

const TOOL_ORDER = ["trim", "focus", "overlay", "save"] as const;
type EditorTool = (typeof TOOL_ORDER)[number];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function formatDuration(start: number, end: number) {
  return formatTime(Math.max(0, end - start));
}

function isDraftStorageUnavailable(message: string) {
  return /video_projects|schema cache|relation .*video_projects/i.test(message);
}

function toFriendlySaveMessage(message: string, fallback: string) {
  if (isDraftStorageUnavailable(message)) {
    return fallback;
  }

  return message;
}

function ToolChip({
  active,
  step,
  label,
  onClick,
}: {
  active: boolean;
  step: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[68px] flex-col justify-between rounded-[24px] border px-3 py-3 text-left ${
        active
          ? "border-[#d8b36a]/35 bg-[#d8b36a]/12 text-[#f6d69a]"
          : "border-white/[0.08] bg-white/[0.03] text-text-2"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{step}</span>
      <span className="text-[13px] font-semibold">{label}</span>
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-3xl border p-4 text-left ${
        checked
          ? "border-[#d8b36a]/35 bg-[#d8b36a]/10"
          : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <div>
        <p className="text-[14px] font-semibold text-text-1">{title}</p>
        <p className="mt-1 text-[12px] leading-5 text-text-3">{description}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
          checked ? "bg-[#d8b36a] text-[#09090b]" : "bg-white/[0.08] text-text-2"
        }`}
      >
        {checked ? "켜짐" : "꺼짐"}
      </span>
    </button>
  );
}

export default function HighlightSuggestionReview({
  draft,
  videoSrc,
  onReset,
}: HighlightSuggestionReviewProps) {
  const router = useRouter();
  const { profile } = useProfileContext();
  const childName = useUploadStore((state) => state.childName);
  const storeTags = useUploadStore((state) => state.tags);
  const setEditorDraft = useUploadStore((state) => state.setEditorDraft);

  const [activeTool, setActiveTool] = useState<EditorTool>("trim");
  const [previewTime, setPreviewTime] = useState(draft.playback.trimStart);
  const [saveState, setSaveState] = useState<"idle" | "autosaving" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSummary, setSaveSummary] = useState<string | null>(null);
  const [draftSyncEnabled, setDraftSyncEnabled] = useState(true);
  const [draggingTrimHandle, setDraggingTrimHandle] = useState<"start" | "end" | null>(null);
  const [highlightEditorOverride, setHighlightEditorOverride] = useState<boolean | null>(null);
  const lastAutosaveKeyRef = useRef<string | null>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);
  const { guideStep, dismissStep, skipAll } = useUploadGuide();
  const safePreviewTime = Math.min(
    Math.max(previewTime, draft.playback.trimStart),
    draft.playback.trimEnd,
  );

  const toolIndex = TOOL_ORDER.indexOf(activeTool);
  const previousTool = toolIndex > 0 ? TOOL_ORDER[toolIndex - 1] : null;
  const nextTool = toolIndex < TOOL_ORDER.length - 1 ? TOOL_ORDER[toolIndex + 1] : null;

  const commitDraft = useCallback((updater: (current: SingleClipEditingDraft) => SingleClipEditingDraft) => {
    setEditorDraft(updateSingleClipEditingDraft(draft, updater));
    setSaveError(null);
    setSaveSummary(null);
  }, [draft, setEditorDraft]);

  useEffect(() => {
    if (draft.overlay.showProfileCard) return;
    setEditorDraft(updateSingleClipEditingDraft(draft, (current) => ({
      ...current,
      overlay: {
        ...current.overlay,
        showProfileCard: true,
      },
    })));
  }, [draft, setEditorDraft]);

  const playerName = childName ?? profile?.name ?? "PLAYER";
  const playerPosition = profile?.position ?? "FW";
  const playerData = {
    name: playerName,
    number: "",
    position: playerPosition,
    club: profile?.teamName ?? "Footory",
    clubFull: profile?.teamName ?? "Footory",
    age: profile?.birthYear ? `${new Date().getFullYear() - profile.birthYear}` : "",
    birthDate: profile?.birthYear ? `${profile.birthYear}` : "",
    height: profile?.heightCm ? `${profile.heightCm}` : "",
    weight: profile?.weightKg ? `${profile.weightKg}` : "",
    foot: profile?.preferredFoot ?? "",
    nationality: "KOREA",
    photoUrl: profile?.avatarUrl ?? "",
    mainColor: "#2f3c46",
    accentColor: "#d8b36a",
  };

  const tagOptions = useMemo(
    () => getSkillTagsForPosition(profile?.position ?? null),
    [profile?.position],
  );

  const toolDescription = activeTool === "trim"
    ? "구간만 정하면 돼요."
    : activeTool === "focus"
      ? "주인공만 한 번 찍어주세요."
      : activeTool === "overlay"
        ? "정보 표시만 정하면 돼요."
        : "저장만 고르면 끝나요.";
  const visibleGuide = guideStep === "flow"
    ? {
        title: "처음엔 순서대로만 가면 됩니다.",
        description: "구간 → 주인공 → 정보 → 저장 순서예요.",
        actionLabel: "알겠어요",
      }
    : guideStep === "focus" && activeTool === "focus"
      ? {
          title: "여기서는 선수만 한 번 누르세요.",
          description: "영상에서 선수를 누르면 주인공이 바로 정해집니다.",
          actionLabel: "해봤어요",
        }
      : null;
  const highlightEditorEnabled = highlightEditorOverride
    ?? (
      draft.playback.highlightStart !== draft.playback.trimStart
      || draft.playback.highlightEnd !== draft.playback.trimEnd
    );

  const handleTrimDrag = useCallback((
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    handle: "start" | "end",
  ) => {
    const bar = trimBarRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = Number((ratio * draft.sourceDurationSec).toFixed(1));

    if (handle === "start") {
      const nextStart = Math.min(time, draft.playback.trimEnd - 0.1);
      commitDraft((current) => ({
        ...current,
        playback: {
          ...current.playback,
          trimStart: nextStart,
        },
      }));
      setPreviewTime(nextStart);
      return;
    }

    const nextEnd = Math.max(time, draft.playback.trimStart + 0.1);
    commitDraft((current) => ({
      ...current,
      playback: {
        ...current.playback,
        trimEnd: nextEnd,
      },
    }));
    setPreviewTime(nextEnd);
  }, [commitDraft, draft.playback.trimEnd, draft.playback.trimStart, draft.sourceDurationSec]);

  const handleSave = async () => {
    setSaveState("saving");
    setSaveError(null);
    setSaveSummary(null);

    try {
      const result = await publishSingleClipDraft({
        draft,
        clipId: draft.clipId,
        existingTags: storeTags,
      });

      const latestDraft = useUploadStore.getState().editorDraft;
      const projectId = latestDraft?.projectId ?? draft.projectId;
      if (latestDraft && latestDraft.clipId === draft.clipId && projectId) {
        setEditorDraft(markSingleClipDraftPersisted(latestDraft, {
          projectId,
          projectStatus: "published",
        }));
      }
      setSaveSummary(
        result.publishTransition === "republished"
          ? `${result.connectionLabel}에 다시 반영했어요.`
          : `${result.connectionLabel}에 저장했어요.`,
      );
      useUploadStore.getState().reset();
      setSaveState("idle");
      router.replace("/profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setSaveState("error");
      setSaveError(toFriendlySaveMessage(message, "임시 저장 없이도 계속 편집할 수 있어요. 마지막에 다시 저장해보세요."));
    }
  };

  useEffect(() => {
    if (!draftSyncEnabled) return;

    const autosaveKey = JSON.stringify({
      projectId: draft.projectId,
      playback: draft.playback,
      overlay: draft.overlay,
      saveTarget: draft.saveTarget,
      lastEditedAt: draft.lastEditedAt,
    });

    if (lastAutosaveKeyRef.current === autosaveKey) return;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setSaveState((current) => (current === "saving" ? current : "autosaving"));
          const persistedDraft = await saveSingleClipDraft({ draft });
          lastAutosaveKeyRef.current = autosaveKey;

          const latestDraft = useUploadStore.getState().editorDraft;
          if (latestDraft && latestDraft.clipId === draft.clipId && persistedDraft.projectId) {
            setEditorDraft({
              ...latestDraft,
              projectId: persistedDraft.projectId,
              projectStatus: persistedDraft.projectStatus,
              lastSavedAt: persistedDraft.lastSavedAt,
            });
          }

          setSaveState((current) => (current === "saving" ? current : "idle"));
        } catch (error) {
          const message = error instanceof Error ? error.message : "임시 저장에 실패했습니다.";
          if (isDraftStorageUnavailable(message)) {
            setDraftSyncEnabled(false);
            lastAutosaveKeyRef.current = autosaveKey;
            setSaveState((current) => (current === "saving" ? current : "idle"));
            return;
          }

          setSaveState((current) => (current === "saving" ? current : "error"));
          setSaveError(toFriendlySaveMessage(message, "임시 저장은 잠시 멈췄어요. 마지막 저장은 계속할 수 있어요."));
        }
      })();
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [draft, draftSyncEnabled, setEditorDraft]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709]">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={onReset}
            aria-label="뒤로가기"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-text-1"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-text-1">영상 편집</h1>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-text-2">
                {toolIndex + 1}/{TOOL_ORDER.length}
              </span>
            </div>
            <p className="truncate text-[12px] text-text-3">{toolDescription}</p>
          </div>
          <div className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-text-2">
            {draft.projectStatus === "published"
              ? "저장됨"
              : !draftSyncEnabled
                ? "임시 저장 없음"
                : draft.lastSavedAt
                  ? "임시 저장됨"
                  : "편집 중"}
          </div>
        </div>

        <div className="px-4">
          <SingleClipEditorPreview
            videoSrc={videoSrc}
            draft={draft}
            playerData={playerData}
            previewTime={safePreviewTime}
            spotlightPicking={activeTool === "focus"}
            focusPreviewVisible={activeTool === "focus"}
            overlayPreviewVisible={activeTool === "overlay"}
            onPreviewTimeChange={setPreviewTime}
            onSpotlightChange={(spotlight) => {
              commitDraft((current) => ({
                ...current,
                playback: {
                  ...current.playback,
                  spotlight,
                  freezeAt: spotlight ? safePreviewTime : null,
                },
              }));
            }}
          />
        </div>

        <div className="px-4 pt-4">
          <div className="grid grid-cols-4 gap-2">
            <ToolChip active={activeTool === "trim"} step="1" label="구간" onClick={() => setActiveTool("trim")} />
            <ToolChip active={activeTool === "focus"} step="2" label="주인공" onClick={() => setActiveTool("focus")} />
            <ToolChip active={activeTool === "overlay"} step="3" label="정보" onClick={() => setActiveTool("overlay")} />
            <ToolChip active={activeTool === "save"} step="4" label="저장" onClick={() => setActiveTool("save")} />
          </div>
        </div>

        <div data-testid="single-clip-editor" className="flex-1 overflow-y-auto px-4 pb-36 pt-4">
          {visibleGuide ? (
            <div className="mb-4 rounded-3xl border border-[#d8b36a]/20 bg-[#d8b36a]/[0.08] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-[#f6d69a]">{visibleGuide.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-text-2">{visibleGuide.description}</p>
                </div>
                <button
                  type="button"
                  onClick={skipAll}
                  className="shrink-0 text-[11px] font-semibold text-text-3"
                >
                  닫기
                </button>
              </div>
              <button
                type="button"
                onClick={dismissStep}
                className="mt-3 rounded-full bg-[#d8b36a] px-3 py-2 text-[12px] font-semibold text-[#09090b]"
              >
                {visibleGuide.actionLabel}
              </button>
            </div>
          ) : null}

          {saveSummary ? (
            <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-[12px] leading-5 text-[#f5ddb1]">
              {saveSummary}
            </div>
          ) : null}

          {saveError ? (
            <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-[12px] leading-5 text-red-200">
              {saveError}
            </div>
          ) : null}

          {!draftSyncEnabled ? (
            <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-[12px] leading-5 text-text-2">
              임시 저장은 지금 꺼져 있어요. 마지막 저장만 눌러도 진행은 계속할 수 있어요.
            </div>
          ) : null}

          {activeTool === "trim" ? (
            <div data-testid="single-clip-trim-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">구간은 그대로 둬도 충분해요.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">필요할 때만 시작과 끝만 조금 조정하세요.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">시작</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">{formatTime(draft.playback.trimStart)}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">끝</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">{formatTime(draft.playback.trimEnd)}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">길이</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#f6d69a]">
                    {formatDuration(draft.playback.trimStart, draft.playback.trimEnd)}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-text-1">한 줄에서 시작과 끝을 같이 잡아요.</p>
                    <p className="mt-1 text-[12px] leading-5 text-text-3">가까운 손잡이를 잡아 움직이면 됩니다.</p>
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a]">
                    {formatDuration(draft.playback.trimStart, draft.playback.trimEnd)}
                  </span>
                </div>

                <div
                  ref={trimBarRef}
                  data-testid="single-clip-trim-range"
                  className="relative mt-4 h-12 overflow-hidden rounded-2xl bg-white/[0.04]"
                  onMouseDown={(event) => {
                    const rect = trimBarRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = (event.clientX - rect.left) / rect.width;
                    const time = x * draft.sourceDurationSec;
                    const handle = Math.abs(time - draft.playback.trimStart) < Math.abs(time - draft.playback.trimEnd)
                      ? "start"
                      : "end";
                    setDraggingTrimHandle(handle);
                    handleTrimDrag(event, handle);

                    const onMove = (moveEvent: MouseEvent) =>
                      handleTrimDrag(moveEvent as unknown as React.MouseEvent<HTMLDivElement>, handle);
                    const onUp = () => {
                      setDraggingTrimHandle(null);
                      document.removeEventListener("mousemove", onMove);
                      document.removeEventListener("mouseup", onUp);
                    };

                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                  }}
                  onTouchStart={(event) => {
                    const rect = trimBarRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = (event.touches[0].clientX - rect.left) / rect.width;
                    const time = x * draft.sourceDurationSec;
                    const handle = Math.abs(time - draft.playback.trimStart) < Math.abs(time - draft.playback.trimEnd)
                      ? "start"
                      : "end";
                    setDraggingTrimHandle(handle);
                    handleTrimDrag(event, handle);

                    const onMove = (moveEvent: TouchEvent) =>
                      handleTrimDrag(moveEvent as unknown as React.TouchEvent<HTMLDivElement>, handle);
                    const onUp = () => {
                      setDraggingTrimHandle(null);
                      document.removeEventListener("touchmove", onMove);
                      document.removeEventListener("touchend", onUp);
                    };

                    document.addEventListener("touchmove", onMove);
                    document.addEventListener("touchend", onUp);
                  }}
                >
                  <div
                    className="absolute inset-y-0 bg-[#d8b36a]/20"
                    style={{
                      left: `${(draft.playback.trimStart / draft.sourceDurationSec) * 100}%`,
                      width: `${((draft.playback.trimEnd - draft.playback.trimStart) / draft.sourceDurationSec) * 100}%`,
                    }}
                  />
                  <div
                    data-testid="single-clip-trim-start-handle"
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(${(draft.playback.trimStart / draft.sourceDurationSec) * 100}% - 16px)`,
                    }}
                  >
                    <div className={`flex h-8 w-4 items-center justify-center rounded-full ${
                      draggingTrimHandle === "start" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/80"
                    }`}>
                      <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
                    </div>
                  </div>
                  <div
                    data-testid="single-clip-trim-end-handle"
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(${(draft.playback.trimEnd / draft.sourceDurationSec) * 100}% - 16px)`,
                    }}
                  >
                    <div className={`flex h-8 w-4 items-center justify-center rounded-full ${
                      draggingTrimHandle === "end" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/80"
                    }`}>
                      <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-text-3">
                  <span>{formatTime(0)}</span>
                  <span>{formatTime(draft.sourceDurationSec)}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: {
                        ...current.playback,
                        trimStart: Math.min(safePreviewTime, current.playback.trimEnd - 0.1),
                      },
                    }))}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] font-semibold text-text-1"
                  >
                    지금 장면을 시작점으로
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: {
                        ...current.playback,
                        trimEnd: Math.max(safePreviewTime, current.playback.trimStart + 0.1),
                      },
                    }))}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] font-semibold text-text-1"
                  >
                    지금 장면을 끝점으로
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "focus" ? (
            <div data-testid="single-clip-spotlight-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">주인공을 한 번 찍어주세요.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">고른 뒤 확대 강도만 맞추면 끝나요.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">현재 프레임</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">{formatTime(safePreviewTime)}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">주인공</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">
                    {draft.playback.spotlight ? "정해짐" : "아직 없음"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-text-1">지금 장면부터 위치 고정</p>
                    <p className="mt-1 text-[12px] leading-5 text-text-3">
                      아래 재생 막대로 장면을 맞춘 뒤 눌러주세요.
                    </p>
                  </div>
                  <div
                    data-testid="single-clip-freeze-value"
                    className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a]"
                  >
                    {draft.playback.freezeAt != null ? formatTime(draft.playback.freezeAt) : "미지정"}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: {
                        ...current.playback,
                        freezeAt: current.playback.spotlight ? safePreviewTime : null,
                      },
                    }))}
                    disabled={!draft.playback.spotlight}
                    className="flex-1 rounded-2xl bg-[#d8b36a] px-4 py-3 text-[12px] font-bold text-[#09090b] disabled:opacity-40"
                  >
                    지금 장면 고정
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, spotlight: null, freezeAt: null },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    주인공 지우기
                  </button>
                </div>
              </div>

              <div data-testid="single-clip-zoom-panel" className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <p className="text-[13px] font-semibold text-text-1">얼마나 가까이 볼까요?</p>
                <p className="mt-1 text-[12px] leading-5 text-text-3">
                  주인공이 정해지면 아래 강도로 재생돼요.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {FOCUS_ZOOM_PRESETS.map((preset) => {
                    const selected = draft.playback.zoom === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => commitDraft((current) => ({
                          ...current,
                          playback: { ...current.playback, zoom: preset.value },
                        }))}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                          selected
                            ? "border-[#d8b36a]/35 bg-[#d8b36a]/15 text-[#f6d69a]"
                            : "border-white/[0.06] bg-white/[0.03] text-text-2"
                        }`}
                      >
                        <p className="text-[12px] font-semibold">{preset.label}</p>
                        <p className="mt-1 text-[10px]">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "overlay" ? (
            <div data-testid="single-clip-overlay-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">정보는 작게만 보여주면 돼요.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">필요 없으면 끄고 저장해도 됩니다.</p>
              </div>

              <div className="rounded-3xl border border-[#d8b36a]/20 bg-[#d8b36a]/10 p-4">
                <p className="text-[14px] font-semibold text-text-1">재생 전 프로필 카드</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">
                  이 카드는 항상 먼저 보여줄게요. 선수 소개 첫인상은 유지합니다.
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[#d8b36a] px-3 py-1.5 text-[11px] font-bold text-[#09090b]">
                  항상 켜짐
                </span>
              </div>

              <ToggleRow
                title="재생 중 하단 정보"
                description="재생 중 아래 안전 영역에만 이름 정보를 붙여요."
                checked={draft.overlay.showLowerThird}
                onChange={(checked) => commitDraft((current) => ({
                  ...current,
                  overlay: { ...current.overlay, showLowerThird: checked },
                }))}
              />

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <p className="text-[13px] font-semibold text-text-1">현재 표시</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#d8b36a]/15 px-3 py-2 text-[12px] font-semibold text-[#f6d69a]">
                    재생 전 카드 항상 켜짐
                  </span>
                  <span className={`rounded-full px-3 py-2 text-[12px] font-semibold ${
                    draft.overlay.showLowerThird
                      ? "bg-[#d8b36a]/15 text-[#f6d69a]"
                      : "bg-white/[0.05] text-text-3"
                  }`}>
                    하단 정보 {draft.overlay.showLowerThird ? "켜짐" : "꺼짐"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "save" ? (
            <div data-testid="single-clip-save-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">이제 저장만 정하면 끝이에요.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">기본은 지금 구간 그대로 저장됩니다.</p>
              </div>

              <div data-testid="single-clip-highlight-panel" className="space-y-4 rounded-3xl border border-white/[0.06] bg-card p-4">
                <ToggleRow
                  title="대표 장면만 짧게 다시 보여주기"
                  description="필요 없으면 전체 구간 그대로 저장해요."
                  checked={highlightEditorEnabled}
                  onChange={(checked) => {
                    setHighlightEditorOverride(checked);
                    if (!checked) {
                      commitDraft((current) => ({
                        ...current,
                        playback: {
                          ...current.playback,
                          highlightStart: current.playback.trimStart,
                          highlightEnd: current.playback.trimEnd,
                        },
                      }));
                    }
                  }}
                />

                {highlightEditorEnabled ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-text-1">하이라이트 시작</p>
                        <button
                          type="button"
                          onClick={() => commitDraft((current) => ({
                            ...current,
                            playback: { ...current.playback, highlightStart: safePreviewTime },
                          }))}
                          className="text-[11px] font-semibold text-[#f6d69a]"
                        >
                          지금 장면으로
                        </button>
                      </div>
                      <input
                        type="range"
                        min={draft.playback.trimStart}
                        max={draft.playback.highlightEnd}
                        step={0.1}
                        value={draft.playback.highlightStart}
                        onChange={(event) => commitDraft((current) => ({
                          ...current,
                          playback: { ...current.playback, highlightStart: Number(event.target.value) },
                        }))}
                        className="mt-3 w-full accent-[#d8b36a]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-text-1">하이라이트 끝</p>
                        <button
                          type="button"
                          onClick={() => commitDraft((current) => ({
                            ...current,
                            playback: { ...current.playback, highlightEnd: safePreviewTime },
                          }))}
                          className="text-[11px] font-semibold text-[#f6d69a]"
                        >
                          지금 장면으로
                        </button>
                      </div>
                      <input
                        type="range"
                        min={draft.playback.highlightStart}
                        max={draft.playback.trimEnd}
                        step={0.1}
                        value={draft.playback.highlightEnd}
                        onChange={(event) => commitDraft((current) => ({
                          ...current,
                          playback: { ...current.playback, highlightEnd: Number(event.target.value) },
                        }))}
                        className="mt-3 w-full accent-[#d8b36a]"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="text-[10px] text-text-3">구간</p>
                  <p className="mt-1 text-[13px] font-semibold text-text-1">
                    {formatDuration(draft.playback.trimStart, draft.playback.trimEnd)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="text-[10px] text-text-3">하이라이트</p>
                  <p className="mt-1 text-[13px] font-semibold text-text-1">
                    {formatDuration(draft.playback.highlightStart, draft.playback.highlightEnd)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="text-[10px] text-text-3">확대</p>
                  <p className="mt-1 text-[13px] font-semibold text-text-1">{draft.playback.zoom.toFixed(1)}x</p>
                </div>
              </div>

              <div className="space-y-3 rounded-[28px] border border-white/[0.06] bg-card p-5">
                <div>
                  <p className="text-[15px] font-semibold text-text-1">저장 위치</p>
                  <p className="mt-1 text-[12px] leading-5 text-text-3">
                    대표 영상으로 보일지, 기술 묶음에 넣을지만 정하면 돼요.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => commitDraft((current) => ({
                    ...current,
                    saveTarget: {
                      ...current.saveTarget,
                      profileTarget: "featured_candidate",
                      portfolioTagName: null,
                    },
                  }))}
                  className={`w-full rounded-3xl border p-4 text-left ${
                    draft.saveTarget.profileTarget === "featured_candidate"
                      ? "border-[#d8b36a]/35 bg-[#d8b36a]/10"
                      : "border-white/[0.06] bg-white/[0.03]"
                  }`}
                >
                  <p className="text-[14px] font-semibold text-text-1">프로필 대표로 저장</p>
                  <p className="mt-1 text-[12px] leading-5 text-text-3">
                    프로필에서 가장 먼저 보여줄 영상으로 연결해요.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => commitDraft((current) => ({
                    ...current,
                    saveTarget: {
                      ...current.saveTarget,
                      profileTarget: "tag_portfolio",
                      portfolioTagName: current.saveTarget.portfolioTagName ?? storeTags[0] ?? tagOptions[0]?.dbName ?? null,
                    },
                  }))}
                  className={`w-full rounded-3xl border p-4 text-left ${
                    draft.saveTarget.profileTarget === "tag_portfolio"
                      ? "border-[#d8b36a]/35 bg-[#d8b36a]/10"
                      : "border-white/[0.06] bg-white/[0.03]"
                  }`}
                >
                  <p className="text-[14px] font-semibold text-text-1">기술 묶음으로 저장</p>
                  <p className="mt-1 text-[12px] leading-5 text-text-3">
                    슈팅, 드리블 같은 태그 묶음에 넣어요.
                  </p>
                </button>

                {draft.saveTarget.profileTarget === "tag_portfolio" ? (
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-[13px] font-semibold text-text-1">태그 고르기</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tagOptions.map((tag) => {
                        const selected = draft.saveTarget.portfolioTagName === tag.dbName;
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => commitDraft((current) => ({
                              ...current,
                              saveTarget: { ...current.saveTarget, portfolioTagName: tag.dbName },
                            }))}
                            className={`rounded-full border px-3 py-2 text-[12px] font-semibold ${
                              selected
                                ? "border-[#d8b36a]/35 bg-[#d8b36a]/15 text-[#f6d69a]"
                                : "border-white/[0.08] bg-white/[0.03] text-text-2"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-[#070709]/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-[430px] gap-3">
          {activeTool === "save" ? (
            <>
              <button
                type="button"
                onClick={() => previousTool && setActiveTool(previousTool)}
                className="min-w-[96px] shrink-0 rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium text-text-1"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveState === "saving"}
                className="flex-1 rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b] disabled:opacity-60"
              >
                {saveState === "saving" ? "저장 중..." : "내 영상으로 저장"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveState === "saving"}
                className="min-w-[96px] shrink-0 rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium text-text-1 disabled:opacity-60"
              >
                {saveState === "saving" ? "저장 중..." : "이대로 저장"}
              </button>
              <button
                type="button"
                onClick={() => nextTool && setActiveTool(nextTool)}
                className="flex-1 rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b]"
              >
                {nextTool === "save" ? "저장 단계" : "다음"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
