"use client";

import { useEffect, useCallback, useState } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { startUpload } from "@/lib/upload-service";
import VideoSelector from "@/components/upload/VideoSelector";
import ChildSelector from "@/components/upload/ChildSelector";
import { useRouter, useSearchParams } from "next/navigation";

/*
 * v2.2 — Instagram-style upload
 *
 * 파일 선택 → 즉시 R2 백그라운드 업로드 시작 → 태그(최대 2) + 메모 → 올리기
 * → 즉시 /profile 이동 → GlobalUploadIndicator가 진행 상태 표시
 */

const SIMPLE_TAGS = [
  { id: "goal",      dbName: "득점",    label: "득점",    emoji: "🥅" },
  { id: "assist",    dbName: "어시스트", label: "어시스트", emoji: "🤝" },
  { id: "dribble",   dbName: "1v1 돌파", label: "드리블",  emoji: "⚽" },
  { id: "defense",   dbName: "1v1 수비", label: "수비",    emoji: "🛡️" },
  { id: "freekick",  dbName: "슈팅",    label: "프리킥",  emoji: "🎯" },
  { id: "best",      dbName: "기타",    label: "베스트",  emoji: "⭐" },
] as const;

// GK용 태그
const GK_TAGS = [
  { id: "gk_save",   dbName: "세이브",   label: "세이브",  emoji: "🧤" },
  { id: "gk_dist",   dbName: "배급",     label: "배급",    emoji: "🦶" },
  { id: "gk_1v1",    dbName: "1v1세이브", label: "1대1",   emoji: "🛑" },
  { id: "best",      dbName: "기타",     label: "베스트",  emoji: "⭐" },
] as const;

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useProfileContext();
  const store = useUploadStore();

  const [uploading, setUploading] = useState(false);
  const r2Status = useUploadStore((s) => s.r2Status);
  const compressStatus = useUploadStore((s) => s.compressStatus);

  // 올리기 버튼 준비 상태 — 압축 or R2 백그라운드 업로드 진행 중
  const isPreparing =
    compressStatus === "loading" ||
    compressStatus === "compressing" ||
    r2Status === "uploading";
  const isReady = r2Status === "done" || r2Status === "error";

  const role = profile?.role ?? null;
  const isParent = role === "parent";
  const canUpload = role === "player" || role === "parent";
  const challengeTag = searchParams.get("challenge_tag");
  const isGK = profile?.position === "GK";
  const tags = isGK ? GK_TAGS : SIMPLE_TAGS;

  // Reset stale states on mount
  useEffect(() => {
    const s = useUploadStore.getState();
    if (["error", "done"].includes(s.status)) {
      s.reset();
    }
  }, []);

  // Context 설정
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
    (dbName: string) => {
      if (challengeTag && dbName === challengeTag) return;
      const s = useUploadStore.getState();
      if (s.tags.includes(dbName)) {
        s.setTags(s.tags.filter((t) => t !== dbName));
      } else if (s.tags.length < 2) {
        s.setTags([...s.tags, dbName]);
      }
    },
    [challengeTag]
  );

  const handleUpload = useCallback(() => {
    const s = useUploadStore.getState();
    if (!s.file) return;
    if (s.status !== "idle") {
      s.setStatus("idle");
      s.setError(null);
      s.setProgress(0);
    }
    setUploading(true);
    startUpload(); // 백그라운드로 실행 — GlobalUploadIndicator가 진행 상태 표시
    // 150ms 후 이동 — 사용자가 "시작됨" 느낌을 받을 수 있도록 brief 딜레이
    setTimeout(() => router.replace("/profile"), 150);
  }, [router]);

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
        <h1 className="text-[17px] font-bold text-text-1">
          {isParent ? "영상 올려주기" : "영상 업로드"}
        </h1>
      </div>

      {/* 챌린지 배너 */}
      {challengeTag && !store.file && (
        <div className="flex items-center gap-3 rounded-xl bg-accent/8 px-4 py-3">
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-[13px] font-semibold text-accent">챌린지 참여</p>
            <p className="text-[12px] text-text-2">{challengeTag} 태그가 자동 설정됩니다</p>
          </div>
        </div>
      )}

      {/* 부모: 자녀 선택 */}
      {isParent && !store.file && <ChildSelector />}

      {/* 영상 선택 */}
      <VideoSelector />


      {/* 태그 + 메모 + 올리기 (파일 선택 후) */}
      {store.file && (
        <div className="flex flex-col gap-5 animate-fade-up">
          {/* 태그 */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-text-1">태그</h3>
              <span className="text-[12px] text-text-3">{store.tags.length}/2</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = store.tags.includes(tag.dbName);
                const locked = challengeTag === tag.dbName;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.dbName)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                      selected
                        ? "bg-accent text-bg"
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

          {/* 메모 */}
          <div>
            <h3 className="mb-2 text-[14px] font-semibold text-text-1">메모</h3>
            <input
              type="text"
              value={store.memo}
              onChange={(e) => store.setMemo(e.target.value)}
              placeholder="한줄 메모 (선택)"
              maxLength={100}
              className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent/30 focus:outline-none"
            />
          </div>

          {/* 에러 */}
          {store.status === "error" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-red-400">
                  {store.error ?? "업로드에 실패했어요."}
                </p>
                <p className="mt-0.5 text-[11px] text-text-3">다시 시도해주세요.</p>
              </div>
            </div>
          )}

          {/* 올리기 버튼 */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || isPreparing}
            className={`w-full rounded-xl py-4 text-[15px] font-bold transition-all active:scale-[0.99] ${
              isPreparing || uploading
                ? "border border-white/10 bg-white/8 text-text-3"
                : "border border-accent/20 bg-accent text-bg shadow-[0_4px_20px_rgba(212,168,83,0.25)]"
            }`}
          >
            {uploading ? (
              "업로드 중..."
            ) : isPreparing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                준비 중...
              </span>
            ) : (
              "올리기"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
