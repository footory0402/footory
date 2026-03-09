"use client";

import { useEffect, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { useProfileContext } from "@/providers/ProfileProvider";
import { startUpload } from "@/lib/upload-service";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import UploadProgress from "@/components/upload/UploadProgress";
import UploadComplete from "@/components/upload/UploadComplete";
import ChildSelector from "@/components/upload/ChildSelector";
import { useRouter, useSearchParams } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfileContext();
  const store = useUploadStore();

  const isParent = profile?.role === "parent";
  const challengeTag = searchParams.get("challenge_tag");

  // Set context + challenge tag on mount
  useEffect(() => {
    if (isParent) {
      store.setContext("parent");
    } else if (challengeTag) {
      store.setContext("challenge");
      store.setChallengeTag(challengeTag);
      if (!store.tags.includes(challengeTag)) {
        store.setTags([challengeTag, ...store.tags].slice(0, 3));
      }
    } else {
      store.setContext("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParent, challengeTag]);

  // Reset on unmount
  useEffect(() => {
    return () => useUploadStore.getState().reset();
  }, []);

  const canUpload = (() => {
    if (!store.file) return false;
    if (store.tags.length === 0) return false;
    if (isParent && !store.childId) return false;
    return true;
  })();

  const handleUpload = useCallback(() => {
    if (!canUpload) return;
    startUpload();
  }, [canUpload]);

  // Show complete overlay
  if (store.status === "done") {
    return <UploadComplete />;
  }

  return (
    <>
      {/* Upload progress overlay */}
      <UploadProgress />

      <div className="flex flex-col gap-6 px-4 pb-28 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-text-1">
            {isParent ? "영상 올려주기" : "영상 업로드"}
          </h1>
        </div>

        {/* Challenge banner */}
        {challengeTag && (
          <div className="flex items-center gap-3 rounded-xl bg-accent/8 px-4 py-3">
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-[13px] font-semibold text-accent">챌린지 참여</p>
              <p className="text-[12px] text-text-2">{challengeTag} 태그가 자동 설정됩니다</p>
            </div>
          </div>
        )}

        {/* Parent: child selector */}
        {isParent && <ChildSelector />}

        {/* Video selector with thumbnail preview */}
        <VideoSelector />

        {/* Tag & Memo — inline, always visible */}
        {store.file && (
          <div className="animate-fade-up">
            <TagMemoForm />
          </div>
        )}

        {/* Error state */}
        {store.status === "error" && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-red/10 px-4 py-4">
            <p className="text-sm text-red">{store.error ?? "업로드에 실패했습니다."}</p>
            <button
              type="button"
              onClick={() => {
                store.setStatus("idle");
                store.setError(null);
                store.setProgress(0);
              }}
              className="rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-bg"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      {/* Sticky upload button */}
      {store.status !== "error" && (
        <div className="fixed bottom-[calc(54px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4 pb-3">
          <button
            type="button"
            disabled={!canUpload || store.status !== "idle"}
            onClick={handleUpload}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-bg shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-opacity disabled:opacity-40"
          >
            업로드
          </button>
        </div>
      )}
    </>
  );
}
