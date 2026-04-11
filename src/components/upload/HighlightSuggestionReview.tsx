"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GuideHighlightOverlay from "@/components/upload/GuideHighlightOverlay";
import SingleClipEditorPreview from "@/components/upload/SingleClipEditorPreview";
import { DEFAULT_FOCUS_ZOOM } from "@/lib/focus-zoom";
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

const TOOL_ORDER = ["edit", "overlay"] as const;
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
  testId,
  onClick,
}: {
  active: boolean;
  step: string;
  label: string;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex min-h-[68px] flex-col justify-between rounded-[24px] border px-3 py-3 text-left ${
        active
          ? "border-[#d8b36a]/35 bg-[#d8b36a]/12 text-[#f6d69a]"
          : "border-white/[0.08] bg-white/[0.03] text-text-2"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
        {step}
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  testId,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-3xl border p-4 text-left ${
        checked ? "border-[#d8b36a]/35 bg-[#d8b36a]/10" : "border-white/[0.06] bg-white/[0.03]"
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
  draft: initialDraft,
  videoSrc,
  onReset,
}: HighlightSuggestionReviewProps) {
  const { profile } = useProfileContext();
  const childName = useUploadStore((state) => state.childName);
  const childHandle = useUploadStore((state) => state.childHandle);
  const context = useUploadStore((state) => state.context);
  const storeTags = useUploadStore((state) => state.tags);
  const setEditorDraft = useUploadStore((state) => state.setEditorDraft);

  const [focusGuideTarget, setFocusGuideTarget] = useState<HTMLDivElement | null>(null);
  const [seekGuideTarget, setSeekGuideTarget] = useState<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>("edit");
  const [spotlightPicking, setSpotlightPicking] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewTime, setPreviewTime] = useState(initialDraft.playback.trimStart);
  const [saveState, setSaveState] = useState<"idle" | "autosaving" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSummary, setSaveSummary] = useState<string | null>(null);
  const [draftSyncEnabled, setDraftSyncEnabled] = useState(true);
  const [draggingTrimHandle, setDraggingTrimHandle] = useState<"start" | "end" | null>(null);
  const lastAutosaveKeyRef = useRef<string | null>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);
  const { guideStep, dismissStep, closeGuide, skipAll } = useUploadGuide();
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const safePreviewTime = Math.min(
    Math.max(previewTime, draft.playback.trimStart),
    draft.playback.trimEnd
  );

  const toolIndex = TOOL_ORDER.indexOf(activeTool);
  const nextTool = toolIndex < TOOL_ORDER.length - 1 ? TOOL_ORDER[toolIndex + 1] : null;

  const commitDraft = useCallback(
    (updater: (current: SingleClipEditingDraft) => SingleClipEditingDraft) => {
      const currentDraft = useUploadStore.getState().editorDraft ?? draft;
      const nextDraft = updateSingleClipEditingDraft(currentDraft, updater);
      setDraft(nextDraft);
      setEditorDraft(nextDraft);
      setSaveError(null);
      setSaveSummary(null);
    },
    [draft, setEditorDraft]
  );

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

  useEffect(() => {
    if (guideStep === "trim_seek") {
      setActiveTool("edit");
      setSpotlightPicking(false);
      return;
    }
    if (guideStep === "focus_pick") {
      setActiveTool("edit");
      setSpotlightPicking(true);
    }
  }, [guideStep]);

  const guideTargetElement =
    guideStep === "trim_seek"
      ? seekGuideTarget
      : guideStep === "focus_pick"
        ? focusGuideTarget
        : null;

  const guideTitle =
    guideStep === "trim_seek"
      ? "먼저 원하는 장면으로 이동하세요"
      : guideStep === "focus_pick"
        ? "여기서 선수를 한 번 누르세요"
        : undefined;

  const guideDescription =
    guideStep === "trim_seek"
      ? "재생하거나 시간을 움직여 선수가 잘 보이는 순간을 먼저 찾으면 쉬워요."
      : guideStep === "focus_pick"
        ? "주인공이 있는 지점을 한 번만 누르면 돼요."
        : undefined;

  const guidePlacement =
    guideStep === "trim_seek"
      ? "top"
      : guideStep === "focus_pick"
        ? "bottom"
        : undefined;

  const guideAlign =
    guideStep === "trim_seek"
      ? "center"
      : guideStep === "focus_pick"
        ? "center"
        : undefined;

  const handleTimelineRef = useCallback((element: HTMLDivElement | null) => {
    trimBarRef.current = element;
    setSeekGuideTarget(element);
  }, []);

  const getTimelineTime = useCallback(
    (clientX: number) => {
      const bar = trimBarRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Number((ratio * draft.sourceDurationSec).toFixed(1));
    },
    [draft.sourceDurationSec],
  );

  const seekPreviewTo = useCallback(
    (time: number) => {
      const nextTime = Number(Math.max(0, Math.min(draft.sourceDurationSec, time)).toFixed(1));
      setPreviewTime(nextTime);
      if (guideStep === "trim_seek" && Math.abs(nextTime - draft.playback.trimStart) >= 0.3) {
        dismissStep();
      }
    },
    [dismissStep, draft.playback.trimStart, draft.sourceDurationSec, guideStep],
  );

  const updateTrimHandle = useCallback(
    (clientX: number, handle: "start" | "end") => {
      const time = getTimelineTime(clientX);

      if (handle === "start") {
        const nextStart = Math.min(time, draft.playback.trimEnd - 0.1);
        commitDraft((current) => ({
          ...current,
          playback: {
            ...current.playback,
            trimStart: nextStart,
          },
        }));
        setPreviewTime((current) => Math.max(nextStart, current));
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
      setPreviewTime((current) => Math.min(nextEnd, current));
    },
    [commitDraft, draft.playback.trimEnd, draft.playback.trimStart, getTimelineTime],
  );

  const startTrimHandleDrag = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
      handle: "start" | "end",
    ) => {
      setDraggingTrimHandle(handle);
      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX = "touches" in moveEvent
          ? (moveEvent.touches[0]?.clientX ?? moveEvent.changedTouches[0]?.clientX ?? 0)
          : moveEvent.clientX;
        updateTrimHandle(clientX, handle);
      };
      const onUp = () => {
        setDraggingTrimHandle(null);
        document.removeEventListener("mousemove", onMove as EventListener);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onMove as EventListener);
        document.removeEventListener("touchend", onUp);
      };

      const initialClientX = "touches" in event
        ? event.touches[0].clientX
        : event.clientX;
      updateTrimHandle(initialClientX, handle);
      document.addEventListener("mousemove", onMove as EventListener);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove as EventListener, { passive: true });
      document.addEventListener("touchend", onUp);
    },
    [updateTrimHandle],
  );

  const handleTimelineSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-timeline-handle='true']")) {
        return;
      }

      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      seekPreviewTo(getTimelineTime(clientX));
    },
    [getTimelineTime, seekPreviewTo],
  );

  const handleSave = async () => {
    const currentDraft = useUploadStore.getState().editorDraft ?? draft;
    const publishDraft = updateSingleClipEditingDraft(currentDraft, (current) => ({
      ...current,
      saveTarget: {
        profileTarget: "featured_candidate",
        portfolioTagName: null,
      },
    }));

    setSaveState("saving");
    setSaveError(null);
    setSaveSummary(null);

    try {
      const result = await publishSingleClipDraft({
        draft: publishDraft,
        clipId: publishDraft.clipId,
        existingTags: storeTags,
      });

      const latestDraft = useUploadStore.getState().editorDraft;
      const projectId = latestDraft?.projectId ?? publishDraft.projectId;
      if (latestDraft && latestDraft.clipId === publishDraft.clipId && projectId) {
        setEditorDraft(
          markSingleClipDraftPersisted(latestDraft, {
            projectId,
            projectStatus: "published",
          })
        );
      }
      setSaveSummary(
        result.featuredLinkFailed
          ? "영상은 저장했어요. 대표 영상 연결은 프로필에서 다시 해주세요."
          : result.publishTransition === "republished"
            ? `${result.connectionLabel}에 다시 반영했어요.`
            : `${result.connectionLabel}에 저장했어요.`
      );
      const destination = context === "parent" && childHandle
        ? `/p/${childHandle}`
        : result.featuredLinkFailed ? "/profile?saved=clip" : "/profile?saved=featured";

      useUploadStore.getState().reset();
      setSaveState("idle");
      if (context === "parent" && childHandle) {
        window.location.replace(destination);
        return;
      }
      window.location.replace(destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setSaveState("error");
      setSaveError(
        toFriendlySaveMessage(
          message,
          "임시 저장 없이도 계속 편집할 수 있어요. 마지막에 다시 저장해보세요."
        )
      );
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
          const currentDraft = useUploadStore.getState().editorDraft ?? draft;
          const currentAutosaveKey = JSON.stringify({
            projectId: currentDraft.projectId,
            playback: currentDraft.playback,
            overlay: currentDraft.overlay,
            saveTarget: currentDraft.saveTarget,
            lastEditedAt: currentDraft.lastEditedAt,
          });

          if (lastAutosaveKeyRef.current === currentAutosaveKey) {
            setSaveState((current) => (current === "saving" ? current : "idle"));
            return;
          }

          setSaveState((current) => (current === "saving" ? current : "autosaving"));
          const persistedDraft = await saveSingleClipDraft({ draft: currentDraft });
          lastAutosaveKeyRef.current = currentAutosaveKey;

          const latestDraft = useUploadStore.getState().editorDraft;
          if (
            latestDraft &&
            latestDraft.clipId === currentDraft.clipId &&
            persistedDraft.projectId
          ) {
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
          setSaveError(
            toFriendlySaveMessage(
              message,
              "임시 저장은 잠시 멈췄어요. 마지막 저장은 계속할 수 있어요."
            )
          );
        }
      })();
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [draft, draftSyncEnabled, setEditorDraft]);

  const trimStartPercent = (draft.playback.trimStart / draft.sourceDurationSec) * 100;
  const trimEndPercent = (draft.playback.trimEnd / draft.sourceDurationSec) * 100;
  const playheadPercent = (safePreviewTime / draft.sourceDurationSec) * 100;
  const freezePercent = draft.playback.freezeAt != null
    ? (draft.playback.freezeAt / draft.sourceDurationSec) * 100
    : null;
  const focusStatusText = spotlightPicking
    ? "이제 영상에서 선수를 눌러주세요."
    : draft.playback.spotlight
      ? `${formatTime(draft.playback.freezeAt ?? safePreviewTime)}에서 2초 멈춰요.`
      : "장면을 맞춘 뒤 선수 찍기를 누르세요.";

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709]">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 min-h-0 flex-col">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
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
          </div>
          {saveState === "autosaving" ? (
            <span className="shrink-0 text-[11px] text-text-3">저장 중</span>
          ) : saveState === "idle" && draft.projectId ? (
            <span className="shrink-0 text-[11px] text-text-3">저장됨</span>
          ) : null}
        </div>

        <div className="shrink-0 px-4">
          <SingleClipEditorPreview
            videoSrc={videoSrc}
            draft={draft}
            playerData={playerData}
            previewTime={safePreviewTime}
            spotlightPicking={spotlightPicking}
            focusPreviewVisible={activeTool === "edit"}
            overlayPreviewVisible={activeTool === "overlay"}
            showSeekControls={false}
            onFocusTargetReady={setFocusGuideTarget}
            onPreviewTimeChange={(time) => {
              setPreviewTime(time);
              if (guideStep === "trim_seek" && Math.abs(time - draft.playback.trimStart) >= 0.3) {
                dismissStep();
              }
            }}
            onSpotlightChange={(spotlight) => {
              commitDraft((current) => ({
                ...current,
                playback: {
                  ...current.playback,
                  spotlight,
                  freezeAt: spotlight ? safePreviewTime : null,
                  zoom: spotlight
                    ? current.playback.spotlight
                      ? current.playback.zoom
                      : DEFAULT_FOCUS_ZOOM
                    : current.playback.zoom,
                },
              }));
              if (spotlight) {
                setSpotlightPicking(false);
              }
              if (spotlight && guideStep === "focus_pick") {
                dismissStep();
              }
            }}
            onZoomChange={(zoom) => {
              commitDraft((current) => ({
                ...current,
                playback: {
                  ...current.playback,
                  zoom,
                },
              }));
            }}
          />
        </div>

        <div className="shrink-0 px-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <ToolChip
              active={activeTool === "edit"}
              step="1"
              label="장면"
              testId="single-clip-tool-edit"
              onClick={() => {
                setActiveTool("edit");
              }}
            />
            <ToolChip
              active={activeTool === "overlay"}
              step="2"
              label="정보"
              testId="single-clip-tool-overlay"
              onClick={() => setActiveTool("overlay")}
            />
          </div>
        </div>

        <div
          data-testid="single-clip-editor"
          className="flex-1 overflow-y-auto px-4 pt-4"
          style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
        >
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

          {activeTool === "edit" ? (
            <div data-testid="single-clip-edit-panel" className="space-y-4">
              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-text-1">원하는 장면으로 맞춰요</p>
                    <p className="mt-1 text-[12px] leading-5 text-text-3">
                      막대를 움직이고 양끝을 잡아 보여줄 구간을 정하세요.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#d8b36a]/12 px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a]">
                    {formatDuration(draft.playback.trimStart, draft.playback.trimEnd)}
                  </div>
                </div>

                <div
                  ref={handleTimelineRef}
                  data-testid="single-clip-edit-timeline"
                  className="relative mt-4 h-16 overflow-visible rounded-[22px] bg-white/[0.04]"
                  onMouseDown={handleTimelineSeek}
                  onTouchStart={handleTimelineSeek}
                >
                  <div
                    className="absolute inset-y-0 rounded-[20px] bg-[#d8b36a]/18"
                    style={{
                      left: `${trimStartPercent}%`,
                      width: `${trimEndPercent - trimStartPercent}%`,
                    }}
                  />

                  {freezePercent != null && draft.playback.spotlight ? (
                    <div
                      data-testid="single-clip-freeze-marker"
                      className="absolute inset-y-2 z-20 -translate-x-1/2"
                      style={{ left: `${freezePercent}%` }}
                    >
                      <div className="h-full w-[2px] rounded-full bg-[#f6d69a]/70" />
                      <div className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-[#f6d69a] bg-[#09090b]" />
                    </div>
                  ) : null}

                  <div
                    className="absolute inset-y-1 z-20 w-[2px] -translate-x-1/2 rounded-full bg-white/90"
                    style={{ left: `${playheadPercent}%` }}
                  >
                    <div className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
                  </div>

                  <div
                    data-testid="single-clip-trim-start-handle"
                    data-timeline-handle="true"
                    className="absolute inset-y-0 z-30 flex items-center justify-center"
                    style={{ left: `calc(${trimStartPercent}% - 22px)`, width: 44 }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      startTrimHandleDrag(event, "start");
                    }}
                    onTouchStart={(event) => {
                      event.stopPropagation();
                      startTrimHandleDrag(event, "start");
                    }}
                  >
                    <div
                      className={`flex h-10 w-5 items-center justify-center rounded-full ${
                        draggingTrimHandle === "start" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/80"
                      }`}
                    >
                      <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
                    </div>
                  </div>

                  <div
                    data-testid="single-clip-trim-end-handle"
                    data-timeline-handle="true"
                    className="absolute inset-y-0 z-30 flex items-center justify-center"
                    style={{ left: `calc(${trimEndPercent}% - 22px)`, width: 44 }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      startTrimHandleDrag(event, "end");
                    }}
                    onTouchStart={(event) => {
                      event.stopPropagation();
                      startTrimHandleDrag(event, "end");
                    }}
                  >
                    <div
                      className={`flex h-10 w-5 items-center justify-center rounded-full ${
                        draggingTrimHandle === "end" ? "bg-[#d8b36a]" : "bg-[#d8b36a]/80"
                      }`}
                    >
                      <div className="h-3 w-0.5 rounded-full bg-[#09090b]" />
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-text-3">
                  <span>{formatTime(0)}</span>
                  <span>{formatTime(draft.sourceDurationSec)}</span>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-text-1">주인공을 찍어주세요</p>
                      <p className="mt-1 text-[12px] leading-5 text-text-3">
                        원하는 위치로 간 뒤 영상에서 선수를 누르면 그 시점에 잠깐 멈춰 보여줘요.
                      </p>
                    </div>
                    <div
                      data-testid="single-clip-freeze-value"
                      className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-[#f6d69a]"
                    >
                      {draft.playback.freezeAt != null ? formatTime(draft.playback.freezeAt) : "꺼짐"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSpotlightPicking((current) => !current)}
                      className={`rounded-2xl px-4 py-3 text-[12px] font-bold ${
                        spotlightPicking
                          ? "bg-[#d8b36a] text-[#09090b]"
                          : "border border-[#d8b36a]/25 bg-[#d8b36a]/10 text-[#f6d69a]"
                      }`}
                    >
                      {spotlightPicking ? "선수 찍는 중" : "이 장면에서 선수 찍기"}
                    </button>
                    {draft.playback.spotlight ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSpotlightPicking(false);
                          commitDraft((current) => ({
                            ...current,
                            playback: { ...current.playback, spotlight: null, freezeAt: null },
                          }));
                        }}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] font-semibold text-text-1"
                      >
                        주인공 지우기
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[12px] leading-5 text-text-3">{focusStatusText}</p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "overlay" ? (
            <div data-testid="single-clip-overlay-panel" className="space-y-4">
              <ToggleRow
                testId="single-clip-profile-card-toggle"
                title="선수 프로필 카드"
                description="본영상이 시작되기 전에 선수 카드를 먼저 보여줘요."
                checked={draft.overlay.showProfileCard}
                onChange={(checked) =>
                  commitDraft((current) => ({
                    ...current,
                    overlay: { ...current.overlay, showProfileCard: checked },
                  }))
                }
              />

              <ToggleRow
                title="재생 중 하단 정보"
                description="재생 중 하단 안전 영역에만 보여줘요."
                testId="single-clip-lower-third-toggle"
                checked={draft.overlay.showLowerThird}
                onChange={(checked) =>
                  commitDraft((current) => ({
                    ...current,
                    overlay: { ...current.overlay, showLowerThird: checked },
                  }))
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/[0.06] bg-[#070709]/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-[430px] gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === "saving"}
            className="min-w-[96px] shrink-0 rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium text-text-1 disabled:opacity-60"
          >
            {saveState === "saving" ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={nextTool ? () => setActiveTool(nextTool) : () => void handleSave()}
            disabled={saveState === "saving"}
            className="flex-1 rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b] disabled:opacity-60"
          >
            {nextTool ? "다음" : saveState === "saving" ? "저장 중..." : "완료 및 저장"}
          </button>
        </div>
      </div>

      {/* 뒤로가기 확인 다이얼로그 */}
      {showResetConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="mx-auto w-full max-w-[430px] rounded-t-3xl border-t border-white/[0.08] bg-[#1C1C22] px-5 pt-6 pb-8"
            style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
          >
            <p className="text-[16px] font-bold text-text-1">편집을 그만할까요?</p>
            <p className="mt-1.5 text-[13px] leading-5 text-text-3">
              지금까지 편집한 내용은 자동으로 저장돼 있어요.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-semibold text-text-1"
              >
                나가기
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b]"
              >
                계속 편집
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {guideTargetElement && guideTitle && guideDescription ? (
        <GuideHighlightOverlay
          targetElement={guideTargetElement}
          title={guideTitle}
          description={guideDescription}
          onSkip={closeGuide}
          onDisable={skipAll}
          placement={guidePlacement}
          align={guideAlign}
        />
      ) : null}
    </div>
  );
}
