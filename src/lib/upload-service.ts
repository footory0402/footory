import { getPublicVideoUrl } from "@/lib/r2-client";
import { captureVideoThumbnail } from "@/lib/thumbnail";
import { getFileDuration } from "@/lib/video";
import { useUploadStore } from "@/stores/upload-store";

const SERVER_PROXY_LIMIT = 4 * 1024 * 1024; // 4MB (Vercel payload 제한)
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10분 (기본값)
const MAX_DIRECT_RETRIES = 3; // presigned URL 최대 재시도 횟수
// Multipart: 50MB 이상 파일에 적용 — 청크 단위 재시도로 신뢰성 향상.
// Hobby 플랜(10초 하드캡)에서는 complete API가 실패할 수 있으므로
// multipart 실패 시 단일 PUT 폴백 로직을 uploadToR2에서 처리.
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 유지 (혹시라도 multipart 동작 시 R2 최소 요건)
const CONCURRENT_PARTS = 3;

/** 파일 크기 기반 동적 타임아웃 (50KB/s 기준, 최소 3분) */
function calcUploadTimeout(fileSize: number): number {
  const minTimeout = 3 * 60 * 1000; // 3분
  const estimatedMs = (fileSize / (50 * 1024)) * 1000; // 50KB/s 기준
  return Math.max(minTimeout, Math.min(estimatedMs, UPLOAD_TIMEOUT_MS));
}
const API_TIMEOUT_MS = 60_000; // API 호출 60초

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

// ─── 시뮬레이션 프로그레스 (fetch 폴백용) ───

/**
 * fetch는 upload progress 이벤트를 지원하지 않으므로,
 * 파일 크기 기반으로 예상 시간을 계산하여 프로그레스를 시뮬레이션한다.
 * 실제 업로드 완료 시 즉시 타겟까지 점프.
 */
function createProgressSimulator(
  fileSize: number,
  startPct: number,
  endPct: number,
  onProgress: (pct: number) => void
) {
  // 모바일 평균 업로드 속도 기준 (Wi-Fi ~2MB/s, LTE ~500KB/s)
  const estimatedSeconds = Math.max(2, fileSize / (500 * 1024));
  const range = endPct - startPct;
  // 처음 빠르게 올라가다 점점 느려지는 로그 커브
  const intervalMs = 500;
  const totalSteps = Math.ceil((estimatedSeconds * 1000) / intervalMs);
  let step = 0;
  let stopped = false;

  const timer = setInterval(() => {
    if (stopped) return;
    step++;
    // 로그 커브: 빠르게 시작 → 80% 지점에서 감속 → endPct-2%에서 정지
    const ratio = Math.min(step / totalSteps, 1);
    const eased = 1 - Math.pow(1 - ratio, 2.5); // ease-out
    const capped = Math.min(eased, 0.95); // endPct 직전에서 멈춤
    const pct = startPct + range * capped;
    onProgress(Math.round(pct));

    if (capped >= 0.95) {
      clearInterval(timer);
    }
  }, intervalMs);

  return {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
    finish() {
      stopped = true;
      clearInterval(timer);
      onProgress(endPct);
    },
  };
}

// ─── Multipart Upload (10MB 이상 파일) ───

/**
 * XHR로 단일 파트를 업로드하고 ETag을 반환.
 * onProgress는 이 파트의 loaded 바이트를 보고함.
 */
function xhrUploadPart(
  url: string,
  chunk: Blob,
  timeout: number,
  onProgress: (loaded: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let stallTimer: ReturnType<typeof setInterval> | null = null;
    let lastProgressTime = Date.now();

    const cleanup = () => {
      if (stallTimer) { clearInterval(stallTimer); stallTimer = null; }
    };

    // 멈춤 감지: 45초간 progress 없으면 abort (모바일 네트워크 고려)
    stallTimer = setInterval(() => {
      if (Date.now() - lastProgressTime > 45_000) {
        cleanup();
        xhr.abort();
        reject(new Error("파트 업로드 멈춤"));
      }
    }, 5000);

    xhr.upload.onprogress = (e) => {
      lastProgressTime = Date.now();
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.upload.onloadstart = () => { lastProgressTime = Date.now(); };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag") ?? `"part-${Date.now()}"`;
        resolve(etag);
      } else {
        reject(new Error(`파트 업로드 실패: ${xhr.status}`));
      }
    };
    xhr.onerror = () => { cleanup(); reject(new Error("파트 네트워크 오류")); };
    xhr.ontimeout = () => { cleanup(); reject(new Error("파트 시간 초과")); };
    xhr.timeout = timeout;
    xhr.open("PUT", url);
    // Content-Type 헤더를 설정하지 않음 (presigned URL에 이미 포함)
    xhr.send(chunk);
  });
}

