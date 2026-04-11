"use client";

import { useEffect, useState, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useRouter, useSearchParams } from "next/navigation";
import SelectView from "@/components/upload/SelectView";
import UploadProcessingView from "@/components/upload/UploadProcessingView";
import HighlightSuggestionReview from "@/components/upload/HighlightSuggestionReview";
import {
  resolveSingleClipEditingDraft,
  type SingleClipEditingDraft,
} from "@/lib/single-clip-playback";
import { publishSingleClipDraft } from "@/lib/highlight-save";
import { abortActiveUploadWork, startUpload } from "@/lib/upload-service";
import { loadLatestSingleClipProject, markVideoProjectOpened, type SingleClipProjectResponse } from "@/lib/video-projects";
import { applySingleClipDraftToUploadStore, createSingleClipDraftFromStoreSource } from "@/lib/single-clip-store-sync";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useProfileContext();
  const phase = useUploadStore((s) => s.phase);
  const status = useUploadStore((s) => s.status);
  const file = useUploadStore((s) => s.file);
  const editorDraft = useUploadStore((s) => s.editorDraft);
  const childHandle = useUploadStore((s) => s.childHandle);

  const role = profile?.role ?? null;
  const canUpload = role === "player" || role === "parent";
  const uploadTargetChildId = searchParams.get("childId");
  const uploadTargetChildName = searchParams.get("childName");
  const uploadTargetChildHandle = searchParams.get("childHandle");
  const isParentUpload = role === "parent" && !!uploadTargetChildId;

  // 비디오 Object URL (phase 전환 간 유지)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recoverableDraft, setRecoverableDraft] = useState<SingleClipProjectResponse | null>(null);

  // Reset stale states on mount
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) s.reset();
  }, []);

  // Reset context on mount
  useEffect(() => {
    if (!canUpload) return;
    const store = useUploadStore.getState();
    if (role === "parent" && uploadTargetChildId) {
      store.setContext("parent");
      store.setChildInfo({
        id: uploadTargetChildId,
        name: uploadTargetChildName ?? "자녀",
        handle: uploadTargetChildHandle ?? "",
      });
      return;
    }

    store.setContext("general");
    store.setChildInfo(null);
  }, [canUpload, role, uploadTargetChildHandle, uploadTargetChildId, uploadTargetChildName]);

  // 파일 변경 시 비디오 URL 생성/해제
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (file || editorDraft) return;
    setVideoUrl(null);
  }, [editorDraft, file]);

  useEffect(() => {
    if (!canUpload) return;
    const state = useUploadStore.getState();
    if (state.file || state.editorDraft || state.phase !== "select") return;

    let cancelled = false;

    void (async () => {
      try {
        const latest = await loadLatestSingleClipProject();
        if (cancelled) return;
        setRecoverableDraft(latest);
      } catch {
        if (cancelled) return;
        setRecoverableDraft(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUpload, phase]);

  // 처리 단계 진입 시 실제 업로드 시작
  useEffect(() => {
    if (phase === "processing" && file && status === "idle" && !editorDraft) {
      void startUpload();
    }
  }, [editorDraft, file, phase, status]);

  // 레거시 phase 유입 시 현재 3단계 흐름으로 정렬
  useEffect(() => {
    const store = useUploadStore.getState();
    if (phase === "uploading") {
      store.setPhase("processing");
      return;
    }
    if (phase === "decorate" || phase === "share" || phase === "done") {
      store.setPhase("select");
    }
  }, [phase]);

  // 업로드 완료 후 저장/편집 선택 단계로 이동
  useEffect(() => {
    if (phase !== "processing" || status !== "done" || !file) return;

    const store = useUploadStore.getState();
    store.setPhase("choice");
    store.setStatus("idle");
    store.setProgress(100);
    store.setError(null);
  }, [file, phase, status]);

  // 파일 선택 → 뒤로가기 핸들링
  useEffect(() => {
    if (!file) return;
    history.pushState({ uploadFile: true }, "");
    const onPop = () => {
      const s = useUploadStore.getState();
      if (s.phase === "processing" || s.phase === "choice" || s.phase === "edit") {
        s.setPhase("select");
      } else if (s.file) {
        handleFullReset();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!file]);

  const handleFullReset = useCallback(() => {
    abortActiveUploadWork();
    useUploadStore.getState().reset();
    setVideoUrl(null);
    setRecoverableDraft(null);
  }, []);

  const handleRestoreDraft = useCallback(async () => {
    if (!recoverableDraft?.project || !recoverableDraft.clip) return;

    const store = useUploadStore.getState();
    const restoredDraft = resolveSingleClipEditingDraft({
      ...recoverableDraft.project.payload,
      projectId: recoverableDraft.project.id,
      projectStatus: recoverableDraft.project.status === "published" ? "published" : "draft",
      lastSavedAt: recoverableDraft.project.updated_at,
    } as SingleClipEditingDraft);

    const durationSec =
      recoverableDraft.clip.duration_sec ??
      recoverableDraft.clip.duration_seconds ??
      recoverableDraft.project.payload.sourceDurationSec;

    applySingleClipDraftToUploadStore({
      store,
      draft: restoredDraft,
      clipId: recoverableDraft.clip.id,
      durationSec,
      tags: recoverableDraft.clip.tags,
    });
    setVideoUrl(recoverableDraft.clip.video_url);
    setRecoverableDraft(null);

    try {
      await markVideoProjectOpened(recoverableDraft.project.id);
    } catch {
      // no-op
    }
  }, [recoverableDraft]);

  const handleEdit = useCallback(() => {
    const state = useUploadStore.getState();
    const activeDraft = state.editorDraft ?? createSingleClipDraftFromStoreSource(state);
    if (!activeDraft || !activeDraft.clipId) {
      state.setError("편집 화면을 준비하지 못했어요.");
      return;
    }

    state.setEditorDraft(activeDraft);
    state.setStatus("idle");
    state.setError(null);
    state.setProgress(0);
    state.setPhase("edit");
  }, []);

  const handleSaveNow = useCallback(async () => {
    const state = useUploadStore.getState();
    const activeDraft = state.editorDraft ?? createSingleClipDraftFromStoreSource(state);
    if (!activeDraft || !activeDraft.clipId) return;

    await publishSingleClipDraft({
      draft: activeDraft,
      clipId: activeDraft.clipId,
      existingTags: state.tags,
    });

    const destination = role === "parent" && childHandle
      ? `/p/${childHandle}`
      : "/profile";

    state.reset();
    window.location.replace(destination);
  }, [childHandle, role, router]);

  /* ── Guard: 로딩 중 ── */
  if (loading && !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-text-3">로딩 중...</p>
      </div>
    );
  }

  /* ── Guard: 권한 없음 ── */
  if (role && !canUpload) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-28">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-card px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-alt text-2xl">
            🚫
          </div>
          <h1 className="text-base font-semibold text-text-1">업로드 권한이 없어요</h1>
          <p className="text-sm text-text-3">선수 또는 부모 계정에서만 사용할 수 있어요.</p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg active:scale-[0.99]"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  /* ── Phase Router ── */

  // select: 파일 선택 + 트림
  if (phase === "select") {
    return (
      <div className="flex flex-col gap-0 pb-28">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={() => {
              if (file) handleFullReset();
              else router.back();
            }}
            aria-label="뒤로가기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-text-1">영상 올리기</h1>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {[{ label: "선택", active: true }, { label: "업로드", active: false }, { label: "편집", active: false }].map((step) => (
              <div key={step.label} className="flex flex-col items-center gap-1">
                <div className={`h-1 w-5 rounded-full ${step.active ? "bg-accent" : "bg-white/10"}`} />
                <span className={`text-[9px] font-semibold ${step.active ? "text-accent" : "text-text-3"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 파일 미선택 상태에서만 노출하는 보조 액션 */}
        {!file ? (
          <div className="px-4 pt-3 pb-1">
            <button
              type="button"
              onClick={() => router.push("/editor")}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-card px-4 py-3.5 text-left transition-colors active:bg-card-alt"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="14" rx="3" />
                  <circle cx="9" cy="10" r="2.5" />
                  <path d="M14 8h3M14 11h3" />
                  <path d="M3 20h18" strokeWidth="1.5" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-1">선수 프로필 편집</p>
                <p className="mt-0.5 text-[11px] text-text-3 truncate">FIFA 스타일 카드로 내 정보를 꾸며보세요</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}

        <SelectView
          ctaLabel="영상 올리기"
          startBackgroundUploadOnReady={false}
          onFileReady={() => useUploadStore.getState().setPhase("processing")}
        />

        {/* 이전 편집 복구 */}
        {!isParentUpload && recoverableDraft?.clip ? (
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={() => void handleRestoreDraft()}
              className="flex w-full items-start gap-3 rounded-2xl border border-[#d8b36a]/20 bg-[#d8b36a]/10 px-4 py-4 text-left"
            >
              <span className="mt-0.5 text-lg">↺</span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#f6d69a]">최근 편집 이어서 하기</p>
                <p className="mt-1 text-[12px] leading-5 text-text-2">
                  이전에 편집하다 멈춘 클립을 불러와요.
                </p>
              </div>
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <UploadProcessingView
        onRetry={() => void startUpload()}
        onReset={handleFullReset}
        onSaveNow={handleSaveNow}
      />
    );
  }

  if (phase === "choice") {
    return (
      <UploadProcessingView
        onRetry={() => void startUpload()}
        onReset={handleFullReset}
        onSaveNow={handleSaveNow}
        onEdit={handleEdit}
        readyForChoice
      />
    );
  }

  if (phase === "edit" && videoUrl && editorDraft) {
    return (
      <HighlightSuggestionReview
        key={editorDraft.clipId}
        draft={editorDraft}
        videoSrc={videoUrl}
        onReset={handleFullReset}
      />
    );
  }

  // fallback
  return null;
}
