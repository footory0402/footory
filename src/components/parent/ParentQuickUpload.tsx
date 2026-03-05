"use client";

import { useState, useCallback } from "react";
import type { LinkedChild } from "@/hooks/useParent";
import { useUploadStore } from "@/stores/upload-store";
import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import Button from "@/components/ui/Button";
import { getFileDuration } from "@/lib/video";

interface ParentQuickUploadProps {
  child: LinkedChild;
  onClose: () => void;
  onComplete: () => void;
}

const STEP_TITLES = ["영상 선택", "태그 선택", "완료"];

async function uploadViaDirectApi(
  file: Blob,
  key: string,
  contentType: string
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("key", key);
  form.append("contentType", contentType);

  const res = await fetch("/api/upload/direct", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Direct upload failed");
  }
}

export default function ParentQuickUpload({ child, onClose, onComplete }: ParentQuickUploadProps) {
  const store = useUploadStore();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startUpload = useCallback(async () => {
    if (!store.file || uploading) return;

    try {
      setUploading(true);
      setError(null);

      // 1. Get presigned URL
      const presignRes = await fetch("/api/upload/presign", { method: "POST" });
      if (!presignRes.ok) throw new Error("Presign 요청 실패");
      const { url, key, clipId } = await presignRes.json();

      // 2. Upload to R2
      const xhr = new XMLHttpRequest();
      try {
        await new Promise<void>((resolve, reject) => {
          xhr.onload = () =>
            xhr.status < 300 ? resolve() : reject(new Error("Upload failed"));
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", "video/mp4");
          xhr.send(store.file);
        });
      } catch {
        // Fallback for CORS/pre-signed PUT issues.
        await uploadViaDirectApi(store.file, key, "video/mp4");
      }

      // 3. Capture thumbnail
      const duration = store.file ? await getFileDuration(store.file) : 0;
      let thumbnailUrl: string | null = null;

      if (store.file) {
        const thumbBlob = await captureVideoThumbnail(store.file);
        if (thumbBlob) {
          const thumbPresign = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "thumbnail", clipId }),
          });
          if (thumbPresign.ok) {
            const { url: thumbUrl, key: thumbKey } = await thumbPresign.json();
            const thumbUploadRes = await fetch(thumbUrl, {
              method: "PUT",
              headers: { "Content-Type": "image/jpeg" },
              body: thumbBlob,
            }).catch(() => null);
            if (!thumbUploadRes || !thumbUploadRes.ok) {
              await uploadViaDirectApi(thumbBlob, thumbKey, "image/jpeg");
            }
            thumbnailUrl = getPublicVideoUrl(thumbKey);
          }
        }
      }

      // 4. Save clip via parent upload API
      const videoUrl = getPublicVideoUrl(key);
      const clipRes = await fetch("/api/parent/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: child.childId,
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: store.file?.size,
          tags: store.tags,
          thumbnail_url: thumbnailUrl,
        }),
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

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {STEP_TITLES.map((title, i) => {
          const stepNum = i + 1;
          const active = store.step === stepNum;
          const stepDone = store.step > stepNum;
          return (
            <div key={title} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-6 ${stepDone ? "bg-accent" : "bg-border"}`} />
              )}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  active ? "bg-accent text-bg"
                  : stepDone ? "bg-accent/20 text-accent"
                  : "bg-card text-text-3"
                }`}
              >
                {stepDone ? "✓" : stepNum}
              </div>
              <span className={`text-xs font-medium ${active ? "text-text-1" : "text-text-3"}`}>
                {title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {store.step === 1 && <VideoSelector />}
        {store.step === 2 && (
          <>
            <TagMemoForm />
            <div className="mt-4">
              <Button
                variant="primary"
                size="full"
                onClick={startUpload}
                disabled={uploading || store.tags.length === 0}
              >
                {uploading ? "업로드 중..." : "업로드"}
              </Button>
              {error && <p className="mt-2 text-center text-[12px] text-red">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
