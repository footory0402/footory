"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IntroCard from "@/components/video/hud/IntroCard";
import SingleClipEditorPreview from "@/components/upload/SingleClipEditorPreview";
import { getSkillTagsForPosition } from "@/lib/constants";
import { FOCUS_ZOOM_PRESETS } from "@/lib/focus-zoom";
import { publishSingleClipDraft, saveSingleClipDraft } from "@/lib/highlight-save";
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

type EditorTool = "trim" | "spotlight" | "zoom" | "overlay" | "highlight";

const NUDGE_SECONDS = 0.5;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function formatDuration(start: number, end: number) {
  return formatTime(Math.max(0, end - start));
}

function ToolPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${
        active
          ? "border-[#d8b36a]/40 bg-[#d8b36a]/15 text-[#f6d69a]"
          : "border-white/[0.08] bg-white/[0.04] text-text-2"
      }`}
    >
      {label}
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
        {checked ? "ON" : "OFF"}
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
  const lastAutosaveKeyRef = useRef<string | null>(null);
  const safePreviewTime = Math.min(
    Math.max(previewTime, draft.playback.trimStart),
    draft.playback.trimEnd,
  );

  const commitDraft = (updater: (current: SingleClipEditingDraft) => SingleClipEditingDraft) => {
    setEditorDraft(updateSingleClipEditingDraft(draft, updater));
    setSaveError(null);
  };

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
    ? "clip의 시작과 끝만 먼저 다듬습니다."
    : activeTool === "spotlight"
      ? "프리뷰를 눌러 선수를 찍고, 프리즈 시점을 맞춥니다."
      : activeTool === "zoom"
        ? "재생 중 자동 확대 강도를 고릅니다."
        : activeTool === "overlay"
          ? "프로필 카드와 하단 선수 정보 노출만 정합니다."
          : "대표 highlight 범위만 짧게 표시합니다.";

  const handleSave = async () => {
    setSaveState("saving");
    setSaveError(null);

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
          ? `${result.connectionLabel}에 다시 반영했어요`
          : `${result.connectionLabel}에 공개했어요`,
      );
      setSaveState("idle");
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  };

  useEffect(() => {
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
          if (latestDraft && latestDraft.clipId === draft.clipId) {
            setEditorDraft({
              ...latestDraft,
              projectId: persistedDraft.projectId,
              projectStatus: persistedDraft.projectStatus,
              lastSavedAt: persistedDraft.lastSavedAt,
            });
          }

          setSaveState((current) => (current === "saving" ? current : "idle"));
        } catch (error) {
          setSaveState((current) => (current === "saving" ? current : "error"));
          setSaveError(error instanceof Error ? error.message : "임시 저장에 실패했습니다.");
        }
      })();
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [draft, setEditorDraft]);

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
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold text-text-1">클립 편집</h1>
            <p className="truncate text-[12px] text-text-3">{toolDescription}</p>
          </div>
          <div className="ml-auto rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-text-2">
            {draft.projectStatus === "published" ? "공개됨" : draft.lastSavedAt ? "draft 저장됨" : "저장 전"}
          </div>
        </div>

        <div className="px-4">
          <SingleClipEditorPreview
            videoSrc={videoSrc}
            draft={draft}
            playerData={playerData}
            previewTime={safePreviewTime}
            spotlightPicking={activeTool === "spotlight"}
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

        <div className="px-4 pb-4 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <ToolPill active={activeTool === "trim"} label="Trim" onClick={() => setActiveTool("trim")} />
            <ToolPill active={activeTool === "spotlight"} label="Spotlight" onClick={() => setActiveTool("spotlight")} />
            <ToolPill active={activeTool === "zoom"} label="Zoom" onClick={() => setActiveTool("zoom")} />
            <ToolPill active={activeTool === "overlay"} label="Overlay" onClick={() => setActiveTool("overlay")} />
            <ToolPill active={activeTool === "highlight"} label="Highlight" onClick={() => setActiveTool("highlight")} />
          </div>
        </div>

        <div data-testid="single-clip-editor" className="flex-1 overflow-y-auto px-4 pb-40">
          {activeTool === "trim" ? (
            <div data-testid="single-clip-trim-panel" className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-1">시작점</p>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimStart: safePreviewTime },
                    }))}
                    className="text-[11px] font-semibold text-[#f6d69a]"
                  >
                    현재 시점으로
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, draft.playback.trimEnd)}
                  step={0.1}
                  value={draft.playback.trimStart}
                  onChange={(event) => commitDraft((current) => ({
                    ...current,
                    playback: { ...current.playback, trimStart: Number(event.target.value) },
                  }))}
                  className="mt-3 w-full accent-[#d8b36a]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimStart: current.playback.trimStart - NUDGE_SECONDS },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    -0.5초
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimStart: current.playback.trimStart + NUDGE_SECONDS },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    +0.5초
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-1">끝점</p>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimEnd: safePreviewTime },
                    }))}
                    className="text-[11px] font-semibold text-[#f6d69a]"
                  >
                    현재 시점으로
                  </button>
                </div>
                <input
                  type="range"
                  min={draft.playback.trimStart}
                  max={Math.max(draft.playback.trimStart + 0.1, draft.sourceDurationSec)}
                  step={0.1}
                  value={draft.playback.trimEnd}
                  onChange={(event) => commitDraft((current) => ({
                    ...current,
                    playback: { ...current.playback, trimEnd: Number(event.target.value) },
                  }))}
                  className="mt-3 w-full accent-[#d8b36a]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimEnd: current.playback.trimEnd - NUDGE_SECONDS },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    -0.5초
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, trimEnd: current.playback.trimEnd + NUDGE_SECONDS },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    +0.5초
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "spotlight" ? (
            <div data-testid="single-clip-spotlight-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">프리뷰를 눌러 선수 한 명만 지정하세요.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">
                  모바일에서 빠르게 쓰도록 따라가기 대신 한 지점을 고정하고, freeze 시점만 따로 맞춥니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">현재 프레임</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">{formatTime(safePreviewTime)}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-text-3">상태</p>
                  <p className="mt-1 text-[15px] font-semibold text-text-1">
                    {draft.playback.spotlight ? "선수 지정됨" : "아직 없음"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-1">Spotlight freeze</p>
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
                    className="text-[11px] font-semibold text-[#f6d69a] disabled:opacity-40"
                  >
                    현재 시점으로
                  </button>
                </div>
                <input
                  type="range"
                  min={draft.playback.trimStart}
                  max={draft.playback.trimEnd}
                  step={0.1}
                  value={draft.playback.freezeAt ?? draft.playback.trimStart}
                  onChange={(event) => commitDraft((current) => ({
                    ...current,
                    playback: {
                      ...current.playback,
                      freezeAt: current.playback.spotlight ? Number(event.target.value) : null,
                    },
                  }))}
                  disabled={!draft.playback.spotlight}
                  className="mt-3 w-full accent-[#d8b36a] disabled:opacity-40"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, spotlight: null, freezeAt: null },
                    }))}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-text-1"
                  >
                    Spotlight 지우기
                  </button>
                  <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] text-text-2">
                    Freeze {draft.playback.freezeAt != null ? formatTime(draft.playback.freezeAt) : "미지정"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTool === "zoom" ? (
            <div data-testid="single-clip-zoom-panel" className="space-y-4">
              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <p className="text-[13px] font-semibold text-text-1">자동 확대 강도</p>
                <p className="mt-1 text-[12px] leading-5 text-text-3">
                  spotlight가 있으면 재생 중 같은 확대 강도로 따라갑니다.
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
              <ToggleRow
                title="Profile Card"
                description="재생 전에 선수 카드 인트로를 붙입니다."
                checked={draft.overlay.showProfileCard}
                onChange={(checked) => commitDraft((current) => ({
                  ...current,
                  overlay: { ...current.overlay, showProfileCard: checked },
                }))}
              />
              <ToggleRow
                title="Lower Third"
                description="재생 중 하단 선수 정보 바를 유지합니다."
                checked={draft.overlay.showLowerThird}
                onChange={(checked) => commitDraft((current) => ({
                  ...current,
                  overlay: { ...current.overlay, showLowerThird: checked },
                }))}
              />

              {draft.overlay.showProfileCard ? (
                <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-card">
                  <div className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-text-1">Profile card preview</p>
                    <p className="mt-1 text-[12px] text-text-3">현재 선수 프로필 정보를 그대로 사용합니다.</p>
                  </div>
                  <div className="aspect-video overflow-hidden border-t border-white/[0.06]">
                    <IntroCard data={playerData} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTool === "highlight" ? (
            <div data-testid="single-clip-highlight-panel" className="space-y-4">
              <div className="rounded-3xl border border-[#d8b36a]/15 bg-[#d8b36a]/[0.07] p-4">
                <p className="text-[13px] font-semibold text-[#f6d69a]">Highlight는 선택형입니다.</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">
                  trim 전체를 그대로 저장해도 되고, 대표 구간만 더 짧게 잡아 둘 수도 있습니다.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-1">Highlight 시작</p>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, highlightStart: safePreviewTime },
                    }))}
                    className="text-[11px] font-semibold text-[#f6d69a]"
                  >
                    현재 시점으로
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

              <div className="rounded-3xl border border-white/[0.06] bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-1">Highlight 끝</p>
                  <button
                    type="button"
                    onClick={() => commitDraft((current) => ({
                      ...current,
                      playback: { ...current.playback, highlightEnd: safePreviewTime },
                    }))}
                    className="text-[11px] font-semibold text-[#f6d69a]"
                  >
                    현재 시점으로
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

          <div data-testid="single-clip-save-panel" className="mt-6 space-y-4 rounded-[28px] border border-white/[0.06] bg-card p-5">
            <div>
              <p className="text-[15px] font-semibold text-text-1">저장</p>
              <p className="mt-1 text-[12px] leading-5 text-text-3">
                이 화면에서 정한 single clip metadata만 저장합니다. reel highlight로 확장하지 않습니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/[0.03] p-3">
                <p className="text-[10px] text-text-3">Trim</p>
                <p className="mt-1 text-[13px] font-semibold text-text-1">
                  {formatDuration(draft.playback.trimStart, draft.playback.trimEnd)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-3">
                <p className="text-[10px] text-text-3">Highlight</p>
                <p className="mt-1 text-[13px] font-semibold text-text-1">
                  {formatDuration(draft.playback.highlightStart, draft.playback.highlightEnd)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-3">
                <p className="text-[10px] text-text-3">Zoom</p>
                <p className="mt-1 text-[13px] font-semibold text-text-1">{draft.playback.zoom.toFixed(1)}x</p>
              </div>
            </div>

            <div className="space-y-3">
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
                <p className="text-[14px] font-semibold text-text-1">프로필 Featured로 공개</p>
                <p className="mt-1 text-[12px] leading-5 text-text-3">
                  프로필 대표 자산으로 바로 연결합니다.
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
                <p className="text-[14px] font-semibold text-text-1">태그 포트폴리오로 공개</p>
                <p className="mt-1 text-[12px] leading-5 text-text-3">
                  슈팅, 드리블 같은 기존 기술 포트폴리오 묶음에 연결합니다.
                </p>
              </button>
            </div>

            {draft.saveTarget.profileTarget === "tag_portfolio" ? (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-[13px] font-semibold text-text-1">포트폴리오 태그</p>
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

            {saveSummary ? (
              <div className="rounded-2xl border border-[#d8b36a]/25 bg-[#d8b36a]/10 p-4 text-[12px] leading-5 text-[#f5ddb1]">
                저장 완료: {saveSummary}
              </div>
            ) : null}
            {saveError ? (
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-[12px] leading-5 text-red-200">
                {saveError}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-[#070709]/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-[430px] gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium text-text-1"
          >
            다른 영상
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || saveState === "autosaving"}
            className="flex-1 rounded-2xl bg-[#d8b36a] py-3.5 text-[15px] font-bold text-[#09090b] disabled:opacity-60"
          >
            {saveState === "saving" ? "공개 저장 중..." : saveState === "autosaving" ? "draft 저장 중..." : "공개 저장"}
          </button>
          {draft.lastSavedAt ? (
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[14px] font-medium text-text-1"
            >
              프로필
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
