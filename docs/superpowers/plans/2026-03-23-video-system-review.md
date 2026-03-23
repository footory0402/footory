# 영상 시스템 종합 검토 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오픈 전 영상 재생 에러 처리, 업로드 UX 가시성, 업로드 안정성을 보완한다.

**Architecture:** P0(재생 품질) → P1(업로드 UX) → P2(안정성) 순서로 진행. 기존 업로드 파이프라인 구조는 변경하지 않고, 사용자 체감 품질 관련 코드만 추가/수정. Zustand store에 2개 필드 추가 (`r2RetryCount`, `lastProgressTime`).

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, Zustand, Cloudflare R2

**Spec:** `docs/superpowers/specs/2026-03-23-video-system-review-design.md`

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|------|----------|------|
| `src/stores/upload-store.ts` | 수정 | `r2RetryCount`, `lastProgressTime` 필드 추가 |
| `src/components/ui/LazyVideo.tsx` | 수정 | `"use client"` 전환 + 로딩/에러/버퍼링 상태 |
| `src/components/player/ClipPlayerSheet.tsx` | 수정 | 에러 UI + preload + 카운터 리셋 |
| `src/app/upload/page.tsx` | 수정 | 단계별 상태 텍스트 + 프로그레스 바 |
| `src/components/upload/GlobalUploadIndicator.tsx` | 수정 | 재시도 버튼 (기존 `/upload` 이동 교체) |
| `src/lib/upload-service.ts` | 수정 | visibilitychange 감지 + 완료 경로 변경 |
| `src/app/profile/page.tsx` | 수정 | useSearchParams로 초기 탭 결정 |
| `src/components/feed/FeedList.tsx` | 수정 | 구버전 호환 코드 제거 |
| `docs/UPLOAD-ARCHITECTURE.md` | 수정 | 섹션 6 UX 원칙 업데이트 |

---

### Task 1: Zustand store에 새 필드 추가

**Files:**
- Modify: `src/stores/upload-store.ts`

- [ ] **Step 1: `r2RetryCount`와 `lastProgressTime` 필드 추가**

`src/stores/upload-store.ts`의 `UploadState` 인터페이스에 추가:

```typescript
// v2.0 instant upload 섹션 뒤에 추가 (r2ClipId 아래)
r2RetryCount: number;
lastProgressTime: number | null;
```

setter 추가:

```typescript
setR2RetryCount: (n: number) => void;
setLastProgressTime: (t: number | null) => void;
```

`initial` 객체에 추가:

```typescript
r2RetryCount: 0,
lastProgressTime: null as number | null,
```

`create` 함수에 setter 추가:

```typescript
setR2RetryCount: (r2RetryCount) => set({ r2RetryCount }),
setLastProgressTime: (lastProgressTime) => set({ lastProgressTime }),
```

`reset()` 시 이 필드들도 초기화됨 (initial 스프레드로 자동 포함).

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음 (또는 기존 에러만)

- [ ] **Step 3: 커밋**

```bash
git add src/stores/upload-store.ts
git commit -m "[Video-Review] feat: upload store에 r2RetryCount, lastProgressTime 필드 추가"
```

---

### Task 2: LazyVideo 로딩/에러/버퍼링 상태 추가

**Files:**
- Modify: `src/components/ui/LazyVideo.tsx`

- [ ] **Step 1: `"use client"` 디렉티브 추가 + 상태 관리 구현**

`src/components/ui/LazyVideo.tsx` 전체를 아래로 교체:

