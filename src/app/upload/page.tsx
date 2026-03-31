"use client";

import { useEffect, useState, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import type { UploadPhase } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useRouter } from "next/navigation";
import SelectView from "@/components/upload/SelectView";
import DecorateView from "@/components/upload/DecorateView";
import ShareView from "@/components/upload/ShareView";
import DoneView from "@/components/upload/DoneView";

export default function UploadPage() {
  const router = useRouter();
  const { profile, loading } = useProfileContext();
  const phase = useUploadStore((s) => s.phase);
  const status = useUploadStore((s) => s.status);
  const file = useUploadStore((s) => s.file);

  const role = profile?.role ?? null;
  const canUpload = role === "player" || role === "parent";

  // 비디오 Object URL (phase 전환 간 유지)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Reset stale states on mount
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) s.reset();
  }, []);

  // Reset context on mount
  useEffect(() => {
    if (!canUpload) return;
    useUploadStore.getState().setContext("general");
  }, [canUpload]);

  // 파일 변경 시 비디오 URL 생성/해제
  useEffect(() => {
    if (!file) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 업로드 완료 감지 → done phase
  useEffect(() => {
    if (status === "done") {
      useUploadStore.getState().setPhase("done");
    }
  }, [status]);

  // 업로드 시작 감지 → uploading phase
  useEffect(() => {
    if (status === "uploading" || status === "composing" || status === "saving") {
      useUploadStore.getState().setPhase("uploading");
    }
  }, [status]);

  // 파일 선택 → 뒤로가기 핸들링
  useEffect(() => {
    if (!file) return;
    history.pushState({ uploadFile: true }, "");
    const onPop = () => {
      const s = useUploadStore.getState();
      if (s.phase === "decorate") {
        s.setPhase("select");
      } else if (s.phase === "share") {
        s.setPhase("decorate");
      } else if (s.file) {
        handleFullReset();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!file]);

  const handleFullReset = useCallback(() => {
    useUploadStore.getState().reset();
    setVideoUrl(null);
  }, []);

  const handlePhase = useCallback((p: UploadPhase) => {
    useUploadStore.getState().setPhase(p);
  }, []);

  // "하나 더 만들기" — 같은 파일(R2 키) 유지, 메타만 리셋
  const handleMakeAnother = useCallback(() => {
    const s = useUploadStore.getState();
    const keepFile = s.file;
    const keepR2Key = s.r2Key;
    const keepR2ClipId = s.r2ClipId;
    const keepDuration = s.duration;

    s.reset();

    if (keepFile) {
      s.setFile(keepFile);
      s.setDuration(keepDuration);
      // R2 키 재사용 (재업로드 방지)
      if (keepR2Key && keepR2ClipId) {
        s.setR2Status("done");
        s.setR2Upload(keepR2Key, keepR2ClipId);
      }
      s.setPhase("decorate");
    }
  }, []);

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
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1 w-6 rounded-full bg-accent" />
            <div className="h-1 w-6 rounded-full bg-white/10" />
            <div className="h-1 w-6 rounded-full bg-white/10" />
          </div>
        </div>

        <SelectView onFileReady={() => handlePhase("decorate")} />
      </div>
    );
  }

  // decorate: 스포트라이트 + 이벤트 태그 + 효과
  if (phase === "decorate" && videoUrl) {
    return (
      <DecorateView
        videoSrc={videoUrl}
        onNext={() => handlePhase("share")}
        onBack={() => handlePhase("select")}
      />
    );
  }

  // share: 메모 + 공개범위 + 올리기
  if (phase === "share") {
    return (
      <ShareView onBack={() => handlePhase("decorate")} />
    );
  }

  // uploading: 진행 상태 (GlobalUploadIndicator가 처리하므로 간단한 대기 UI)
  if (phase === "uploading") {
    const progress = useUploadStore.getState().progress;
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke="#D4A853" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] font-stat font-bold text-accent tabular-nums">{progress}%</span>
          </div>
        </div>
        <p className="text-[14px] text-text-2">업로드 중...</p>
        <p className="text-[11px] text-text-3">페이지를 나가도 백그라운드에서 계속돼요</p>
      </div>
    );
  }

  // done: 완료
  if (phase === "done") {
    return <DoneView onMakeAnother={handleMakeAnother} />;
  }

  // fallback
  return null;
}
