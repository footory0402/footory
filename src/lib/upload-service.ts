import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import { getFileDuration } from "@/lib/video";
import { useUploadStore } from "@/stores/upload-store";

const SERVER_PROXY_LIMIT = 4 * 1024 * 1024; // 4MB — Vercel body limit

/**
 * iOS Safari often reports empty or wrong MIME types for video files.
 * Infer from file extension as fallback.
 */
function resolveContentType(file: File): string {
  if (file.type && file.type.startsWith("video/")) return file.type;

  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "webm":
      return "video/webm";
    case "avi":
      return "video/x-msvideo";
    case "mp4":
    default:
      return "video/mp4";
  }
}

async function uploadViaProxy(
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
    throw new Error(body.error ?? "서버 업로드 실패");
  }
}

async function uploadToR2(
  url: string,
  file: File,
  key: string,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  // 1차: XHR (progress 지원)
  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 90);
      };
      xhr.onload = () =>
        xhr.status < 300
          ? resolve()
          : reject(new Error(`R2 ${xhr.status}: ${xhr.statusText}`));
      xhr.onerror = () => reject(new Error("네트워크 오류 (XHR)"));
      xhr.ontimeout = () => reject(new Error("업로드 시간 초과"));
      xhr.timeout = 5 * 60 * 1000; // 5분
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(file);
    });
    return;
  } catch (xhrErr) {
    console.warn("[Upload] XHR failed:", xhrErr);
  }

  // 2차: fetch
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (res.ok) {
      onProgress(90);
      return;
    }
    console.warn("[Upload] Fetch PUT failed:", res.status, res.statusText);
  } catch (fetchErr) {
    console.warn("[Upload] Fetch failed:", fetchErr);
  }

  // 3차: 서버 프록시 (4MB 이하만)
  if (file.size <= SERVER_PROXY_LIMIT) {
    await uploadViaProxy(file, key, contentType);
    onProgress(90);
    return;
  }

  // 모두 실패
  throw new Error(
    "영상을 R2에 업로드할 수 없습니다.\n" +
    "Cloudflare Dashboard → R2 → 버킷 설정에서\n" +
    "CORS 정책을 확인해주세요."
  );
}

export async function startUpload() {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  try {
    store.setStatus("uploading");
    store.setProgress(0);

    const fileContentType = resolveContentType(store.file!);

    // 1. Get presigned URL
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: fileContentType }),
    });
    if (!presignRes.ok) {
      const errBody = await presignRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `Presign 요청 실패 (${presignRes.status})`);
    }
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. Upload video to R2
    await uploadToR2(url, store.file!, key, fileContentType, (pct) =>
      store.setProgress(pct)
    );
    store.setProgress(90);

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
        // 썸네일은 작으므로 presigned URL 또는 서버 프록시 모두 가능
        try {
          const thumbRes = await fetch(thumbUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: thumbBlob,
          });
          if (!thumbRes.ok) throw new Error("thumb presign fail");
        } catch {
          await uploadViaProxy(thumbBlob, thumbKey, "image/jpeg");
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

    if (!clipRes.ok) {
      const errBody = await clipRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `클립 저장 실패 (${clipRes.status})`);
    }

    store.setProgress(100);
    store.setStatus("done");
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  }
}

/**
 * v1.3 서버 렌더 파이프라인 업로드
 * 원본 영상 R2 업로드 → 메타데이터 DB 저장 → /api/render 호출 → Realtime 완료 대기
 */
export async function startRenderUpload() {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  try {
    store.setStatus("uploading_raw");
    store.setProgress(0);

    const fileContentType = resolveContentType(store.file);

    // 1. presigned URL 가져오기
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: fileContentType }),
    });
    if (!presignRes.ok) {
      const errBody = await presignRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `Presign 요청 실패 (${presignRes.status})`);
    }
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. 원본 영상 R2 업로드
    await uploadToR2(url, store.file, key, fileContentType, (pct) =>
      store.setProgress(pct)
    );
    store.setProgress(90);

    // 3. 썸네일 생성 + 업로드
    store.setStatus("thumbnail");
    store.setProgress(92);

    const duration = await getFileDuration(store.file);
    let thumbnailUrl: string | null = null;

    const thumbBlob = await captureVideoThumbnail(store.file);
    if (thumbBlob) {
      const thumbPresign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "thumbnail", clipId }),
      });
      if (thumbPresign.ok) {
        const { url: thumbUrl, key: thumbKey } = await thumbPresign.json();
        try {
          const thumbRes = await fetch(thumbUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: thumbBlob,
          });
          if (!thumbRes.ok) throw new Error("thumb presign fail");
        } catch {
          await uploadViaProxy(thumbBlob, thumbKey, "image/jpeg");
        }
        thumbnailUrl = getPublicVideoUrl(thumbKey);
      }
    }

    // 4. 클립 메타데이터 저장
    store.setStatus("saving");
    store.setProgress(95);

    const videoUrl = getPublicVideoUrl(key);
    const clipRes = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clip_id: clipId,
        video_url: videoUrl,
        duration_seconds: duration || null,
        file_size_bytes: store.file.size,
        memo: store.memo || null,
        tags: store.tags,
        thumbnail_url: thumbnailUrl,
        highlight_start: store.trimStart,
        highlight_end: store.trimEnd ?? Math.min(duration || 30, 30),
        skill_labels: store.skillLabels,
        custom_labels: store.customLabels,
        trim_start: store.trimStart,
        trim_end: store.trimEnd,
        spotlight_x: store.spotlightX,
        spotlight_y: store.spotlightY,
        slowmo_start: store.slowmoStart,
        slowmo_end: store.slowmoEnd,
        slowmo_speed: store.slowmoSpeed,
        bgm_id: store.bgmId,
        effects: store.effects,
      }),
    });

    if (!clipRes.ok) {
      const errBody = await clipRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `클립 저장 실패 (${clipRes.status})`);
    }

    // 5. 렌더 API 호출 → Container FFmpeg 렌더 시작
    store.setStatus("rendering");
    store.setProgress(0);

    const renderRes = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        inputKey: key,
        params: {
          trimStart: store.trimStart,
          trimEnd: store.trimEnd,
          spotlightX: store.spotlightX,
          spotlightY: store.spotlightY,
          skillLabels: store.skillLabels,
          customLabels: store.customLabels,
          slowmoStart: store.slowmoStart,
          slowmoEnd: store.slowmoEnd,
          slowmoSpeed: store.slowmoSpeed,
          bgmId: store.bgmId,
          effects: store.effects,
        },
      }),
    });

    if (!renderRes.ok) {
      const errBody = await renderRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `렌더 요청 실패 (${renderRes.status})`);
    }

    const { job } = await renderRes.json();
    store.setRenderJobId(job.id);

    // Realtime 구독으로 진행률 추적 → upload/page.tsx의 RenderProgress가 처리
    // rendering 상태로 유지 (done 전환은 RenderProgress onComplete에서)
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  }
}