```typescript
"use client";

import { type ComponentPropsWithoutRef, type RefObject, useState, useRef, useEffect, useCallback } from "react";

interface LazyVideoProps extends Omit<ComponentPropsWithoutRef<"video">, "ref" | "src"> {
  src: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function requestVideoPlay(videoRef: RefObject<HTMLVideoElement | null>) {
  requestAnimationFrame(() => {
    void videoRef.current?.play().catch(() => {});
  });
}

export default function LazyVideo({
  videoRef,
  src,
  poster,
  preload = "none",
  controls = true,
  playsInline = true,
  ...props
}: LazyVideoProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [buffering, setBuffering] = useState(false);
  const bufferTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleLoadStart = useCallback(() => setStatus("loading"), []);
  const handleCanPlay = useCallback(() => setStatus("ready"), []);
  const handleError = useCallback(() => setStatus("error"), []);

  const handleWaiting = useCallback(() => {
    if (bufferTimer.current) clearTimeout(bufferTimer.current);
    bufferTimer.current = setTimeout(() => setBuffering(true), 300);
  }, []);

  const handlePlaying = useCallback(() => {
    if (bufferTimer.current) clearTimeout(bufferTimer.current);
    setBuffering(false);
  }, []);

  useEffect(() => {
    return () => {
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
    };
  }, []);

  // 외부 className/style은 래퍼에 전달, video에는 나머지 props만
  const { className: outerClassName, style: outerStyle, ...videoProps } = props as Record<string, unknown>;

  return (
    <div className={`relative ${(outerClassName as string) ?? ""}`} style={outerStyle as React.CSSProperties}>
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        preload={preload}
        controls={controls}
        playsInline={playsInline}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        {...videoProps}
      />

      {/* 로딩 스피너 */}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}

      {/* 버퍼링 스피너 */}
      {buffering && status === "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}

      {/* 에러 */}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[11px] text-text-3">재생 불가</span>
        </div>
      )}
    </div>
  );
}
```

핵심 포인트:
- `"use client"` 추가
- `onWaiting`에 300ms 디바운스 (LTE 깜빡임 방지)
- 래퍼 `<div className="relative">` 추가 (오버레이 기준점) — className/style은 래퍼로 전달하여 기존 레이아웃 유지
- 기존 `requestVideoPlay` export 유지 (외부 사용)

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/ui/LazyVideo.tsx
git commit -m "[Video-Review] feat: LazyVideo 로딩/에러/버퍼링 상태 UI 추가"
```

---

### Task 3: ClipPlayerSheet 에러 처리 + preload

**Files:**
- Modify: `src/components/player/ClipPlayerSheet.tsx`

- [ ] **Step 1: 에러 상태 + 재시도 카운터 state 추가**

`src/components/player/ClipPlayerSheet.tsx`의 기존 state 선언부 (line 36 부근, `paused` state 아래)에 추가:

```typescript
// Video error state
const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
const [retryCount, setRetryCount] = useState(0);
```

- [ ] **Step 2: index 변경 useEffect에 에러 리셋 추가**

기존 `useEffect` (line 89~97)의 `setConfirmDelete(false);` 아래에 추가:

```typescript
setVideoError(null);
setRetryCount(0);
```

- [ ] **Step 3: 에러 메시지 헬퍼 함수 추가**

컴포넌트 함수 바깥 (line 5 아래, 인터페이스 정의 부근)에 추가:

```typescript
function getVideoErrorMessage(code: number): { message: string; retryable: boolean } {
  switch (code) {
    case 2: return { message: "네트워크 오류로 영상을 불러올 수 없습니다", retryable: true };
    case 3: return { message: "이 영상 형식은 기기에서 지원하지 않습니다", retryable: false };
    case 4: return { message: "영상을 재생할 수 없습니다", retryable: true };
    default: return { message: "영상을 불러올 수 없습니다", retryable: true };
  }
}
```

- [ ] **Step 4: video 이벤트 리스너에 onError 추가**

기존 `useEffect` (line 106~127)의 `v.addEventListener("loadedmetadata", onLoaded);` 아래에 추가:

```typescript
const onError = () => {
  const code = v.error?.code ?? 0;
  const { message } = getVideoErrorMessage(code);
  setVideoError({ code, message });
};
v.addEventListener("error", onError);
```

cleanup return에 추가:

```typescript
v.removeEventListener("error", onError);
```

- [ ] **Step 5: 재시도 핸들러 추가**

`handleTap` 함수 아래에 추가:

```typescript
const handleRetry = useCallback(() => {
  const v = videoRef.current;
  if (!v || !clip) return;
  const count = retryCount + 1;
  setRetryCount(count);
  if (count > 3) return; // 3회 재시도 후 (총 4회 시도) 재시도 불가
  setVideoError(null);
  // cache-busting으로 캐시된 실패 응답 방지
  const separator = clip.videoUrl.includes("?") ? "&" : "?";
  v.src = `${clip.videoUrl}${separator}t=${Date.now()}`;
  v.load();
}, [retryCount, clip]);
```

- [ ] **Step 6: video 태그에 preload 추가 + 에러 UI 렌더링**

기존 `<video>` 태그 (line 332~346)를 수정 — `preload="metadata"` 추가:

```typescript
<video
  key={clip.id}
  ref={videoRef}
  src={clip.videoUrl || undefined}
  autoPlay={!!clip.videoUrl}
  playsInline
  preload="metadata"
  className="w-full"
  style={{
    maxHeight: "52vh",
    transform: swiping ? `translateX(${swipeX * 0.3}px)` : undefined,
    transition: swiping ? "none" : "transform 0.2s ease",
    opacity: swiping ? Math.max(0.5, 1 - Math.abs(swipeX) / 300) : 1,
    visibility: videoError ? "hidden" : undefined,
    height: videoError ? 0 : undefined,
    overflow: videoError ? "hidden" : undefined,
  }}
  onClick={(e) => e.preventDefault()}
