import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import { getFileDuration } from "@/lib/video";
import { useUploadStore } from "@/stores/upload-store";

const SERVER_PROXY_LIMIT = 4 * 1024 * 1024; // 4MB
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10분
const API_TIMEOUT_MS = 30_000; // API 호출 30초

// ─── 유틸 ───

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

/** 모바일 브라우저 호환: File → Blob 래핑 (cross-origin PUT 안정화) */
function toSafeBlob(file: File | Blob, contentType: string): Blob {
  return new Blob([file], { type: contentType });
}

/**
 * Service Worker를 우회하는 fetch wrapper.
 * 모바일에서 SW가 POST/PUT 요청을 가로채면 "Failed to fetch" 발생 가능.
 */
async function fetchBypassSW(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, { ...init, cache: "no-store" });
}

/** 타임아웃 + 재시도 포함 API fetch */
async function apiFetch(
  url: string,
  init: RequestInit,
  label: string,
  retries = 1,
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchBypassSW(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;

      console.warn(
        `[Upload] ${label} attempt ${attempt + 1} failed:`,
        msg
      );

      // abort = timeout → 재시도
      // Failed to fetch = 네트워크 오류 → 재시도
      if (attempt < retries) {
        // 짧은 대기 후 재시도
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // 재시도 모두 실패
  const base = lastError?.message ?? "Unknown error";
  if (base.toLowerCase().includes("abort")) {
    throw new Error(`${label}: 서버 응답 시간 초과 (${timeoutMs / 1000}초)`);
  }
  if (base.toLowerCase().includes("failed to fetch")) {
    throw new Error(
      `${label}: 네트워크 연결 실패.\n` +
        (navigator.onLine
          ? "서버에 접근할 수 없습니다. 잠시 후 다시 시도해주세요."
          : "인터넷 연결을 확인해주세요.")
    );
  }
  throw new Error(`${label}: ${base}`);
}

// ─── 서버 프록시 (소용량 전용) ───

async function uploadViaProxy(
  file: Blob,
  key: string,
  contentType: string
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("key", key);
  form.append("contentType", contentType);

  const res = await apiFetch(
    "/api/upload/direct",
    { method: "POST", body: form },
    "서버 프록시 업로드",
    1,
    UPLOAD_TIMEOUT_MS
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `서버 업로드 실패 (${res.status})`);
  }
}

// ─── R2 업로드 (presigned URL) ───

async function uploadToR2(
  url: string,
  file: File,
  key: string,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  const safeBlob = toSafeBlob(file, contentType);

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
          : reject(new Error(`R2 XHR ${xhr.status}: ${xhr.statusText}`));
      xhr.onerror = () =>
        reject(new Error("R2 네트워크 오류 (XHR)"));
      xhr.ontimeout = () => reject(new Error("R2 업로드 시간 초과 (XHR)"));
      xhr.timeout = UPLOAD_TIMEOUT_MS;
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(safeBlob);
    });
    return;
  } catch (xhrErr) {
    console.warn("[Upload] XHR failed:", (xhrErr as Error).message);
  }

  // 2차: fetch + AbortController
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: safeBlob,
        signal: controller.signal,
      });
      if (res.ok) {
        onProgress(90);
        return;
      }
      console.warn("[Upload] Fetch PUT status:", res.status, res.statusText);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (fetchErr) {
    console.warn("[Upload] Fetch failed:", (fetchErr as Error).message);
  }

  // 3차: 서버 프록시 (소용량만)
  if (file.size <= SERVER_PROXY_LIMIT) {
    console.log("[Upload] Falling back to server proxy:", file.size, "bytes");
    await uploadViaProxy(safeBlob, key, contentType);
    onProgress(90);
    return;
  }

  throw new Error(
    "영상 업로드에 실패했어요.\n" +
      "Wi-Fi 환경에서 다시 시도하거나,\n" +
      "영상 용량을 줄여보세요."
  );
}

// ─── startUpload (legacy) ───

