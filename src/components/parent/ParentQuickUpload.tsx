"use client";

import { useState, useCallback } from "react";
import type { LinkedChild } from "@/hooks/useParent";
import { useUploadStore } from "@/stores/upload-store";
import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import {
  requestUploadPresign,
  uploadToPresignedWithDirectFallback,
} from "@/lib/upload-network";
import { buildParentUploadPayload } from "@/lib/upload-payload";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import Button from "@/components/ui/Button";
import { getFileDuration } from "@/lib/video";

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

  const startUpload = useCallback(async () => {
    if (!store.file || uploading) return;

    try {
      setUploading(true);
      setError(null);

      // 1. Get presigned URL
      const { url, key, clipId } = await requestUploadPresign({
        contentType: "video/mp4",
        fileName: store.file.name,
        fileSize: store.file.size,
      });
      if (!clipId) throw new Error("Presign 응답에 clipId가 없습니다.");

      // 2. Upload to R2
      await uploadToPresignedWithDirectFallback({
        url,
        key,
        file: store.file,
        contentType: "video/mp4",
      });

      // 3. Capture thumbnail
      const duration = store.file ? await getFileDuration(store.file) : 0;
      let thumbnailUrl: string | null = null;

      if (store.file) {
        const thumbBlob = await captureVideoThumbnail(store.file);
        if (thumbBlob) {
          const thumbPresign = await requestUploadPresign({ type: "thumbnail", clipId })
            .catch(() => null);
          if (thumbPresign) {
            await uploadToPresignedWithDirectFallback({
              url: thumbPresign.url,
              key: thumbPresign.key,
              file: thumbBlob,
              contentType: "image/jpeg",
            });
            thumbnailUrl = getPublicVideoUrl(thumbPresign.key);
          }
        }
      }

      // 4. Save clip via parent upload API
      const videoUrl = getPublicVideoUrl(key);
      const clipRes = await fetch("/api/parent/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildParentUploadPayload({
            childId: child.childId,
            clipId,
            videoUrl,
            durationSeconds: duration || null,
            fileSizeBytes: store.file?.size ?? null,
            tags: store.tags,
            thumbnailUrl,
          }),
        ),
      });

      if (!clipRes.ok) {
        const { error: msg } = await clipRes.json();
        throw new Error(msg || "클립 저장 실패");
      }

      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }, [store, child.childId, uploading]);

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
                onClick={startUpload}
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
