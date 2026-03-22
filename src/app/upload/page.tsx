"use client";

import { useEffect, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { startUpload } from "@/lib/upload-service";
import { getSkillTagsForPosition } from "@/lib/constants";
import VideoSelector from "@/components/upload/VideoSelector";
import ChildSelector from "@/components/upload/ChildSelector";
import { useRouter, useSearchParams } from "next/navigation";

/*
 * v2.0 — Instagram-style 1-screen upload
 *
 * 파일 선택 → 태그(최대 2) + 한줄 메모 → 올리기 → 즉시 /profile 이동
 * 백그라운드 업로드 + GlobalUploadIndicator로 진행률 표시
 */

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useProfileContext();
  const store = useUploadStore();

  const role = profile?.role ?? null;
  const isParent = role === "parent";
  const canUpload = role === "player" || role === "parent";
  const challengeTag = searchParams.get("challenge_tag");

  // Reset stale states on mount (fixes "아무 반응 없음" bug)
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) {
      s.reset();
    }
  }, []);

  // Set context + challenge tag
  useEffect(() => {
    if (!canUpload) return;
    const s = useUploadStore.getState();
    if (isParent) {
      s.setContext("parent");
    } else if (challengeTag) {
      s.setContext("challenge");
      s.setChallengeTag(challengeTag);
      if (!s.tags.includes(challengeTag)) {
        s.setTags([challengeTag, ...s.tags].slice(0, 2));
      }
    } else {
      s.setContext("general");
    }
  }, [canUpload, isParent, challengeTag]);

  const toggleTag = useCallback(
    (tagName: string) => {
      if (challengeTag && tagName === challengeTag) return;
      const s = useUploadStore.getState();
      if (s.tags.includes(tagName)) {
        s.setTags(s.tags.filter((t) => t !== tagName));
      } else if (s.tags.length < 2) {
        s.setTags([...s.tags, tagName]);
      }
    },
    [challengeTag]
  );

  const handleUpload = useCallback(() => {
    const s = useUploadStore.getState();
    if (!s.file) return;

    // Force idle if stuck (belt-and-suspenders)
    if (s.status !== "idle") {
      s.setStatus("idle");
      s.setError(null);
      s.setProgress(0);
    }

    startUpload();
    router.replace("/profile");
  }, [router]);

  /* ── Guard screens ── */

  if (loading && !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-text-3">로딩 중...</p>
      </div>
    );
  }

  if (role && !canUpload) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-28">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-card px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-alt text-2xl">
            🚫
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-text-1">
              업로드 권한이 없어요
            </h1>
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

  if (store.status === "done") {
    router.replace("/profile");
    return null;
  }

  // Active upload — show processing (GlobalUploadIndicator handles progress)
  if (
    ["uploading_raw", "uploading", "thumbnail", "saving", "creating_job", "rendering"].includes(
      store.status
    )
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/10 border-t-accent" />
          <p className="text-[15px] font-semibold text-text-1">
            영상을 올리고 있어요
          </p>
          <p className="text-[12px] text-text-3">
            다른 페이지를 둘러봐도 괜찮아요
          </p>
        </div>
      </div>
    );
  }

  const availableTags = getSkillTagsForPosition(profile?.position);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (store.file ? useUploadStore.getState().setFile(null) : router.back())}
          aria-label={store.file ? "파일 선택 해제" : "뒤로가기"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">
          {isParent ? "영상 올려주기" : "영상 업로드"}
        </h1>
      </div>

      {/* Challenge banner */}
      {challengeTag && !store.file && (
        <div className="flex items-center gap-3 rounded-xl bg-accent/8 px-4 py-3">
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-[13px] font-semibold text-accent">
              챌린지 참여
            </p>
            <p className="text-[12px] text-text-2">
              {challengeTag} 태그가 자동 설정됩니다
            </p>
          </div>
        </div>
      )}

      {/* Parent: child selector */}
      {isParent && !store.file && <ChildSelector />}

      {/* Video selector */}
      <VideoSelector />

      {/* ── Tags + Memo + Upload (file selected) ── */}
      {store.file && (
        <div className="flex flex-col gap-5 animate-fade-up">
          {/* Tag chips */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-text-1">태그</h3>
              <span className="text-[12px] text-text-3">
                {store.tags.length}/2
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const selected = store.tags.includes(tag.dbName);
                const locked = challengeTag === tag.dbName;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.dbName)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                      selected
                        ? locked
                          ? "bg-accent/80 text-bg"
                          : "bg-accent text-bg"
                        : "bg-card text-text-2 active:bg-surface"
                    }`}
                  >
                    {tag.emoji} {tag.label}
                    {locked && " 🔒"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memo */}
          <div>
            <h3 className="mb-2 text-[14px] font-semibold text-text-1">
              메모
            </h3>
            <input
              type="text"
              value={store.memo}
              onChange={(e) => store.setMemo(e.target.value)}
              placeholder="한줄 메모 (선택)"
              maxLength={100}
              className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent/30 focus:outline-none"
            />
          </div>

          {/* Error state */}
          {store.status === "error" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-red-400">
                  {getErrorMessage(store.error)}
                </p>
                <p className="mt-0.5 text-[11px] text-text-3">
                  {getErrorHint(store.error)}
                </p>
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUpload}
            className="w-full rounded-xl border border-accent/20 bg-accent py-4 text-[15px] font-bold text-bg shadow-[0_4px_20px_rgba(212,168,83,0.25)] transition-transform active:scale-[0.99]"
          >
            올리기
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Error helpers ── */

function getErrorMessage(error: string | null): string {
  if (!error) return "업로드에 실패했어요.";
  if (error.includes("네트워크") || error.includes("network"))
    return "인터넷 연결이 불안정해요.";
  if (error.includes("Presign") || error.includes("CORS") || error.includes("R2"))
    return "서버 연결에 문제가 있어요.";
  if (error.includes("클립 저장"))
    return "영상 처리에 실패했어요.";
  return error;
}

function getErrorHint(error: string | null): string {
  if (!error) return "잠시 후 다시 시도해주세요.";
  if (error.includes("네트워크") || error.includes("network"))
    return "Wi-Fi 또는 데이터 연결을 확인해주세요.";
  if (error.includes("CORS") || error.includes("R2"))
    return "관리자에게 문의해주세요.";
  return "잠시 후 다시 시도해주세요.";
}