/**
 * 파트 업로드 + 자동 재시도 (최대 2회).
 * 모바일 네트워크에서 일시적 끊김에 대응.
 */
async function xhrUploadPartWithRetry(
  url: string,
  chunk: Blob,
  timeout: number,
  onProgress: (loaded: number) => void,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await xhrUploadPart(url, chunk, timeout, onProgress);
    } catch (err) {
      const msg = (err as Error).message;
      console.warn(`[Upload] Part attempt ${attempt + 1} failed:`, msg);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      onProgress(0);
    }
  }
  throw new Error("파트 업로드 실패");
}

/**
 * Multipart Upload 실행.
 * 5MB 청크로 나눠 CONCURRENT_PARTS개씩 병렬 업로드.
 * progress는 0~90 범위로 보고.
 */
async function multipartUploadToR2(
  file: File,
  key: string,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  const totalSize = file.size;
  const timeout = calcUploadTimeout(totalSize);

  // 1. Multipart 시작
  const initRes = await apiFetch(
    "/api/upload/multipart",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init", key, contentType }),
    },
    "Multipart 시작"
  );
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Multipart 시작 실패");
  }
  const { uploadId } = await initRes.json();

  // 2. 청크 분할
  const chunks: Blob[] = [];
  for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
    chunks.push(file.slice(offset, Math.min(offset + CHUNK_SIZE, totalSize)));
  }
  const totalParts = chunks.length;

  // 3. 모든 파트 presigned URL 일괄 발급 (1회 API 호출)
  const batchRes = await apiFetch(
    "/api/upload/multipart",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "presign-parts",
        key,
        uploadId,
        partCount: totalParts,
      }),
    },
    "파트 URL 일괄 발급"
  );
  if (!batchRes.ok) {
    const err = await batchRes.json().catch(() => ({}));
    throw new Error(err.error ?? "파트 URL 발급 실패");
  }
  const { urls: partUrls } = await batchRes.json();

  // 4. 병렬 업로드 (CONCURRENT_PARTS씩)
  // 파트별 업로드된 바이트 추적
  const partLoaded: number[] = new Array(totalParts).fill(0);

  const reportProgress = () => {
    const uploaded = partLoaded.reduce((a, b) => a + b, 0);
    onProgress(Math.round((uploaded / totalSize) * 90));
  };

  try {
    let nextIdx = 0;

    async function uploadWorker() {
      while (nextIdx < totalParts) {
        const idx = nextIdx++;
        const chunk = chunks[idx];
        const url = partUrls[idx];

        await xhrUploadPartWithRetry(url, chunk, timeout, (loaded) => {
          partLoaded[idx] = loaded;
          reportProgress();
        });
        // 완료 시 정확한 크기로 고정
        partLoaded[idx] = chunk.size;
        reportProgress();
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENT_PARTS, totalParts) }, uploadWorker)
    );
  } catch (err) {
    // 실패 시 abort (백그라운드, 에러 무시)
    apiFetch(
      "/api/upload/multipart",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abort", key, uploadId }),
      },
      "Multipart 중단"
    ).catch(() => {});
    throw err;
  }

  // 5. Complete (서버에서 ListParts로 ETags 자동 취합)
  // complete 호출 중에도 progress가 90%에서 멈춰 보이지 않도록 91→94%로 서서히 증가
  let completeSimPct = 91;
  onProgress(completeSimPct);
  const completeSimTimer = setInterval(() => {
    if (completeSimPct < 94) {
      completeSimPct++;
      onProgress(completeSimPct);
    }
  }, 3000);

  let completeRes: Response;
  try {
    completeRes = await apiFetch(
      "/api/upload/multipart",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", key, uploadId }),
      },
      "Multipart 완료",
      2, // 재시도 2회
      90_000 // 90초 타임아웃 (ListParts가 오래 걸릴 수 있음)
    );
  } finally {
    clearInterval(completeSimTimer);
  }

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Multipart 완료 실패");
  }
  onProgress(95);
}

