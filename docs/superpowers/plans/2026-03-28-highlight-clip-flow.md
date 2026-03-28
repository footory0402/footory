# 하이라이트 클립 플로우 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/editor/video` 페이지에서 장면 마킹 후 하이라이트 릴을 합성하고 업로드하는 end-to-end 플로우를 완성한다.

**Architecture:** 기존 `/editor/video` 페이지에 phase 상태 머신(onboarding→marking→confirm→processing→done)을 추가한다. confirm 화면에서 클립 리스트 확인 + EA FC 다이아몬드 마커 배치 후, ffmpeg.wasm `-c copy` trim+concat으로 합성하고 R2에 업로드한다.

**Tech Stack:** Next.js 16 App Router, ffmpeg.wasm 0.12.15, Cloudflare R2 (presigned PUT), Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-28-highlight-clip-flow-design.md`

---

## File Structure

### 수정하는 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/components/editor/video/types.ts` | ClipSegment에 `markerX`, `markerY` 필드 추가 |
| `src/app/editor/video/page.tsx` | phase 상태 머신 + "다음" 버튼 + 가이드 개선 + 뷰 분기 |
| `src/app/upload/page.tsx` | 워딩 변경 ("좋은 장면"→"원하는 구간"), 파일 제한 300MB 반영 |

### 새로 만드는 파일
| 파일 | 용도 |
|------|------|
| `src/components/editor/video/PlayerMarker.tsx` | EA FC 다이아몬드 마커 컴포넌트 |
| `src/components/editor/video/ClipThumbnail.tsx` | 클립 대표 프레임 캡처 + 마커 탭 영역 |
| `src/components/editor/video/ConfirmView.tsx` | 확인 화면 (클립 리스트 + 마커 + CTA) |
| `src/components/editor/video/ProcessingView.tsx` | 합성 프로그레스 오버레이 |
| `src/components/editor/video/DoneView.tsx` | 완료 화면 |
| `src/lib/highlight-concat.ts` | ffmpeg.wasm trim + concat + R2 업로드 |

---

## Task 1: ClipSegment 타입 확장 + PlayerMarker 컴포넌트

**Files:**
- Modify: `src/components/editor/video/types.ts`
- Create: `src/components/editor/video/PlayerMarker.tsx`

- [ ] **Step 1: ClipSegment에 마커 필드 추가**

`src/components/editor/video/types.ts`의 ClipSegment 인터페이스에 추가:

```typescript
export interface ClipSegment {
  id: string;
  startTime: number;
  endTime: number;
  eventTag: EventTag;
  markedAt?: number;
  spotlightX?: number;
  spotlightY?: number;
  /** EA FC 다이아몬드 마커 X 위치 (0-1 normalized) */
  markerX?: number;
  /** EA FC 다이아몬드 마커 Y 위치 (0-1 normalized) */
  markerY?: number;
}
```

- [ ] **Step 2: PlayerMarker 컴포넌트 생성**

`src/components/editor/video/PlayerMarker.tsx` 생성:

