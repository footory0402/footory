"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GuideHighlightOverlay from "@/components/upload/GuideHighlightOverlay";
import SingleClipEditorPreview from "@/components/upload/SingleClipEditorPreview";
import { DEFAULT_EDITOR_ZOOM } from "@/lib/focus-zoom";
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

function isDraftStorageUnavailable(message: string) {
  return /video_projects|schema cache|relation .*video_projects/i.test(message);
}

function toFriendlySaveMessage(message: string, fallback: string) {
  if (isDraftStorageUnavailable(message)) {
    return fallback;
  }

  return message;
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
      setSpotlightPicking(false);
      return;
    }
    if (guideStep === "focus_pick") {
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
      ? "막대를 밀고 손잡이를 끌어 구간을 맞춰요"
      : guideStep === "focus_pick"
        ? "원하는 선수를 한 번 눌러요"
        : undefined;

  const guideDescription =
    guideStep === "trim_seek"
      ? undefined
      : guideStep === "focus_pick"
        ? "원하면 그다음에만 조금 더 가까이 볼 수 있어요."
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
            <h1 className="text-[18px] font-bold text-text-1">영상 편집</h1>
          </div>
          {saveState === "autosaving" ? (
            <span className="shrink-0 text-[11px] text-text-3">저장 중</span>
          ) : saveState === "idle" && draft.projectId ? (
            <span className="shrink-0 text-[11px] text-text-3">저장됨</span>
            ) : null}
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

          <div data-testid="single-clip-edit-panel">
            <SingleClipEditorPreview
              videoSrc={videoSrc}
              draft={draft}
              playerData={playerData}
              previewTime={safePreviewTime}
              spotlightPicking={spotlightPicking}
              draggingTrimHandle={draggingTrimHandle}
              onFocusTargetReady={setFocusGuideTarget}
              onTimelineReady={handleTimelineRef}
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
              onTimelinePress={handleTimelineSeek}
              onTrimHandlePress={startTrimHandleDrag}
              onSpotlightPickingChange={setSpotlightPicking}
              onClearSpotlight={() => {
                setSpotlightPicking(false);
                commitDraft((current) => ({
                  ...current,
                  playback: {
                    ...current.playback,
                    spotlight: null,
                    freezeAt: null,
                    zoom: DEFAULT_EDITOR_ZOOM,
                  },
                }));
              }}
              onProfileCardToggle={(checked) =>
                commitDraft((current) => ({
                  ...current,
                  overlay: { ...current.overlay, showProfileCard: checked },
                }))
              }
              onLowerThirdToggle={(checked) =>
                commitDraft((current) => ({
                  ...current,
                  overlay: { ...current.overlay, showLowerThird: checked },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/[0.06] bg-[#070709]/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-[430px]">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === "saving"}
            className="w-full rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b] disabled:opacity-60"
          >
            {saveState === "saving" ? "저장 중..." : "저장"}
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

      {guideTargetElement && guideTitle ? (
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
