"use client";

import { useEffect } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import VideoSelector from "@/components/upload/VideoSelector";
import SpotlightPicker from "@/components/upload/SpotlightPicker";
import EffectsToggle from "@/components/video/EffectsToggle";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const { profile, loading } = useProfileContext();
  const store = useUploadStore();
  const effects = useUploadStore((s) => s.effects);

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
          onClick={() => (store.file ? useUploadStore.getState().setFile(null) : router.back())}
          aria-label={store.file ? "파일 선택 해제" : "뒤로가기"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">영상 업로드</h1>
      </div>

      {/* 영상 선택 */}
      <VideoSelector />

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
        </div>
      )}
    </div>
  );
}