```tsx
"use client";

interface PlayerMarkerProps {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  playerName: string;
  playerNumber?: string;
  onRemove?: () => void;
}

export default function PlayerMarker({ x, y, playerName, playerNumber, onRemove }: PlayerMarkerProps) {
  return (
    <div
      className="pointer-events-auto absolute z-10 flex flex-col items-center"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -100%)" }}
    >
      {/* 다이아몬드 */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
        className="h-5 w-5 rotate-45 bg-accent shadow-[0_0_20px_rgba(212,168,83,0.5),0_0_40px_rgba(212,168,83,0.2)]"
        aria-label="마커 제거"
      />
      {/* 수직선 */}
      <div className="h-6 w-0.5" style={{ background: "linear-gradient(to bottom, #D4A853, transparent)" }} />
      {/* 이름표 */}
      <div className="flex items-center gap-1.5 rounded bg-black/70 px-2.5 py-1" style={{ border: "1px solid rgba(212,168,83,0.4)" }}>
        <div className="h-1 w-1 rounded-full bg-black" />
        <span className="text-[11px] font-extrabold tracking-wide text-accent">{playerName}</span>
        {playerNumber && (
          <span className="text-[11px] font-semibold text-accent/50">#{playerNumber}</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공 (PlayerMarker는 아직 import되지 않으므로 tree-shaken)

- [ ] **Step 4: 커밋**

```bash
git add src/components/editor/video/types.ts src/components/editor/video/PlayerMarker.tsx
git commit -m "feat: ClipSegment 마커 필드 추가 + EA FC 다이아몬드 PlayerMarker 컴포넌트"
```

---

## Task 2: ClipThumbnail 컴포넌트 (프레임 캡처 + 마커 탭)

**Files:**
- Create: `src/components/editor/video/ClipThumbnail.tsx`

- [ ] **Step 1: ClipThumbnail 컴포넌트 생성**

이 컴포넌트는 영상 파일에서 특정 시점의 프레임을 캡처하고, 탭 시 마커 좌표를 반환한다.

`src/components/editor/video/ClipThumbnail.tsx`:

```tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import PlayerMarker from "./PlayerMarker";

interface ClipThumbnailProps {
  videoFile: File;
  captureTime: number; // 캡처할 시점 (초)
  markerX?: number;
  markerY?: number;
  playerName: string;
  playerNumber?: string;
  onMarkerChange: (x: number | undefined, y: number | undefined) => void;
}