export async function startUpload() {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  try {
    store.setStatus("uploading");
    store.setProgress(0);

    const fileContentType = resolveContentType(store.file!);

    // 1. presigned URL
    const presignRes = await apiFetch(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: fileContentType }),
      },
      "Presign URL 요청"
    );
    if (!presignRes.ok) {
      const errBody = await presignRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `Presign 요청 실패 (${presignRes.status})`);
    }
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. R2 업로드
    await uploadToR2(url, store.file!, key, fileContentType, (pct) =>
      store.setProgress(pct)
    );
    store.setProgress(90);

    // 3. 썸네일
    store.setStatus("thumbnail");
    store.setProgress(92);

    const duration = await getFileDuration(store.file!);
    let thumbnailUrl: string | null = null;

    const thumbBlob = await captureVideoThumbnail(store.file!);
    if (thumbBlob) {
      try {
        const thumbPresign = await apiFetch(
          "/api/upload/presign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "thumbnail", clipId }),
          },
          "썸네일 Presign 요청"
        );
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
      } catch (thumbErr) {
        // 썸네일 실패는 치명적이지 않음 — 계속 진행
        console.warn("[Upload] Thumbnail failed:", thumbErr);
      }
    }

    // 4. 클립 저장
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

    const clipRes = await apiFetch(
      apiUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "클립 메타데이터 저장"
    );

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

// ─── startRenderUpload (v1.3 렌더 파이프라인) ───

export async function startRenderUpload() {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  try {
    store.setError(null);
    store.setRenderJobId(null);
    store.setStatus("uploading_raw");
    store.setProgress(0);

    const fileContentType = resolveContentType(store.file);

    // 1. presigned URL
    const presignRes = await apiFetch(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: fileContentType, prefix: "raw" }),
      },
      "Presign URL 요청"
    );
    if (!presignRes.ok) {
      const errBody = await presignRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `Presign 요청 실패 (${presignRes.status})`);
    }
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. R2 업로드
    await uploadToR2(url, store.file, key, fileContentType, (pct) =>
      store.setProgress(pct)
    );
    store.setProgress(90);

    // 3. 썸네일
    store.setStatus("thumbnail");
    store.setProgress(92);

    const duration = await getFileDuration(store.file);
    let thumbnailUrl: string | null = null;

    const thumbBlob = await captureVideoThumbnail(store.file);
    if (thumbBlob) {
      try {
        const thumbPresign = await apiFetch(
          "/api/upload/presign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "thumbnail", clipId }),
          },
          "썸네일 Presign 요청"
        );
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
      } catch (thumbErr) {
        console.warn("[Upload] Thumbnail failed:", thumbErr);
      }
    }

    // 4. 클립 메타데이터 저장
    store.setStatus("saving");
    store.setProgress(95);

    const videoUrl = getPublicVideoUrl(key);
    const isParentUpload = store.context === "parent" && store.childId;
    const apiUrl = isParentUpload ? "/api/parent/upload" : "/api/clips";
    const clipPayload = isParentUpload
      ? {
          child_id: store.childId,
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
          raw_key: key,
        }
      : {
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
          raw_key: key,
        };

    const clipRes = await apiFetch(
      apiUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clipPayload),
      },
      "클립 메타데이터 저장"
    );

    if (!clipRes.ok) {
      const errBody = await clipRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `클립 저장 실패 (${clipRes.status})`);
    }

    const clipData = (await clipRes.json().catch(() => ({}))) as {
      clip?: { id?: string };
    };
    const savedClipId = clipData.clip?.id ?? clipId;
    store.setClipId(savedClipId);

    // 5. 렌더 API 호출
    const renderParams = {
      trimStart: store.trimStart,
      ...(store.trimEnd !== null ? { trimEnd: store.trimEnd } : {}),
      ...(store.spotlightX !== null ? { spotlightX: store.spotlightX } : {}),
      ...(store.spotlightY !== null ? { spotlightY: store.spotlightY } : {}),
      ...(store.skillLabels.length > 0
        ? { skillLabels: store.skillLabels }
        : {}),
      ...(store.customLabels.length > 0
        ? { customLabels: store.customLabels }
        : {}),
      ...(store.slowmoStart !== null ? { slowmoStart: store.slowmoStart } : {}),
      ...(store.slowmoEnd !== null ? { slowmoEnd: store.slowmoEnd } : {}),
      ...(store.slowmoStart !== null &&
      store.slowmoEnd !== null &&
      store.slowmoSpeed > 0
        ? { slowmoSpeed: store.slowmoSpeed }
        : {}),
      ...(store.bgmId ? { bgmId: store.bgmId } : {}),
      ...(Object.keys(store.effects).length > 0
        ? { effects: store.effects }
        : {}),
    };

    const renderRes = await apiFetch(
      "/api/render",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: savedClipId,
          inputKey: key,
          params: renderParams,
        }),
      },
      "렌더 요청"
    );

    if (!renderRes.ok) {
      const errBody = await renderRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `렌더 요청 실패 (${renderRes.status})`);
    }

    const { job } = await renderRes.json();
    store.setRenderJobId(job.id);
    store.setStatus("rendering");
    store.setProgress(0);
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  }
}