// ─── R2 업로드 (presigned URL) ───

/** 파일 크기 기반 동적 stall 타임아웃 (progress 없을 때 abort 기준) */
function calcStallTimeout(fileSize: number): number {
  if (fileSize < 10 * 1024 * 1024) return 15_000; // 10MB 미만 → 15초
  if (fileSize < 50 * 1024 * 1024) return 30_000; // 10~50MB → 30초
  return 60_000;                                    // 50MB 이상 → 60초
}

/**
 * XHR로 presigned URL에 PUT 업로드. 멈춤 감지 포함.
 * 성공 시 resolve, 실패/멈춤 시 reject.
 */
function xhrUpload(
  url: string,
  file: File,
  contentType: string,
  timeout: number,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhr = xhr;
    let lastProgressTime = Date.now();
    let stallTimer: ReturnType<typeof setInterval> | null = null;
    const stallTimeout = calcStallTimeout(file.size);

    const cleanup = () => {
      if (stallTimer) { clearInterval(stallTimer); stallTimer = null; }
      if (activeXhr === xhr) activeXhr = null;
    };

    // 멈춤 감지: 파일 크기 기반 타임아웃 동안 progress 이벤트 없으면 abort
    stallTimer = setInterval(() => {
      if (Date.now() - lastProgressTime > stallTimeout) {
        console.warn("[Upload] XHR stalled — aborting");
        cleanup();
        xhr.abort();
        reject(new Error("업로드 멈춤 (progress 없음)"));
      }
    }, 5000);

    xhr.upload.onprogress = (e) => {
      lastProgressTime = Date.now();
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    };
    // loadstart 도 progress로 취급 (연결 성공 = 살아있음)
    xhr.upload.onloadstart = () => { lastProgressTime = Date.now(); };

    xhr.onload = () => {
      cleanup();
      xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 ${xhr.status}: ${xhr.statusText}`));
    };
    xhr.onerror = () => { cleanup(); reject(new Error("R2 네트워크 오류")); };
    xhr.ontimeout = () => { cleanup(); reject(new Error("R2 시간 초과")); };
    xhr.timeout = timeout;
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

async function uploadToR2(
  url: string,
  file: File,
  key: string,
  contentType: string,
  onProgress: (pct: number) => void,
  getNewPresignedUrl?: () => Promise<string>
): Promise<void> {
  // 50MB 이상이면 Multipart Upload 시도 (청크 단위 재시도로 신뢰성 향상)
  if (file.size >= MULTIPART_THRESHOLD) {
    try {
      await multipartUploadToR2(file, key, contentType, onProgress);
      return;
    } catch (err) {
      const msg = (err as Error).message;
      console.warn("[Upload] Multipart failed, falling back to single PUT:", msg);
      // Multipart 실패 (Hobby 플랜 타임아웃 등) → 단일 PUT으로 폴백
      onProgress(0);
      // 새 presigned URL 발급 후 단일 PUT 시도
      const fallbackUrl = getNewPresignedUrl ? await getNewPresignedUrl() : url;
      try {
        await xhrUpload(fallbackUrl, file, contentType, calcUploadTimeout(file.size), onProgress);
        return;
      } catch (fallbackErr) {
        const fallbackMsg = (fallbackErr as Error).message;
        console.warn("[Upload] Single PUT fallback also failed:", fallbackMsg);
        throw new Error(
          "영상 업로드에 실패했어요.\n" +
            "Wi-Fi 환경에서 다시 시도해주세요.\n" +
            `(${fallbackMsg})`
        );
      }
    }
  }

  // 50MB 미만: 기존 단일 PUT 방식 (XHR → fetch → proxy)
  const timeout = calcUploadTimeout(file.size);
  const errors: string[] = [];

  // 최대 3회 시도: XHR(원본URL) → XHR(새URL) → fetch(새URL)
  for (let attempt = 0; attempt < MAX_DIRECT_RETRIES; attempt++) {
    const currentUrl =
      attempt === 0 ? url : getNewPresignedUrl ? await getNewPresignedUrl() : url;

    // XHR 시도 (처음 2회)
    if (attempt < 2) {
      try {
        await xhrUpload(currentUrl, file, contentType, timeout, onProgress);
        return; // 성공
      } catch (err) {
        const msg = (err as Error).message;
        console.warn(`[Upload] XHR attempt ${attempt + 1} failed:`, msg);
        errors.push(`XHR#${attempt + 1}: ${msg}`);
        onProgress(Math.max(3, attempt * 3));
      }
    } else {
      // 3차: fetch 폴백 + 시뮬레이션 progress
      const sim = createProgressSimulator(file.size, 5, 85, onProgress);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const res = await fetch(currentUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
            signal: controller.signal,
          });
          if (res.ok) { sim.finish(); return; }
          errors.push(`fetch: ${res.status} ${res.statusText}`);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        errors.push(`fetch: ${(err as Error).message}`);
      } finally {
        sim.stop();
      }
    }
  }

  // 모든 직접 업로드 실패 → 서버 프록시 (4MB 이하)
  if (file.size <= SERVER_PROXY_LIMIT) {
    console.log("[Upload] Falling back to server proxy:", file.size, "bytes");
    // 프록시도 XHR로 progress 시뮬레이션 (10%에서 멈춤 방지)
    const sim = createProgressSimulator(file.size, 10, 88, onProgress);
    try {
      await uploadViaProxy(file, key, contentType);
      sim.finish();
    } catch (err) {
      sim.stop();
      throw err;
    }
    return;
  }

  // 최종 실패
  console.error("[Upload] All attempts failed:", errors);
  throw new Error(
    "영상 업로드에 실패했어요.\n" +
      "Wi-Fi 환경에서 다시 시도해주세요.\n" +
      `(${errors[errors.length - 1]})`
  );
}