export default function ClipThumbnail({
  videoFile, captureTime, markerX, markerY, playerName, playerNumber, onMarkerChange,
}: ClipThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameUrl, setFrameUrl] = useState<string>("");

  // 프레임 캡처
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    let captured = false;
    const capture = () => {
      if (captured || !video.videoWidth) return;
      captured = true;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.7));
      }
    };

    video.onloadeddata = () => { video.currentTime = Math.max(0.1, captureTime); };
    video.onseeked = capture;
    video.ontimeupdate = () => { if (video.currentTime > 0) capture(); };
    video.load();

    const fallback = setTimeout(() => { if (!captured && video.readyState >= 2) capture(); }, 3000);

    return () => {
      clearTimeout(fallback);
      video.onloadeddata = null;
      video.onseeked = null;
      video.ontimeupdate = null;
      video.src = "";
      URL.revokeObjectURL(url);
    };
  }, [videoFile, captureTime]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onMarkerChange(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  }, [onMarkerChange]);

  const handleRemove = useCallback(() => {
    onMarkerChange(undefined, undefined);
  }, [onMarkerChange]);

  if (!frameUrl) {
    return (
      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-white/5">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-20 w-28 shrink-0 cursor-crosshair overflow-hidden rounded-lg"
      onClick={handleTap}
    >
      <img src={frameUrl} alt="클립 프레임" className="h-full w-full object-cover" />
      {markerX !== undefined && markerY !== undefined && (
        <PlayerMarker
          x={markerX}
          y={markerY}
          playerName={playerName}
          playerNumber={playerNumber}
          onRemove={handleRemove}
        />
      )}
      {markerX === undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-[10px] text-white/60">탭하여 선수 표시</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/editor/video/ClipThumbnail.tsx
git commit -m "feat: ClipThumbnail — 프레임 캡처 + EA FC 마커 탭 컴포넌트"
```

---

## Task 3: ConfirmView 확인 화면

**Files:**
- Create: `src/components/editor/video/ConfirmView.tsx`

- [ ] **Step 1: ConfirmView 컴포넌트 생성**

`src/components/editor/video/ConfirmView.tsx`:

```tsx
"use client";

import { useCallback } from "react";
import type { ClipSegment } from "./types";
import { EVENTS, EVENT_TAG_COLORS } from "./types";
import ClipThumbnail from "./ClipThumbnail";

interface ConfirmViewProps {
  clips: ClipSegment[];
  videoFile: File;
  playerName: string;
  playerNumber?: string;
  onBack: () => void;
  onGenerate: () => void;
  onUpdateClip: (id: string, updates: Partial<ClipSegment>) => void;
  onRemoveClip: (id: string) => void;
  onReorderClips: (clips: ClipSegment[]) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ConfirmView({
  clips, videoFile, playerName, playerNumber,
  onBack, onGenerate, onUpdateClip, onRemoveClip, onReorderClips,
}: ConfirmViewProps) {
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);

  const handleMarkerChange = useCallback((clipId: string, x: number | undefined, y: number | undefined) => {
    onUpdateClip(clipId, { markerX: x, markerY: y });
  }, [onUpdateClip]);

  const moveClip = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= clips.length) return;
    const reordered = [...clips];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    onReorderClips(reordered);
  }, [clips, onReorderClips]);

  return (
    <div className="flex h-dvh flex-col bg-[#070709]">
      {/* 헤더 */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-white/50 active:text-white/80">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[13px] font-semibold">구간 수정하기</span>
        </button>
        <span className="text-[12px] text-white/30">Step 2/2</span>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex justify-center gap-1.5 pb-4">
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-accent" />
        <div className="h-1 w-8 rounded-full bg-white/10" />
      </div>

      {/* 타이틀 */}
      <div className="px-4 pb-4 text-center">
        <h2 className="text-[16px] font-extrabold text-white">하이라이트 확인</h2>
        <p className="mt-1 text-[12px] text-white/40">아래 구간들이 순서대로 합쳐집니다</p>
      </div>

      {/* 클립 리스트 */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-2">
          {clips.map((clip, i) => {
            const ev = EVENTS.find((e) => e.id === clip.eventTag);
            const color = EVENT_TAG_COLORS[clip.eventTag];
            const duration = Math.round(clip.endTime - clip.startTime);

            return (
              <div
                key={clip.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: i === 0 ? `${color}08` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${i === 0 ? `${color}20` : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {/* 순서 변경 버튼 */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    onClick={() => moveClip(i, -1)}
                    disabled={i === 0}
                    className="rounded p-0.5 text-[10px] text-white/20 active:text-white/60 disabled:opacity-20"
                  >▲</button>
                  <button
                    onClick={() => moveClip(i, 1)}
                    disabled={i === clips.length - 1}
                    className="rounded p-0.5 text-[10px] text-white/20 active:text-white/60 disabled:opacity-20"
                  >▼</button>
                </div>

                {/* 썸네일 + 마커 */}
                <ClipThumbnail
                  videoFile={videoFile}
                  captureTime={clip.markedAt ?? clip.startTime}
                  markerX={clip.markerX}
                  markerY={clip.markerY}
                  playerName={playerName}
                  playerNumber={playerNumber}
                  onMarkerChange={(x, y) => handleMarkerChange(clip.id, x, y)}
                />

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px]">{ev?.emoji}</span>
                    <span className="text-[13px] font-semibold text-white">{ev?.label}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-white/40">
                    {fmt(clip.startTime)} → {fmt(clip.endTime)} · {duration}초
                  </div>
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => onRemoveClip(clip.id)}
                  className="shrink-0 rounded-lg p-2 text-white/20 active:bg-red-500/15 active:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* 요약 */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-accent">{clips.length}개</div>
            <div className="text-[10px] text-white/40">구간</div>
          </div>
          <div className="w-px bg-white/8" />
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-accent">{Math.round(totalDuration)}초</div>
            <div className="text-[10px] text-white/40">총 길이</div>
          </div>
        </div>

        {/* 힌트 */}
        <p className="mt-3 text-center text-[11px] text-white/25">
          ▲▼ 순서 변경 · 썸네일 탭으로 선수 표시 · ✕ 삭제
        </p>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-4 pb-[env(safe-area-inset-bottom,16px)] pt-3">
        <button
          onClick={onGenerate}
          disabled={clips.length === 0}
          className="w-full rounded-2xl py-4 text-[15px] font-extrabold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{
            background: "linear-gradient(135deg, #D4A853, #C0392B)",
            boxShadow: "0 4px 20px rgba(212,168,67,0.3)",
          }}
        >
          🎬 하이라이트 생성하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/editor/video/ConfirmView.tsx
git commit -m "feat: ConfirmView — 클립 리스트 확인 + 마커 + 순서 변경 화면"
```

---

## Task 4: ProcessingView + DoneView

**Files:**
- Create: `src/components/editor/video/ProcessingView.tsx`
- Create: `src/components/editor/video/DoneView.tsx`

- [ ] **Step 1: ProcessingView 생성**

`src/components/editor/video/ProcessingView.tsx`:

```tsx
"use client";

export type ProcessingStep = "loading" | "trimming" | "concat" | "uploading" | "saving";

interface ProcessingViewProps {
  step: ProcessingStep;
  trimProgress: number; // 0~totalClips
  totalClips: number;
  error?: string;
  onRetry?: () => void;
}

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: "loading", label: "영상 준비" },
  { key: "trimming", label: "구간 자르기" },
  { key: "concat", label: "하나로 합치기" },
  { key: "uploading", label: "업로드" },
  { key: "saving", label: "저장" },
];

export default function ProcessingView({ step, trimProgress, totalClips, error, onRetry }: ProcessingViewProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const progress = Math.round(((currentIdx + (step === "trimming" ? trimProgress / totalClips : 0)) / STEPS.length) * 100);

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-[32px]">✕</div>
        <h2 className="mt-5 text-[16px] font-bold text-white">처리 중 문제가 발생했어요</h2>
        <p className="mt-2 text-center text-[13px] text-white/50">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 rounded-xl bg-accent px-8 py-3 text-[14px] font-bold text-black active:scale-[0.98]"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-8">
      {/* 원형 프로그레스 */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(212,168,83,0.15)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="36" fill="none" stroke="#D4A853" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="text-[18px] font-extrabold text-accent">{progress}%</span>
      </div>

      <h2 className="mt-5 text-[15px] font-bold text-white">구간을 합치고 있어요</h2>
      <p className="mt-1 text-[12px] text-white/40">잠깐만 기다려주세요...</p>

      {/* 체크리스트 */}
      <div className="mt-6 flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const label = s.key === "trimming" && isCurrent
            ? `${s.label} (${trimProgress}/${totalClips})`
            : s.label;

          return (
            <div key={s.key} className="flex items-center gap-2 text-[12px]">
              <span className={isDone ? "text-green-400" : isCurrent ? "text-accent" : "text-white/20"}>
                {isDone ? "✓" : isCurrent ? "●" : "○"}
              </span>
              <span className={isCurrent ? "font-semibold text-white" : isDone ? "text-white/50" : "text-white/20"}>
                {label}{isCurrent && "..."}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: DoneView 생성**

`src/components/editor/video/DoneView.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

interface DoneViewProps {
  clipCount: number;
  totalDuration: number;
  onReset: () => void;
}

export default function DoneView({ clipCount, totalDuration, onReset }: DoneViewProps) {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#070709] px-8">
      {/* 스텝 인디케이터 — 완료 */}
      <div className="flex gap-1.5 mb-8">
        <div className="h-1 w-8 rounded-full bg-green-400" />
        <div className="h-1 w-8 rounded-full bg-green-400" />
        <div className="h-1 w-8 rounded-full bg-green-400" />
      </div>

      {/* 체크마크 */}
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-green-400 bg-green-400/15 text-[32px] animate-scale-up">
        ✓
      </div>

      <h2 className="mt-5 text-[18px] font-extrabold text-white">하이라이트 완성!</h2>
      <p className="mt-1 text-[13px] text-white/50">{clipCount}개 구간 · {Math.round(totalDuration)}초</p>
      <p className="mt-1 text-[12px] text-white/30">프로필에서 확인할 수 있어요</p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-extrabold text-black active:scale-[0.98]"
        >
          프로필에서 보기
        </button>
        <button
          onClick={onReset}
          className="py-3 text-[13px] text-white/40 active:text-white/60"
        >
          한 번 더 만들기
        </button>
      </div>

      <style jsx>{`
        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scale-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/editor/video/ProcessingView.tsx src/components/editor/video/DoneView.tsx
git commit -m "feat: ProcessingView + DoneView — 합성 프로그레스 및 완료 화면"
```

---

## Task 5: highlight-concat.ts (ffmpeg.wasm trim + concat + R2 업로드)

**Files:**
- Create: `src/lib/highlight-concat.ts`

- [ ] **Step 1: highlight-concat.ts 생성**

이 모듈은 ffmpeg.wasm으로 클립 세그먼트들을 trim하고 concat한 뒤, presigned URL로 R2에 업로드하고 `/api/clips`에 DB 레코드를 생성한다.

`src/lib/highlight-concat.ts`:

```typescript
import type { ClipSegment } from "@/components/editor/video/types";
import type { ProcessingStep } from "@/components/editor/video/ProcessingView";
import { getPublicVideoUrl } from "@/lib/r2-client";

interface ConcatOptions {
  videoFile: File;
  clips: ClipSegment[];
  onStep: (step: ProcessingStep) => void;
  onTrimProgress: (done: number) => void;
}

interface ConcatResult {
  clipId: string;
  videoUrl: string;
}

let cachedFFmpeg: any = null;

/** marking 상태 진입 시 호출하여 백그라운드로 FFmpeg 프리로딩 */
export async function preloadFFmpeg(): Promise<void> {
  if (cachedFFmpeg) return;
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  cachedFFmpeg = ffmpeg;
}

export async function concatHighlight({ videoFile, clips, onStep, onTrimProgress }: ConcatOptions): Promise<ConcatResult> {
  // 1. FFmpeg 로딩
  onStep("loading");
  if (!cachedFFmpeg) {
    await preloadFFmpeg();
  }
  const ffmpeg = cachedFFmpeg;

  // 2. 원본 파일을 WASM FS에 쓰기
  const buf = await videoFile.arrayBuffer();
  await ffmpeg.writeFile("input.mp4", new Uint8Array(buf));

  // 3. 각 세그먼트 trim (-c copy)
  onStep("trimming");
  const segNames: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const segName = `seg${i}.mp4`;
    segNames.push(segName);

    await ffmpeg.exec([
      "-ss", String(clip.startTime),
      "-t", String(clip.endTime - clip.startTime),
      "-i", "input.mp4",
      "-c", "copy",
      "-avoid_negative_ts", "make_zero",
      segName,
    ]);

    onTrimProgress(i + 1);
  }

  // 4. concat demuxer
  onStep("concat");
  const listContent = segNames.map((s) => `file '${s}'`).join("\n");
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listContent));

  await ffmpeg.exec([
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-c", "copy", "-movflags", "+faststart",
    "highlight.mp4",
  ]);

  const output = await ffmpeg.readFile("highlight.mp4");
  const outputBlob = new Blob([output.buffer], { type: "video/mp4" });

  // 5. WASM FS 정리
  await ffmpeg.deleteFile("input.mp4").catch(() => {});
  for (const s of segNames) await ffmpeg.deleteFile(s).catch(() => {});
  await ffmpeg.deleteFile("list.txt").catch(() => {});
  await ffmpeg.deleteFile("highlight.mp4").catch(() => {});

  // 6. R2 업로드 (presigned URL)
  onStep("uploading");
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: "video/mp4", prefix: "originals" }),
  });
  if (!presignRes.ok) throw new Error("Presigned URL 발급 실패");
  const { url: uploadUrl, key, clipId } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: outputBlob,
  });
  if (!putRes.ok) throw new Error(`R2 업로드 실패 (${putRes.status})`);

  const videoUrl = getPublicVideoUrl(key);

  // 7. DB 레코드 생성
  onStep("saving");
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);

  const clipRes = await fetch("/api/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clip_id: clipId,
      video_url: videoUrl,
      duration_seconds: Math.round(totalDuration),
      file_size_bytes: outputBlob.size,
      memo: `하이라이트 ${clips.length}개 구간`,
      client_trimmed: true,
    }),
  });
  if (!clipRes.ok) throw new Error("클립 저장 실패");

  return { clipId, videoUrl };
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/lib/highlight-concat.ts
git commit -m "feat: highlight-concat — ffmpeg.wasm trim+concat+R2 업로드 파이프라인"
```

---

## Task 6: page.tsx 리팩터 — phase 상태 머신 + 뷰 통합

**Files:**
- Modify: `src/app/editor/video/page.tsx`

이 태스크가 가장 큰 변경. 기존 page.tsx에 phase 상태 머신을 추가하고, confirm/processing/done 뷰를 연결한다.

- [ ] **Step 1: phase 상태 + FFmpeg 프리로딩 추가**

`src/app/editor/video/page.tsx` 파일 상단의 import와 state 영역을 수정한다.

기존 import 뒤에 추가:
```typescript
import ConfirmView from "@/components/editor/video/ConfirmView";
import ProcessingView from "@/components/editor/video/ProcessingView";
import type { ProcessingStep } from "@/components/editor/video/ProcessingView";
import DoneView from "@/components/editor/video/DoneView";
import { preloadFFmpeg, concatHighlight } from "@/lib/highlight-concat";
```

기존 state 선언 영역(`// Guide` 주석 아래)에 추가:
```typescript
// Phase
type Phase = "onboarding" | "marking" | "confirm" | "processing" | "done";
const [phase, setPhase] = useState<Phase>("onboarding");

// Processing state
const [procStep, setProcStep] = useState<ProcessingStep>("loading");
const [trimProgress, setTrimProgress] = useState(0);
const [procError, setProcError] = useState<string | undefined>();
```