/>
```

`<video>` 태그 바로 아래 (Touch overlay 전)에 에러 UI 추가:

```typescript
{/* Video error UI */}
{videoError && (
  <div className="flex aspect-video max-h-[52vh] w-full flex-col items-center justify-center gap-3 bg-[#111113]">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-[13px] text-text-2 text-center px-6">{videoError.message}</p>
    {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
      <button
        onClick={handleRetry}
        className="rounded-lg bg-white/[0.08] px-4 py-2 text-[12px] font-medium text-text-1 active:bg-white/[0.12]"
      >
        다시 시도
      </button>
    )}
    {retryCount >= 3 && (
      <p className="text-[11px] text-text-3 text-center px-6">
        문제가 계속되면 영상을 다시 업로드해 주세요
      </p>
    )}
  </div>
)}
```

- [ ] **Step 7: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/components/player/ClipPlayerSheet.tsx
git commit -m "[Video-Review] feat: ClipPlayerSheet 에러 UI + preload + MediaError 분기"
```

---

### Task 4: 업로드 페이지 단계별 상태 텍스트

**Files:**
- Modify: `src/app/upload/page.tsx`

- [ ] **Step 1: 상태 텍스트 헬퍼 + 추가 store 구독 추가**

`src/app/upload/page.tsx`에서 기존 store 구독 (line 42~43) 아래에 추가:

```typescript
const compressProgress = useUploadStore((s) => s.compressProgress);
const r2Progress = useUploadStore((s) => s.r2Progress);
```

올리기 버튼 바로 위 (line 245 `{/* 올리기 버튼 */}` 주석 위)에 상태 텍스트 컴포넌트 추가:

```typescript
{/* 준비 상태 표시 */}
{store.file && isPreparing && (() => {
  const isIndeterminate = compressStatus === "loading";
  const pct = compressStatus === "compressing"
    ? compressProgress
    : r2Status === "uploading"
      ? r2Progress
      : 0;
  const label = compressStatus === "loading"
    ? "압축 엔진 로딩 중..."
    : compressStatus === "compressing"
      ? `영상 압축 중... ${compressProgress}%`
      : r2Status === "uploading"
        ? `영상 준비 중... ${r2Progress}%`
        : "준비 중...";
  return (
    <div className="flex flex-col gap-2 animate-fade-up">
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {isIndeterminate ? (
          <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-accent/50" />
        ) : (
          <div
            className="h-full rounded-full bg-accent/60 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="text-center text-[11px] text-text-3">{label}</p>
    </div>
  );
})()}
```

`globals.css`에 indeterminate 애니메이션 keyframe 추가 (기존 커스텀 애니메이션 섹션에):

```css
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(200%); }
  100% { transform: translateX(-100%); }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/upload/page.tsx
git commit -m "[Video-Review] feat: 업로드 페이지 단계별 상태 텍스트 + 프로그레스 바"
```

---

### Task 5: GlobalUploadIndicator 재시도 버튼

**Files:**
- Modify: `src/components/upload/GlobalUploadIndicator.tsx`

- [ ] **Step 1: 재시도 로직 구현**

`src/components/upload/GlobalUploadIndicator.tsx`의 `import` 섹션에 추가:

```typescript
import { startR2BackgroundUpload } from "@/lib/upload-service";
```

기존 `handleTap` 함수 (line 72~80)를 교체:

