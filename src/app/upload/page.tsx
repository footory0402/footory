"use client";

import { useEffect, useCallback, useState } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import VideoSelector from "@/components/upload/VideoSelector";
import SpotlightPicker from "@/components/upload/SpotlightPicker";
import EffectsToggle from "@/components/video/EffectsToggle";
import { startUpload } from "@/lib/upload-service";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const { profile, loading } = useProfileContext();
  const store = useUploadStore();
  const effects = useUploadStore((s) => s.effects);
  const [showQuickUpload, setShowQuickUpload] = useState(false);

  const role = profile?.role ?? null;
  const canUpload = role === "player" || role === "parent";

  // Reset stale states on mount
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) {
      s.reset();
    }
  }, []);

  // Reset context on mount
  useEffect(() => {
    if (!canUpload) return;
    useUploadStore.getState().setContext("general");
  }, [canUpload]);

  // 파일 선택 상태에서 갤럭시 ◁ / iOS 스와이프 백 → 파일 해제 (이전 페이지로 안 나감)
  const handleFileBack = useCallback(() => {
    useUploadStore.getState().setFile(null);
  }, []);

  useEffect(() => {
    const hasFile = !!store.file;
    if (!hasFile) return;
    history.pushState({ uploadFile: true }, "");
    const onPop = () => {
      if (useUploadStore.getState().file) {
        useUploadStore.getState().setFile(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [!!store.file]);

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
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-text-1">업로드 권한이 없어요</h1>
            <p className="text-sm text-text-3">
              영상 업로드는 선수 또는 부모 계정에서만 사용할 수 있어요.
            </p>
          </div>
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

  /* ── 메인 업로드 화면 ── */
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (store.file) { useUploadStore.getState().setFile(null); }
            else if (showQuickUpload) { setShowQuickUpload(false); }
            else { router.back(); }
          }}
          aria-label={store.file ? "파일 선택 해제" : showQuickUpload ? "선택 화면으로" : "뒤로가기"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">영상 올리기</h1>
      </div>

      {/* 프로필 카드 에디터 배너 */}
      {!store.file && !showQuickUpload && (
        <Link
          href="/editor"
          className="flex items-center gap-3 rounded-xl border border-accent/15 bg-accent/8 px-4 py-3 transition-colors active:bg-accent/12"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-lg">🎴</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-accent">선수 프로필 카드 만들기</p>
            <p className="text-[11px] text-text-3">영상 인트로에 넣을 선수 카드를 제작하세요</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}

      {/* 시나리오 분기 (파일 미선택 상태) */}
      {!store.file && !showQuickUpload && (
        <div className="flex flex-col gap-3">
          {/* 메인 CTA: 하이라이트 만들기 */}
          <Link
            href="/editor/video"
            className="flex flex-col gap-4 rounded-2xl border border-[#C0392B]/25 p-5 transition-colors active:opacity-80"
            style={{ background: "linear-gradient(135deg, rgba(192,57,43,0.12), rgba(231,76,60,0.06))" }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C0392B]/20 text-xl">⚽</span>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-white">경기 영상으로 하이라이트 만들기</p>
                <p className="mt-1 text-[12px] leading-relaxed text-text-3">
                  주말 경기 풀영상에서 원하는 구간을 골라<br />나만의 하이라이트를 만들어 보세요
                </p>
              </div>
            </div>

            {/* 3단계 플로우 */}
            <div className="flex items-center gap-1.5 text-[11px] text-text-3">
              <span className="rounded-md bg-[#C0392B]/20 px-2 py-1 font-semibold text-[#E74C3C]">영상 선택</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="rounded-md bg-[#C0392B]/20 px-2 py-1 font-semibold text-[#E74C3C]">구간 선택</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="rounded-md bg-[#C0392B]/20 px-2 py-1 font-semibold text-[#E74C3C]">완성!</span>
            </div>

            <div className="flex items-center justify-end gap-1 text-[12px] font-semibold text-[#E74C3C]">
              경기 영상 불러오기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[11px] text-text-3">또는</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* 보조 CTA: 짧은 영상 바로 올리기 */}
          <button
            type="button"
            onClick={() => setShowQuickUpload(true)}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-card px-4 py-3.5 text-left transition-colors active:bg-card-alt"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/6 text-lg">📱</span>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-text-1">짧은 영상 바로 올리기</p>
              <p className="mt-0.5 text-[11px] text-text-3">이미 편집된 스킬 영상을 바로 프로필에 올려요 · 2분 이내</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* 영상 선택 (보조 CTA 클릭 후 or 이미 파일 선택됨) */}
      {(showQuickUpload || store.file) && <VideoSelector />}

      {/* 카드 + 링 표시 (파일 선택 후) */}
      {store.file && (
        <div className="flex flex-col gap-5 animate-fade-up">
          {/* 주인공 위치 링 */}
          <SpotlightPicker
            file={store.file}
            trimStart={store.trimStart > 0 ? store.trimStart : undefined}
          />

          {/* 인트로 카드 토글 */}
          <div>
            <h3 className="mb-3 text-[14px] font-semibold text-text-1">인트로 카드</h3>
            <EffectsToggle
              effects={effects}
              onChange={(partial) => useUploadStore.getState().setEffects(partial)}
            />
          </div>

          {/* 업로드 버튼 */}
          <button
            type="button"
            onClick={() => startUpload()}
            disabled={store.status !== "idle"}
            className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg transition-opacity active:scale-[0.99] disabled:opacity-40"
          >
            {store.status === "idle" ? "업로드" : "업로드 중..."}
          </button>
        </div>
      )}
    </div>
  );
}