기존 `if (!videoSrc)` 전에 phase 분기를 추가하여, `videoSrc`가 설정되면 자동으로 `marking`으로 전환:
```typescript
// 파일 선택 시 자동으로 marking으로 전환
useEffect(() => {
  if (videoSrc && phase === "onboarding") setPhase("marking");
}, [videoSrc, phase]);

// marking 진입 시 FFmpeg 프리로딩
useEffect(() => {
  if (phase === "marking") preloadFFmpeg().catch(() => {});
}, [phase]);
```

- [ ] **Step 2: onboarding 화면 개선**

기존 `if (!videoSrc)` 블록 안의 워딩을 변경한다:

- `"경기 영상 불러오기"` → `"경기 영상을 불러오세요"`
- `"MP4, MOV 파일"` → `"MP4, MOV · 최대 300MB"`
- 사용 가이드 단계: `"좋은 장면에서 탭!"` → `"원하는 구간에서 탭!"`
- 맨 위에 스텝 인디케이터 3도트 추가:

```tsx
{/* 스텝 인디케이터 */}
<div className="flex justify-center gap-1.5 mb-4">
  <div className="h-1 w-8 rounded-full bg-accent" />
  <div className="h-1 w-8 rounded-full bg-white/10" />
  <div className="h-1 w-8 rounded-full bg-white/10" />
</div>
```

