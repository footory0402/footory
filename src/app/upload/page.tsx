"use client";

import { useEffect, useCallback } from "react";
import { useUploadStore } from "@/stores/upload-store";
import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import VideoSelector from "@/components/upload/VideoSelector";
import TagMemoForm from "@/components/upload/TagMemoForm";
import UploadProgress from "@/components/upload/UploadProgress";
import { useRouter } from "next/navigation";
import { getFileDuration } from "@/lib/video";

const STEP_TITLES = ["영상 선택", "태그 & 메모", "업로드"];

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

export default function UploadPage() {
  const router = useRouter();
  const store = useUploadStore();

  const startUpload = useCallback(async () => {
    if (!store.file || store.status !== "idle") return;

    try {
      store.setStatus("uploading");
      store.setProgress(0);

      // 1. Get presigned URL
      const presignRes = await fetch("/api/upload/presign", { method: "POST" });
      if (!presignRes.ok) throw new Error("Presign 요청 실패");
      const { url, key, clipId } = await presignRes.json();
      store.setClipId(clipId);

      // 2. Upload to R2 via PUT
      const xhr = new XMLHttpRequest();
      try {
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              store.setProgress((e.loaded / e.total) * 90);
            }
          };
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
        store.setProgress(90);
      }

      // 3. Capture thumbnail
      store.setStatus("thumbnail");
      store.setProgress(92);

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

      // 4. Save clip metadata with highlight info
      store.setStatus("saving");
      store.setProgress(95);

      const videoUrl = getPublicVideoUrl(key);
      const highlightEnd = Math.min(duration || 30, 30);

      const clipRes = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: store.file?.size,
          memo: store.memo || null,
          tags: store.tags,
          thumbnail_url: thumbnailUrl,
          highlight_start: 0,
          highlight_end: highlightEnd,
        }),
      });

      if (!clipRes.ok) throw new Error("클립 저장 실패");

      store.setProgress(100);
      store.setStatus("done");
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "업로드 실패");
      store.setStatus("error");
    }
  }, [store]);

  // Auto-start upload when entering step 3
  useEffect(() => {
    if (store.step === 3 && store.status === "idle") {
      startUpload();
    }
  }, [store.step, store.status, startUpload]);

  // Reset on unmount
  useEffect(() => {
    return () => store.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-4">
      {/* Back + Title */}
      {store.step < 3 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (store.step === 1) router.back();
              else store.prevStep();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-text-1">영상 업로드</h1>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_TITLES.map((title, i) => {
          const stepNum = i + 1;
          const active = store.step === stepNum;
          const done = store.step > stepNum;
          return (
            <div key={title} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-6 ${done ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
              )}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : done
                    ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                    : "bg-[var(--color-card)] text-[var(--color-text-3)]"
                }`}
              >
                {done ? "✓" : stepNum}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-[var(--color-text)]" : "text-[var(--color-text-3)]"
                }`}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {store.step === 1 && <VideoSelector />}
      {store.step === 2 && <TagMemoForm />}
      {store.step === 3 && <UploadProgress />}
    </div>
  );
}
