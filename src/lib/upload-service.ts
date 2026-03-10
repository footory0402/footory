import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import { getFileDuration } from "@/lib/video";
import { useUploadStore } from "@/stores/upload-store";

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

export async function startUpload() {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  try {
    store.setStatus("uploading");
    store.setProgress(0);

    // 1. Get presigned URL
    const presignRes = await fetch("/api/upload/presign", { method: "POST" });
    if (!presignRes.ok) throw new Error("Presign 요청 실패");
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. Upload to R2 via presigned PUT
    let presignUploadOk = false;
    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            store.setProgress((e.loaded / e.total) * 90);
          }
        };
        xhr.onload = () =>
          xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.send(store.file);
      });
      presignUploadOk = true;
    } catch (xhrErr) {
      // XHR failed — try fetch as fallback (different CORS handling)
      try {
        const fetchRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4" },
          body: store.file,
        });
        if (!fetchRes.ok) throw new Error(`R2 PUT ${fetchRes.status}`);
        presignUploadOk = true;
        store.setProgress(90);
      } catch {
        // Both presigned methods failed — try direct server upload
        await uploadViaDirectApi(store.file!, key, "video/mp4");
        store.setProgress(90);
      }
    }

    // 3. Capture thumbnail
    store.setStatus("thumbnail");
    store.setProgress(92);

    const duration = await getFileDuration(store.file!);
    let thumbnailUrl: string | null = null;

    const thumbBlob = await captureVideoThumbnail(store.file!);
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

    // 4. Save clip metadata
    store.setStatus("saving");
    store.setProgress(95);

    const videoUrl = getPublicVideoUrl(key);
    const highlightEnd = Math.min(duration || 30, 30);
    const isParentUpload = store.context === "parent" && store.childId;

    const apiUrl = isParentUpload ? "/api/parent/upload" : "/api/clips";
    const body = isParentUpload
      ? {
          child_id: store.childId,
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: store.file?.size,
          tags: store.tags,
          thumbnail_url: thumbnailUrl,
        }
      : {
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: store.file?.size,
          memo: store.memo || null,
          tags: store.tags,
          thumbnail_url: thumbnailUrl,
          highlight_start: store.highlightStart,
          highlight_end: highlightEnd,
        };

    const clipRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!clipRes.ok) throw new Error("클립 저장 실패");

    store.setProgress(100);
    store.setStatus("done");
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  }
}