- [ ] **Step 3: marking 헤더에 "다음" 버튼 추가**

메인 에디터의 헤더 부분 (기존 `clips.length > 0 && (` 뒤)에 "다음" 버튼을 추가한다:

```tsx
{/* 다음 버튼 */}
<button
  onClick={() => clips.length > 0 && setPhase("confirm")}
  disabled={clips.length === 0}
  className="rounded-xl px-4 py-1.5 text-[12px] font-bold transition-all active:scale-95 disabled:opacity-25"
  style={{
    background: clips.length >= 3 ? "#D4A853" : "transparent",
    color: clips.length >= 3 ? "#000" : "#D4A853",
    border: clips.length >= 3 ? "none" : "1px solid rgba(212,168,83,0.3)",
  }}
>
  다음 →
</button>
```

- [ ] **Step 4: 가이드 오버레이 적응형으로 변경**

기존 가이드 오버레이 (`showGuide && clips.length === 0`) 조건을 확장하여, 첫 마킹 후에도 가이드를 보여준다:

```tsx
{/* 적응형 가이드 오버레이 */}
{clips.length === 0 && showGuide && (
  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-16">
    <div className="animate-bounce rounded-2xl bg-black/70 px-5 py-3 backdrop-blur-md"
      style={{ border: "1px solid rgba(212,168,83,0.2)" }}>
      <p className="text-[13px] text-white/90">
        <span className="font-bold text-accent/60">Step 1/2</span>
        {" · 영상을 재생하면서 원하는 구간에서 "}
        <span className="font-bold text-accent">⚡ 이 장면!</span>을 눌러주세요
      </p>
    </div>
  </div>
)}

{/* 첫 마킹 후 다음 유도 가이드 */}
{justMarked && clips.length === 1 && (
  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-16">
    <div className="rounded-2xl bg-black/70 px-5 py-3 backdrop-blur-md"
      style={{ border: "1px solid rgba(46,204,113,0.3)" }}>
      <p className="text-[13px] text-white/90">
        <span className="text-green-400">✓ 구간 추가 완료!</span>
        {" 더 추가하거나 우측 상단 "}
        <span className="font-bold text-accent">다음 →</span>을 눌러주세요
      </p>
    </div>
  </div>
)}
```