// ─── Screen Wake Lock (업로드 중 화면 꺼짐 방지) ───

let wakeLock: WakeLockSentinel | null = null;

async function acquireWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {
    // 미지원 기기 무시
  }
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

// ─── Instant Upload (background R2 upload) ───

let bgUploadGeneration = 0;
let activeXhr: XMLHttpRequest | null = null;

function waitForR2Upload(): Promise<void> {
  return new Promise((resolve, reject) => {
    const current = useUploadStore.getState();
    if (current.r2Status === "done") { resolve(); return; }
    if (current.r2Status !== "uploading") { reject(new Error("R2 업로드 실패")); return; }
    const unsub = useUploadStore.subscribe((state) => {
      if (state.r2Status === "done") { unsub(); resolve(); }
      else if (state.r2Status !== "uploading") { unsub(); reject(new Error("R2 업로드 실패")); }
    });
  });
}

/**
 * 파일 선택 즉시 호출 — R2 업로드만 백그라운드로 시작.
 * 사용자가 태그/메모를 입력하는 동안 업로드가 병렬로 진행됨.
 * compressedFile이 있으면 우선 사용 (크기 절감).
 */
export function startR2BackgroundUpload() {
  const state = useUploadStore.getState();
  const file = state.compressedFile ?? state.file;
  if (!file) return;

  const generation = ++bgUploadGeneration;
  const s = useUploadStore.getState();
  s.setR2Status("uploading");
  s.setR2Progress(0);

  (async () => {
    await acquireWakeLock();

    // visibilitychange 감지 — 앱 이탈 후 복귀 시 멈춤 확인
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (generation !== bgUploadGeneration) return;
      const s = useUploadStore.getState();
      if (s.r2Status !== "uploading") return;
      const lastTime = s.lastProgressTime;
      if (!lastTime) return;
      const stalled = Date.now() - lastTime > 30_000;
      if (stalled) {
        console.warn("[Upload] Stalled upload detected after visibility change, retrying...");
        if (activeXhr) {
          activeXhr.abort();
          activeXhr = null;
        }
        setTimeout(() => startR2BackgroundUpload(), 0);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    try {
      const fileContentType = resolveContentType(file);

      const presignRes = await apiFetch(
        "/api/upload/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: fileContentType,
            fileName: file.name,
            fileSize: file.size,
          }),
        },
        "Presign URL 요청"
      );
      if (generation !== bgUploadGeneration) return;
      if (!presignRes.ok) {
        const errBody = await presignRes.json().catch(() => ({}));
        if (presignRes.status === 401) {
          throw new Error("로그인이 필요합니다");
        }
        throw new Error(errBody.error ?? `업로드 준비 실패 (${presignRes.status})`);
      }

      const { url, key, clipId } = await presignRes.json();
      if (generation !== bgUploadGeneration) return;

      const st = useUploadStore.getState();
      st.setR2Upload(key, clipId);
      st.setClipId(clipId);

      const getNewUrl = async () => {
        const res = await apiFetch(
          "/api/upload/presign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: fileContentType,
              fileName: file.name,
              fileSize: file.size,
              clipId,
            }),
          },
          "Presign URL 재발급"
        );
        if (!res.ok) throw new Error("Presign 재발급 실패");
        const data = await res.json();
        return data.url as string;
      };

      await uploadToR2(
        url, file, key, fileContentType,
        (pct) => {
          if (generation === bgUploadGeneration) {
            useUploadStore.getState().setR2Progress(pct);
            useUploadStore.getState().setLastProgressTime(Date.now());
          }
        },
        getNewUrl
      );

      if (generation !== bgUploadGeneration) return;
      useUploadStore.getState().setR2Progress(100);
      useUploadStore.getState().setR2Status("done");
    } catch (e) {
      if (generation !== bgUploadGeneration) return;
      const msg = e instanceof Error ? e.message : "업로드 실패";
      console.warn("[Upload] Background R2 upload failed:", msg);
      const st = useUploadStore.getState();
      st.setR2Status("error");
      st.setError(msg);
      // 주의: 여기서 setStatus("error") 호출하면 안 됨
      // 백그라운드 업로드 실패는 startUpload()에서 폴백 처리함
      // status를 error로 바꾸면 startUpload() 진입 자체가 차단됨
    } finally {
      document.removeEventListener("visibilitychange", handleVisibility);
      releaseWakeLock();
    }
  })();
}