```typescript
const handleTap = () => {
  if (isError) {
    const s = useUploadStore.getState();
    const retryCount = s.r2RetryCount;
    if (retryCount >= 3) {
      // 3회 초과 — 처음부터 다시
      s.reset();
      router.push("/upload");
      return;
    }
    // 직접 재시도 — 새 presigned URL로 R2 업로드 재시작
    // status를 "uploading"으로 설정하여 인디케이터가 유지되도록 함
    s.setR2RetryCount(retryCount + 1);
    s.setError(null);
    s.setStatus("uploading");
    s.setProgress(0);
    startR2BackgroundUpload();
  } else if (isDone) {
    useUploadStore.getState().reset();
    router.push("/profile");
  }
  // 업로드 중엔 탭해도 무시 — 업로드 방해 방지
};
```

기존 `handleClose` 함수 (line 82~88)를 수정 — 에러 상태에서 reset 시 파일 보존:

```typescript
const handleClose = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (!isActive) {
    setDismissed(true);
    if (isDone) useUploadStore.getState().reset();
    // 에러 상태에서는 reset하지 않음 — 파일 보존하여 재시도 가능
  }
};
```

`getLabel` 함수의 error case (line 31) 수정:

```typescript
case "error": {
  const retryCount = useUploadStore.getState().r2RetryCount;
  return retryCount >= 3
    ? "업로드 실패 — 탭하여 다시 시작"
    : "업로드 실패 — 탭하여 재시도";
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/upload/GlobalUploadIndicator.tsx
git commit -m "[Video-Review] feat: GlobalUploadIndicator 직접 재시도 + 3회 초과 처리"
```

---

### Task 6: upload-service.ts — visibilitychange 감지 + 완료 경로 변경

**Files:**
- Modify: `src/lib/upload-service.ts`

- [ ] **Step 1: startR2BackgroundUpload에 visibilitychange 리스너 추가**

`src/lib/upload-service.ts`의 `startR2BackgroundUpload` 함수 (line 603~685)를 수정.

먼저 모듈 레벨 (파일 상단, `bgUploadGeneration` 선언 근처)에 현재 활성 XHR 참조 추가:

```typescript
let activeXhr: XMLHttpRequest | null = null;
```

그리고 기존 `xhrUploadPart` 함수에서 XHR 생성 직후 `activeXhr = xhr;`를 추가하고, 완료/에러 시 `activeXhr = null;`로 해제.

IIFE `(async () => {` 내부의 `await acquireWakeLock();` 바로 아래에 visibilitychange 리스너 등록:

```typescript
// visibilitychange 감지 — 앱 이탈 후 복귀 시 멈춤 확인
const handleVisibility = () => {
  if (document.visibilityState !== "visible") return;
  if (generation !== bgUploadGeneration) return;
  const s = useUploadStore.getState();
  if (s.r2Status !== "uploading") return;
  const lastTime = s.lastProgressTime;
  if (!lastTime) return;
  const stalled = Date.now() - lastTime > 30_000; // 30초 이상 progress 없음
  if (stalled) {
    console.warn("[Upload] Stalled upload detected after visibility change, retrying...");
    // 기존 XHR을 명시적으로 abort (스펙 요구사항)
    if (activeXhr) {
      activeXhr.abort();
      activeXhr = null;
    }
    // 새로운 업로드 시작 (재귀적 호출 방지를 위해 setTimeout)
    setTimeout(() => startR2BackgroundUpload(), 0);
  }
};
document.addEventListener("visibilitychange", handleVisibility);
```

progress 콜백에 `lastProgressTime` 업데이트 추가 — 기존 `(pct) => {` 부분 (line 666~669)을 수정:

```typescript
(pct) => {
  if (generation === bgUploadGeneration) {
    useUploadStore.getState().setR2Progress(pct);
    useUploadStore.getState().setLastProgressTime(Date.now());
  }
},
```

`finally` 블록 (line 681~683)에 리스너 해제 추가:

```typescript
} finally {
  document.removeEventListener("visibilitychange", handleVisibility);
  releaseWakeLock();
}
```

- [ ] **Step 2: startUpload의 완료 경로를 `/profile?tab=highlights`로 변경**

`startUpload` 함수 내부에서는 router를 직접 사용하지 않음. 실제 이동은 `upload/page.tsx`에서 처리.

`src/app/upload/page.tsx`의 `handleUpload` 함수 (line 97~109)의 setTimeout을 수정:

```typescript
setTimeout(() => router.replace("/profile?tab=highlights"), 150);
```