- [ ] **Step 5: confirm/processing/done 뷰 분기 추가**

메인 에디터 return 문 직전에 phase 분기를 추가한다:

```tsx
// ═══ Phase 분기 ═══
if (phase === "confirm") {
  return (
    <ConfirmView
      clips={sortedClips}
      videoFile={videoFileRef.current!}
      playerName={playerData?.name ?? "선수"}
      playerNumber={playerData?.number}
      onBack={() => setPhase("marking")}
      onGenerate={handleGenerate}
      onUpdateClip={(id, updates) => setClips((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))}
      onRemoveClip={handleRemoveClip}
      onReorderClips={setClips}
    />
  );
}

if (phase === "processing") {
  return (
    <ProcessingView
      step={procStep}
      trimProgress={trimProgress}
      totalClips={clips.length}
      error={procError}
      onRetry={() => { setProcError(undefined); handleGenerate(); }}
    />
  );
}

if (phase === "done") {
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);
  return (
    <DoneView
      clipCount={clips.length}
      totalDuration={totalDuration}
      onReset={() => {
        setVideoSrc(null);
        setClips([]);
        setSelectedClipId(undefined);
        setPhase("onboarding");
        videoFileRef.current = null;
      }}
    />
  );
}
```

- [ ] **Step 6: handleGenerate 함수 + videoFileRef 추가**