// ─── startUpload (legacy) ───

export async function startUpload() {
  const store = useUploadStore.getState();
  if (!store.file) return;
  // idle 또는 error(백그라운드 업로드 실패 후 재시도) 상태에서만 진입
  if (store.status !== "idle" && store.status !== "error") return;

  await acquireWakeLock();
  try {
    store.setStatus("uploading");
    store.setProgress(0);

    // 압축 파일 우선 사용 (용량 절감)
    let uploadFile: File = store.compressedFile ?? store.file!;

    // 인트로 카드 합성 (effects.intro가 켜져 있으면)
    let introComposed = false;
    if (store.effects.intro) {
      try {
        store.setStatus("composing");
        store.setProgress(0);
        const { composeIntroCard } = await import("./intro-composer");
        const result = await composeIntroCard(uploadFile, (pct) => {
          store.setProgress(pct);
        });
        if (!result.skipped) {
          uploadFile = result.file;
          introComposed = true;
          // 합성된 파일은 새로 업로드해야 하므로 기존 백그라운드 업로드 무효화
          const s = useUploadStore.getState();
          s.setR2Status("idle");
          s.setR2Progress(0);
        } else {
          console.warn("[Upload] Intro card skipped:", result.reason);
        }
      } catch (err) {
        console.warn("[Upload] Intro compose failed:", err);
      }
      store.setStatus("uploading");
      store.setProgress(0);
    }
    const fileContentType = resolveContentType(uploadFile);
    let key = "";
    let clipId = "";

    // Try to reuse background R2 upload
    if (store.r2Status === "done" && store.r2Key && store.r2ClipId) {
      key = store.r2Key;
      clipId = store.r2ClipId;
    } else if (store.r2Status === "uploading") {
      // Background upload in progress — pipe progress and wait
      const unsub = useUploadStore.subscribe((state) => {
        if (state.r2Status === "uploading") {
          useUploadStore.getState().setProgress(state.r2Progress);
        }
      });
      try {
        await waitForR2Upload();
        const fresh = useUploadStore.getState();
        key = fresh.r2Key ?? "";
        clipId = fresh.r2ClipId ?? "";
      } catch {
        // Background upload failed — will fall through to direct upload
      } finally {
        unsub();
      }
    }

    // Fallback: direct upload if background wasn't available or failed
    if (!key || !clipId) {
      store.setProgress(0);
      const presignRes = await apiFetch(
        "/api/upload/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: fileContentType,
            fileName: uploadFile.name,
            fileSize: uploadFile.size,
          }),
        },
        "Presign URL 요청"
      );
      if (!presignRes.ok) {
        const errBody = await presignRes.json().catch(() => ({}));
        if (presignRes.status === 401) {
          throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
        }
        if (presignRes.status === 429) {
          throw new Error("업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.");
        }
        throw new Error(errBody.error ?? `업로드 준비 실패 (${presignRes.status})`);
      }
      const presignData = await presignRes.json();
      key = presignData.key;
      clipId = presignData.clipId;
      const getNewUrl = async () => {
        const res = await apiFetch(
          "/api/upload/presign",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: fileContentType,
              fileName: uploadFile.name,
              fileSize: uploadFile.size,
              clipId,
            }),
          },
          "Presign URL 재발급"
        );
        if (!res.ok) throw new Error("Presign 재발급 실패");
        const data = await res.json();
        return data.url as string;
      };
      await uploadToR2(presignData.url, uploadFile, key, fileContentType, (pct) =>
        store.setProgress(pct), getNewUrl
      );
    }
    store.setClipId(clipId);
    store.setProgress(95);

    // 3. 클립 저장 (썸네일은 백그라운드, duration은 store 캐시 활용)
    store.setStatus("saving");
    store.setProgress(96);

    const videoUrl = getPublicVideoUrl(key);

    // store.duration이 있으면 재활용 (트리머에서 이미 감지), 없으면 빠르게 시도
    const duration = store.duration ?? await getFileDuration(store.file!).catch(() => 0);

    // 클립 먼저 저장 (썸네일 없이 — 피드에서 video_url로 대체 표시)
    const highlightEnd = Math.min(duration || 30, 30);
    const isParentUpload = store.context === "parent" && store.childId;
    const apiUrl = isParentUpload ? "/api/parent/upload" : "/api/clips";
    const body = isParentUpload
      ? {
          child_id: store.childId,
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: uploadFile.size,
          tags: store.tags,
          thumbnail_url: null,
        }
      : {
          clip_id: clipId,
          video_url: videoUrl,
          duration_seconds: duration || null,
          file_size_bytes: uploadFile.size,
          memo: store.memo || null,
          tags: store.tags,
          thumbnail_url: null,
          highlight_start: store.highlightStart,
          highlight_end: highlightEnd,
          effects: store.effects,
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

    // 업로드 완료 — 사용자에게 즉시 성공 표시
    store.setProgress(100);
    store.setStatus("done");

    // 썸네일은 백그라운드에서 비동기 처리 (사용자 대기 없음)
    backgroundThumbnailUpload(store.file!, clipId).catch(() => {});
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  } finally {
    releaseWakeLock();
  }
}

