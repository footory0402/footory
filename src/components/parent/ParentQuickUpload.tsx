"use client";

import { useState, useCallback } from "react";
import type { LinkedChild } from "@/hooks/useParent";
import { useUploadStore } from "@/stores/upload-store";
import { startUpload as startManagedUpload } from "@/lib/upload-service";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import Button from "@/components/ui/Button";

interface ParentQuickUploadProps {
  child: LinkedChild;
  onClose: () => void;
  onComplete: () => void;
}

export default function ParentQuickUpload({ child, onClose, onComplete }: ParentQuickUploadProps) {
  const store = useUploadStore();
  const [localStep, setLocalStep] = useState<1 | 2>(1);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set parent context on mount
  useState(() => {
    store.setContext("parent");
    store.setChildId(child.childId);
  });

  const handleUpload = useCallback(async () => {
    if (!store.file || uploading) return;

    try {
      setUploading(true);
      setError(null);
      const snapshot = useUploadStore.getState();
      if (snapshot.status !== "idle" && snapshot.status !== "error") {
        snapshot.setStatus("idle");
        snapshot.setError(null);
      }

      await startManagedUpload();
      const result = useUploadStore.getState();
      if (result.status === "done") {
        setDone(true);
        return;
      }
      if (result.status === "error") {
        setError(result.error || "업로드 실패");
        return;
      }
      setError("업로드 상태를 확인하지 못했어요. 다시 시도해주세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }, [store, uploading]);

  const handleFinish = () => {
    store.reset();
    onComplete();
    onClose();
  };

  // Done screen
  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/90">
        <div className="flex w-full max-w-[360px] flex-col items-center px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-4xl">
            ✅
          </div>
          <p className="mt-4 text-[17px] font-bold text-text-1">업로드 완료!</p>
          <p className="mt-2 text-center text-[14px] text-text-2">
            {child.name}의 클립 라이브러리에 추가됐어요!
          </p>
          <p className="mt-1 text-[12px] text-text-3">
            하이라이트 및 대표 클립 지정은 선수가 직접 합니다
          </p>
          <Button variant="primary" size="full" className="mt-6" onClick={handleFinish}>
            확인
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} className="text-[14px] text-text-2">
          취소
        </button>
        <span className="text-[15px] font-semibold text-text-1">
          {child.name}에게 영상 올리기
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {localStep === 1 && (
          <>
            <VideoSelector />
            {store.file && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="full"
                  onClick={() => setLocalStep(2)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
        {localStep === 2 && (
          <>
            <TagMemoForm />
            <div className="mt-4 flex gap-3">
              <Button
                variant="ghost"
                size="full"
                onClick={() => setLocalStep(1)}
              >
                이전
              </Button>
              <Button
                variant="primary"
                size="full"
                onClick={handleUpload}
                disabled={uploading || store.tags.length === 0}
              >
                {uploading ? "업로드 중..." : "업로드"}
              </Button>
            </div>
            {error && <p className="mt-2 text-center text-[12px] text-red">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