state 영역에 `videoFileRef` 추가:
```typescript
const videoFileRef = useRef<File | null>(null);
```

기존 `handleFileSelect`에서 파일 참조 저장:
```typescript
const handleFileSelect = useCallback((file: File) => {
  if (!file.type.startsWith("video/")) return;
  videoFileRef.current = file;
  const url = URL.createObjectURL(file);
  setVideoSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
  setClips([]); setSelectedClipId(undefined); setCurrentTime(0); setDuration(0);
}, []);
```

`handleGenerate` 함수 추가:
```typescript
const handleGenerate = useCallback(async () => {
  if (!videoFileRef.current || clips.length === 0) return;
  setPhase("processing");
  setProcError(undefined);
  setTrimProgress(0);

  try {
    await concatHighlight({
      videoFile: videoFileRef.current,
      clips: [...clips].sort((a, b) => a.startTime - b.startTime),
      onStep: setProcStep,
      onTrimProgress: setTrimProgress,
    });
    setPhase("done");
  } catch (e: any) {
    setProcError(e.message ?? "알 수 없는 오류");
  }
}, [clips]);
```

- [ ] **Step 7: 워딩 변경 (marking 상태)**

기존 코드에서:
- `"장면 추가됨!"` → `"구간 추가 완료!"`
- `"N개 장면"` → `"N개 구간"`
- `justMarked` 피드백 텍스트: `"✓ 장면 추가됨!"` → `"✓ 구간 추가!"`