// ─── startRenderUpload (v1.3 렌더 파이프라인) ───

/**
 * v1.3 렌더 파이프라인 업로드.
 * @param compressedFile 클라이언트 측 압축 파일 (있으면 우선 사용, 없으면 원본)
 */
export async function startRenderUpload(compressedFile?: File) {
  const store = useUploadStore.getState();
  if (!store.file || store.status !== "idle") return;

  // 업로드할 파일: 압축 완료 파일 > 원본
  const uploadFile = compressedFile ?? store.file;
  const clientTrimmed = !!compressedFile; // 압축 파일에는 트림이 이미 적용됨

  try {
    store.setError(null);
    store.setRenderJobId(null);
    store.setStatus("uploading_raw");
    store.setProgress(0);

    const fileContentType = resolveContentType(uploadFile);

    // 1. presigned URL
    const presignRes = await apiFetch(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: fileContentType,
          prefix: "raw",
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
        }),
      },
      "Presign URL 요청"
    );
    if (!presignRes.ok) {
      const errBody = await presignRes.json().catch(() => ({}));
      throw new Error(errBody.error ?? `Presign 요청 실패 (${presignRes.status})`);
    }
    const { url, key, clipId } = await presignRes.json();
    store.setClipId(clipId);

    // 2. R2 업로드 (재시도 시 새 presigned URL 발급)
    const getNewUrl = async () => {
      const res = await apiFetch(
        "/api/upload/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: fileContentType,
            prefix: "raw",
            fileName: uploadFile.name,
            fileSize: uploadFile.size,
            clipId,
          }),
        },
        "Presign URL 재발급"
      );
      if (!res.ok) throw new Error("Presign 재발급 실패");
      const data = await res.json();
      return data.url as string;
    };
    await uploadToR2(url, uploadFile, key, fileContentType, (pct) =>
      store.setProgress(pct), getNewUrl
    );
    store.setProgress(95);

    // 3. 클립 저장 + 렌더 요청 (duration은 store 캐시 활용)
    store.setStatus("saving");
    store.setProgress(96);

    const videoUrl = getPublicVideoUrl(key);
    const duration = store.duration ?? await getFileDuration(store.file).catch(() => 0);

    // 클립 메타데이터 저장 (썸네일 없이 — 피드에서 video_url로 대체 표시)
    const isParentUpload = store.context === "parent" && store.childId;
    const apiUrl = isParentUpload ? "/api/parent/upload" : "/api/clips";
    const clipPayload = {
      ...(isParentUpload ? { child_id: store.childId } : {}),
      clip_id: clipId,
      video_url: videoUrl,
      duration_seconds: duration || null,
      file_size_bytes: uploadFile.size,
      memo: store.memo || null,
      tags: store.tags,
      thumbnail_url: null,
      highlight_start: clientTrimmed ? 0 : store.trimStart,
      highlight_end: clientTrimmed ? Math.min(duration || 30, 30) : (store.trimEnd ?? Math.min(duration || 30, 30)),
      skill_labels: store.skillLabels,
      custom_labels: store.customLabels,
      trim_start: clientTrimmed ? 0 : store.trimStart,
      trim_end: clientTrimmed ? null : store.trimEnd,
      spotlight_x: store.spotlightX,
      spotlight_y: store.spotlightY,
      freeze_at: store.freezeAt,
      effects: store.effects,
      raw_key: key,
      client_trimmed: clientTrimmed,
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

    // 4. 렌더 API 호출 (RENDER_WORKER_URL 없으면 서버에서 graceful fallback)
    const renderParams = {
      trimStart: store.trimStart,
      ...(store.trimEnd !== null ? { trimEnd: store.trimEnd } : {}),
      ...(store.spotlightX !== null ? { spotlightX: store.spotlightX } : {}),
      ...(store.spotlightY !== null ? { spotlightY: store.spotlightY } : {}),
      ...(store.skillLabels.length > 0 ? { skillLabels: store.skillLabels } : {}),
      ...(store.customLabels.length > 0 ? { customLabels: store.customLabels } : {}),
      effects: store.effects,
    };

    console.log("[upload-service] renderParams:", JSON.stringify(renderParams, null, 2));

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

    // 렌더 워커 미설정 시 서버가 즉시 "done" 반환 → 바로 완료 처리
    if (job.status === "done") {
      store.setProgress(100);
      store.setStatus("done");
    } else {
      store.setRenderJobId(job.id);
      store.setStatus("rendering");
      store.setProgress(0);
    }

    // 썸네일은 백그라운드 (사용자 대기 없음) — 압축 파일 우선 사용
    backgroundThumbnailUpload(uploadFile, savedClipId).catch(() => {});
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "업로드 실패");
    store.setStatus("error");
  }
}

// ─── 백그라운드 썸네일 업로드 (사용자 대기 없음) ───

async function backgroundThumbnailUpload(file: File, clipId: string): Promise<void> {
  try {
    const thumbBlob = await captureVideoThumbnail(file);
    if (!thumbBlob) return;

    const thumbPresign = await apiFetch(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "thumbnail", clipId }),
      },
      "썸네일 Presign 요청"
    );
    if (!thumbPresign.ok) return;
    const { url: thumbUrl, key: thumbKey } = await thumbPresign.json();

    try {
      const thumbRes = await fetch(thumbUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbBlob,
      });
      if (!thumbRes.ok) throw new Error("thumb upload fail");
    } catch {
      await uploadViaProxy(thumbBlob, thumbKey, "image/jpeg");
    }

    const thumbnailUrl = getPublicVideoUrl(thumbKey);
    await apiFetch(
      `/api/clips/${clipId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail_url: thumbnailUrl }),
      },
      "썸네일 URL 업데이트"
    );
  } catch (err) {
    console.warn("[Upload] Background thumbnail failed:", err);
  }
}