- [ ] **Step 3: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/lib/upload-service.ts src/app/upload/page.tsx
git commit -m "[Video-Review] feat: visibilitychange 이탈 감지 + 완료 시 highlights 탭 이동"
```

---

### Task 7: profile/page.tsx — searchParams로 초기 탭 결정

**Files:**
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: useSearchParams import 추가 + 초기 탭 로직**

`src/app/profile/page.tsx`에서 기존 import (line 4)를 수정:

```typescript
import { useRouter, useSearchParams } from "next/navigation";
```

기존 activeTab 초기값 (line 31)을 수정:

```typescript
const searchParams = useSearchParams();
const initialTab = searchParams.get("tab");
const [activeTab, setActiveTab] = useState<ProfileTabKey>(
  initialTab === "records" ? "records" : initialTab === "career" ? "career" : "highlights"
);
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/profile/page.tsx
git commit -m "[Video-Review] feat: 프로필 페이지 searchParams 기반 초기 탭 선택"
```

---

### Task 8: FeedList 구버전 호환 코드 제거

**Files:**
- Modify: `src/components/feed/FeedList.tsx`

- [ ] **Step 1: handlePlay에서 구버전 fetch 제거**

`src/components/feed/FeedList.tsx`의 `handlePlay` 함수 (line 55~80)를 수정. 구버전 호환 fetch (line 59~70)를 제거:

```typescript
const handlePlay = useCallback(async (item: FeedItemEnriched) => {
  const meta = item.metadata as Record<string, unknown>;
  const videoUrl = typeof meta.video_url === "string" ? meta.video_url : null;

  if (!videoUrl) return;
  setPlayerClips([{
    id: item.reference_id ?? item.id,
    videoUrl,
    thumbnailUrl: typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null,
    tag: Array.isArray(meta.tags) ? (meta.tags as string[])[0] : undefined,
    duration: typeof meta.duration === "number" ? meta.duration : undefined,
  }]);
}, []);
```

`handlePlay`이 더 이상 async일 필요 없으므로 `async` 제거도 가능하지만, 기존 인터페이스 호환을 위해 유지해도 무방.

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/feed/FeedList.tsx
git commit -m "[Video-Review] refactor: FeedList 구버전 feed_items 호환 코드 제거"
```

---

### Task 9: UPLOAD-ARCHITECTURE.md 업데이트

**Files:**
- Modify: `docs/UPLOAD-ARCHITECTURE.md`

- [ ] **Step 1: 섹션 6 UX 플로우 설계 원칙 업데이트**

`docs/UPLOAD-ARCHITECTURE.md`의 섹션 6 (line 129~141)에서 마지막 줄 (line 140)을 수정:

기존:
```
**내부 진행 상태는 숨김**: 압축 퍼센트, R2 진행 바 등은 사용자에게 노출하지 않음. 버튼 상태만으로 충분.
```

교체:
```
**내부 진행 상태 노출**: 올리기 버튼 하단에 단계별 상태 텍스트 + 프로그레스 바 표시. "준비 중..." 버튼만으로는 사용자가 "왜 안 눌러지지?"라는 혼란을 겪을 수 있으므로, 압축/업로드 진행 상태를 명확히 노출. (2026-03-23 원칙 변경)
```

- [ ] **Step 2: 커밋**

```bash
git add docs/UPLOAD-ARCHITECTURE.md
git commit -m "[Video-Review] docs: UPLOAD-ARCHITECTURE 섹션 6 UX 원칙 업데이트"
```

---

## 작업 순서 요약

| Task | 내용 | 의존성 |
|------|------|--------|
| 1 | Zustand store 필드 추가 | 없음 |
| 2 | LazyVideo 상태 UI | 없음 |
| 3 | ClipPlayerSheet 에러 UI | 없음 |
| 4 | 업로드 상태 텍스트 | 없음 |
| 5 | GlobalUploadIndicator 재시도 | Task 1 (r2RetryCount) |
| 6 | visibilitychange + 완료 경로 | Task 1 (lastProgressTime) |
| 7 | profile searchParams | 없음 |
| 8 | FeedList 정리 | 없음 |
| 9 | UPLOAD-ARCHITECTURE 문서 | Task 4 (원칙 변경 반영) |

Task 1~4, 7~8은 독립적으로 병렬 실행 가능. Task 5, 6은 Task 1 완료 후 실행. Task 9는 마지막.