- [ ] **Step 8: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -10`
Expected: 빌드 성공

- [ ] **Step 9: 커밋**

```bash
git add src/app/editor/video/page.tsx
git commit -m "feat: 에디터 phase 상태 머신 — 마킹→확인→합성→완료 플로우 완성"
```

---

## Task 7: 업로드 페이지 워딩 + 파일 제한 업데이트

**Files:**
- Modify: `src/app/upload/page.tsx`

- [ ] **Step 1: 워딩 변경**

`src/app/upload/page.tsx`에서:

- `"주말 경기 풀영상에서 골·어시스트 장면을 골라"` → `"주말 경기 풀영상에서 원하는 구간을 골라"`
- `"장면 마킹"` → `"구간 선택"`
- 3단계 플로우 텍스트가 있다면 "완성!"이 실제로 동작하게 됨 (이미 구현)

- [ ] **Step 2: 빌드 확인**

Run: `cd /Users/jiminlee/Desktop/project/footory && npx next build --no-lint 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/app/upload/page.tsx
git commit -m "fix: 업로드 페이지 워딩 변경 — 장면→구간, 파일 제한 안내"
```

---

## Task 8: 브라우저 테스트 — 전체 플로우 E2E

**Files:**
- (테스트만, 파일 생성 없음)

Playwright MCP 또는 agent-browser로 전체 플로우를 테스트한다.

- [ ] **Step 1: /editor/video 접근 + 영상 업로드**

1. `http://localhost:3000/editor/video` 접근
2. 스텝 인디케이터 (3도트) 확인
3. "영상 선택하기" 또는 파일 input으로 `test3.mp4` (16MB, 70초) 업로드
4. marking 상태 진입 확인 (영상 플레이어 + "이 장면!" 버튼 표시)

- [ ] **Step 2: 장면 마킹 테스트**

1. 영상 재생 시작
2. "이 장면!" 버튼 클릭 → "구간 추가!" 피드백 확인
3. 가이드가 "더 추가하거나 다음→" 으로 변경됨 확인
4. "이 장면!" 2번 더 클릭 (총 3개 클립)
5. "다음 →" 버튼이 골드 채움으로 강조됨 확인
6. "N개 구간" 카운터 표시 확인

- [ ] **Step 3: 확인 화면 테스트**

1. "다음 →" 클릭 → confirm 화면 진입
2. 클립 리스트 (3개) 표시 확인
3. 각 클립에 이모지 + 시간 범위 표시 확인
4. 총 구간 수 + 총 길이 요약 확인
5. "← 구간 수정하기" 클릭 → marking으로 복귀 확인
6. 다시 "다음 →" → confirm 복귀

- [ ] **Step 4: 마커 탭 테스트**

1. 확인 화면에서 첫 번째 클립 썸네일 탭 → 다이아몬드 마커 표시 확인
2. 다시 탭 → 마커 위치 변경 확인
3. 마커 자체 클릭 → 마커 제거 확인

- [ ] **Step 5: 합성 + 업로드 테스트**

1. "🎬 하이라이트 생성하기" 클릭 → processing 화면 진입
2. 프로그레스 단계 표시 확인 (영상 준비 → 구간 자르기 → 하나로 합치기 → 업로드 → 저장)
3. 완료 후 done 화면 → "하이라이트 완성!" 표시 확인
4. "프로필에서 보기" 클릭 → /profile 이동 확인

- [ ] **Step 6: 에러 케이스 테스트**

1. 인터넷 끊긴 상태에서 합성 시도 → 에러 메시지 + "다시 시도" 버튼 확인
2. 클립 0개 상태에서 "다음" 비활성 확인

- [ ] **Step 7: 최종 커밋**

모든 테스트 통과 확인 후:

```bash
git add -A
git commit -m "test: 하이라이트 클립 플로우 E2E 테스트 완료"
```
