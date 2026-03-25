# 인스타그램 스타일 영상 + 업로드 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세로 전체화면 영상 플레이어(블러 배경) + CSS 꾸미기 효과 파이프라인 연결 + 불필요한 컴포넌트(레이더·스킬라벨) 제거

**Architecture:** ClipPlayerSheet를 바텀 시트에서 전체화면 세로 플레이어로 교체(위아래 스와이프). 꾸미기 효과는 FFmpeg 없이 재생 시 CSS로 합성. effects 데이터는 업로드 → clips DB → PlayableClip → VideoOverlay 체인으로 흐름.

**Tech Stack:** Next.js 15/16 App Router, TypeScript, Tailwind CSS v4, Zustand, Supabase

---

## 파일 맵

| 파일 | 역할 | 변경 유형 |
|------|------|---------|
| `src/components/profile/RecordsTabV5.tsx` | 레이더 제거 | 수정 |
| `src/app/upload/page.tsx` | SkillLabelPicker 제거 | 수정 |
| `src/components/player/ClipPlayerSheet.tsx` | 전체화면 플레이어로 교체 | 수정 (전면) |
| `src/components/video/VideoOverlay.tsx` | effects CSS 적용 | 수정 |
| `src/components/feed/FeedList.tsx` | effects → PlayableClip 전달 | 수정 |
| `src/app/profile/page.tsx` | effects → PlayableClip 전달 | 수정 |
| `src/app/p/[handle]/client.tsx` | effects → PlayableClip 전달 | 수정 |
| `src/app/globals.css` | 전체화면 플레이어 애니메이션 추가 | 수정 |

**변경하지 않는 파일:**
- `src/components/video/EffectsToggle.tsx` — 이미 연결됨, 유지
- `src/components/upload/SpotlightPicker.tsx` — 유지
- `src/lib/upload-service.ts` — effects 이미 전달 중
- `src/app/api/clips/route.ts` — effects 컬럼 이미 저장 중
- `src/lib/supabase/database.ts` — effects 컬럼 이미 존재

---

## Task 1: 레이더 + SkillLabelPicker 제거

오늘 잘못 추가된 코드를 되돌린다.

**Files:**
- Modify: `src/components/profile/RecordsTabV5.tsx`
- Modify: `src/app/upload/page.tsx`

- [ ] **Step 1: RecordsTabV5에서 레이더 제거**

`src/components/profile/RecordsTabV5.tsx` 상단 import 2줄 제거:
```typescript
// 이 두 줄 삭제
import { calcRadarStats } from "@/lib/radar-calc";
import ProfileRadar from "@/components/player/ProfileRadar";
```

`useMemo` import에서 `useMemo` 제거 (다른 곳에서 사용 안 하면):
```typescript
// useMemo 제거 후
import React, { useState } from "react";
```

함수 본문에서 레이더 관련 3줄 제거:
```typescript
// 이 두 줄 삭제
const radarStats = useMemo(() => calcRadarStats(stats, []), [stats]);
const hasRadar = Object.values(radarStats).some((v) => v > 0);
```

JSX에서 레이더 블록 제거:
```typescript
// 이 블록 전체 삭제
{hasRadar && (
  <div className="flex justify-center py-2">
    <ProfileRadar stats={radarStats} />
  </div>
)}
```

- [ ] **Step 2: upload/page.tsx에서 SkillLabelPicker 제거**

import 제거:
```typescript
// 이 줄 삭제
import SkillLabelPicker from "@/components/video/SkillLabelPicker";
```

상태 구독 제거:
```typescript
// 이 두 줄 삭제
const skillLabels = useUploadStore((s) => s.skillLabels);
const customLabels = useUploadStore((s) => s.customLabels);
```

JSX에서 스킬 라벨 섹션 전체 삭제:
```typescript
// 이 블록 전체 삭제
{/* 스킬 라벨 */}
<div>
  <h3 className="mb-3 text-[14px] font-semibold text-text-1">스킬 라벨</h3>
  <SkillLabelPicker
    selected={skillLabels}
    customLabels={customLabels}
    onSelectedChange={(labels) => useUploadStore.getState().setSkillLabels(labels)}
    onCustomChange={(labels) => useUploadStore.getState().setCustomLabels(labels)}
  />
</div>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/profile/RecordsTabV5.tsx src/app/upload/page.tsx
git commit -m "revert: 레이더 + SkillLabelPicker 제거 (잘못 추가된 코드 롤백)"
```

---

## Task 2: effects 데이터 파이프라인 연결

업로드 시 저장된 `effects` 값이 재생까지 전달되도록 체인을 완성한다.

**현재 상태:**
- `upload-store.ts` → `upload-service.ts` → `/api/clips` → DB: ✅ 이미 연결됨
- DB `effects` 컬럼: ✅ 이미 존재 (`database.ts` 확인)
- `PlayableClip` 타입에 `effects` 필드: ❌ 없음
- `FeedList`, `profile/page.tsx`, `p/[handle]/client.tsx`에서 PlayableClip 구성 시 effects 포함: ❌ 없음

**Files:**
- Modify: `src/components/player/ClipPlayerSheet.tsx` (PlayableClip 타입)
- Modify: `src/components/feed/FeedList.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/p/[handle]/client.tsx`

- [ ] **Step 1: PlayableClip 타입에 effects 추가**

`src/components/player/ClipPlayerSheet.tsx` 상단 인터페이스 수정:

```typescript
export interface PlayableClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  tag?: string;
  duration?: number;
  // spotlight overlay
  spotlightX?: number | null;
  spotlightY?: number | null;
  playerName?: string;
  playerPosition?: string | null;
  playerBirthYear?: number | null;
  teamName?: string | null;
  // css effects
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  } | null;
}
```

- [ ] **Step 2: FeedList에서 effects 전달**

`src/components/feed/FeedList.tsx`의 `handlePlay` 콜백에서 effects 추가:

```typescript
const handlePlay = useCallback((item: FeedItemEnriched) => {
  const meta = item.metadata as Record<string, unknown>;
  const videoUrl = typeof meta.video_url === "string" ? meta.video_url : null;
  if (!videoUrl) return;
  setPlayerClips([{
    id: item.reference_id ?? item.id,
    videoUrl,
    thumbnailUrl: typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null,
    tag: Array.isArray(meta.tags) ? (meta.tags as string[])[0] : undefined,
    duration: typeof meta.duration === "number" ? meta.duration : undefined,
    spotlightX: typeof meta.spotlight_x === "number" ? meta.spotlight_x : null,
    spotlightY: typeof meta.spotlight_y === "number" ? meta.spotlight_y : null,
    playerName: item.playerName,
    playerPosition: item.playerPosition,
    playerBirthYear: item.playerBirthYear,
    teamName: item.teamName,
    // effects 추가
    effects: meta.effects && typeof meta.effects === "object"
      ? (meta.effects as PlayableClip["effects"])
      : null,
  }]);
}, []);
```

- [ ] **Step 3: profile/page.tsx에서 effects 전달**

`src/app/profile/page.tsx`에서 `featuredPlayable`과 `gridPlayable` 구성 부분을 찾아 effects 추가. 두 배열 모두 동일한 패턴:

```typescript
// clip 객체에서 effects를 꺼내 전달
effects: clip.effects
  ? (clip.effects as PlayableClip["effects"])
  : null,
```

`Clip` 타입(`src/types/clip.ts` 또는 `src/lib/types.ts`)에 effects 필드가 없으면 추가:
```typescript
effects?: Record<string, boolean> | null;
```

- [ ] **Step 4: p/[handle]/client.tsx에서 effects 전달**

공개 프로필 페이지도 동일하게 PlayableClip 구성 시 effects 포함. `client.tsx`에서 clips → PlayableClip 변환 부분 찾아 추가.

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/components/player/ClipPlayerSheet.tsx \
        src/components/feed/FeedList.tsx \
        src/app/profile/page.tsx \
        "src/app/p/[handle]/client.tsx"
git commit -m "feat: PlayableClip에 effects 필드 추가 + 파이프라인 연결"
```

---

## Task 3: VideoOverlay에 CSS 꾸미기 효과 적용

**Files:**
- Modify: `src/components/video/VideoOverlay.tsx`
- Modify: `src/components/player/ClipPlayerSheet.tsx` (VideoOverlay에 effects 전달 + 색보정/시네마틱 CSS 적용)
- Modify: `src/app/globals.css` (필요 시 keyframe 추가)

- [ ] **Step 1: VideoOverlay props 확장**

`src/components/video/VideoOverlay.tsx` 인터페이스 수정:

```typescript
interface VideoOverlayProps {
  spotlight: { x: number; y: number } | null; // null이면 링 숨김, 네임태그만
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
  effects?: {
    eafc?: boolean;   // EA FC 카드 스타일 네임태그 강화
    cinematic?: boolean; // 시네마틱바 (VideoOverlay 내부 처리)
    intro?: boolean;  // 인트로 애니메이션 (이미 동작 중)
  } | null;
}
```

- [ ] **Step 2: VideoOverlay 내부에 시네마틱바 + EA FC 강화 적용**

```typescript
export default function VideoOverlay({ spotlight, player, effects }: VideoOverlayProps) {
  // ... 기존 코드 ...

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" style={{ willChange: "opacity" }}>

      {/* 시네마틱바 (effects.cinematic) */}
      {effects?.cinematic && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[10%] bg-black" />
          <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black" />
        </>
      )}

      {/* 스포트라이트 링 — spotlight가 있을 때만 */}
      {spotlight && (
        <div
          className="absolute"
          style={{
            left: `${spotlight.x * 100}%`,
            top: `${spotlight.y * 100}%`,
            transform: "translate(-50%, -50%)",
            animation: "overlay-ring-in 0.2s ease-out forwards, overlay-fadeout 0.2s ease-in 0.8s forwards",
          }}
        >
          {/* ... 기존 링 + 화살표 코드 ... */}
        </div>
      )}

      {/* 네임태그 카드 — eafc 강화 스타일 */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        style={{
          width: "82%",
          maxWidth: 320,
          animation: "overlay-nametag-in 0.2s ease-out 0.2s both",
        }}
      >
        <div
          style={{
            background: effects?.eafc
              ? "linear-gradient(135deg, rgba(30,20,5,0.96) 0%, rgba(15,15,18,0.96) 100%)"
              : "rgba(15,15,18,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: effects?.eafc
              ? "1.5px solid rgba(212,168,83,0.6)"
              : "1.5px solid rgba(212,168,83,0.35)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "overlay-fadeout 0.2s ease-in 0.8s forwards",
            boxShadow: effects?.eafc
              ? "0 4px 20px rgba(212,168,83,0.15), inset 0 1px 0 rgba(212,168,83,0.1)"
              : undefined,
          }}
        >
          {/* 팀 배지 — eafc 시 골드 그라디언트 강화 */}
          {/* ... 기존 배지 코드, eafc 조건으로 스타일만 조정 ... */}

          {/* 텍스트 */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-body, 'Noto Sans KR', sans-serif)",
              fontSize: effects?.eafc ? 16 : 15,
              fontWeight: effects?.eafc ? 800 : 700,
              color: "#FAFAFA",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {player.name}
            </p>
            {infoLine && (
              <p style={{
                fontSize: 11,
                color: effects?.eafc ? "#D4A853" : "#A1A1AA",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {infoLine}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ClipPlayerSheet에서 색보정(color) CSS + VideoOverlay에 effects 전달**

`ClipPlayerSheet.tsx`의 `<video>` 태그에 색보정 필터 추가:

```typescript
const clip = clips[index];
const effects = clip?.effects;

// video 태그 style에 추가
style={{
  // ... 기존 스타일 ...
  filter: effects?.color
    ? "saturate(1.2) contrast(1.05) brightness(1.02)"
    : undefined,
}}
```

VideoOverlay 호출 시 effects 전달. 또한 spotlight가 없어도 effects가 있으면 오버레이 표시:

```typescript
{/* VideoOverlay — spotlight 또는 effects가 있을 때 표시 */}
{clip.playerName && (clip.spotlightX != null || effects?.eafc || effects?.cinematic) && (
  <VideoOverlay
    key={playCount}
    spotlight={clip.spotlightX != null && clip.spotlightY != null
      ? { x: clip.spotlightX, y: clip.spotlightY }
      : null}
    player={{
      name: clip.playerName,
      position: clip.playerPosition,
      birthYear: clip.playerBirthYear,
      teamName: clip.teamName,
    }}
    effects={effects}
  />
)}
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/video/VideoOverlay.tsx src/components/player/ClipPlayerSheet.tsx
git commit -m "feat: VideoOverlay CSS 꾸미기 효과 적용 (색보정·시네마틱바·EA FC 카드)"
```

---

## Task 4: 전체화면 세로 플레이어

ClipPlayerSheet를 바텀 시트에서 전체화면 세로 플레이어로 전면 교체.

**Files:**
- Modify: `src/components/player/ClipPlayerSheet.tsx` (레이아웃 전면 교체)
- Modify: `src/app/globals.css` (fullscreen-player-in 애니메이션)

**핵심 구조:**
```
position: fixed, inset: 0, z-[100], bg-black
├── 블러 배경 (썸네일 or 현재 영상 캡처, filter: blur(20px) brightness(0.35), scale(1.1))
├── <video> object-fit: contain, w-full h-full, z-index:1
├── VideoOverlay (기존 유지)
├── 상단: 뒤로가기 버튼 (좌상단)
├── 우측 사이드: 좋아요/댓글/공유 버튼 (세로 나열)
└── 하단 오버레이: 선수명 + 태그 + seekbar
```

**스와이프 변경:**
- 기존: 좌우 스와이프 → 이전/다음
- 변경: **위아래 스와이프** → 이전/다음 (위: 다음, 아래: 이전)
- 아래로 빠르게 스와이프 (velocity > 0.5) → 닫기

- [ ] **Step 1: globals.css에 fullscreen 진입 애니메이션 추가**

`src/app/globals.css`에 추가:

```css
@keyframes fullscreen-player-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 2: ClipPlayerSheet 전체 레이아웃 교체**

기존 바텀 시트 구조를 전체화면으로 교체. 스와이프 방향도 좌우 → 위아래로 변경.

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import VideoOverlay from "@/components/video/VideoOverlay";

// getVideoErrorMessage, PlayableClip, ClipPlayerSheetProps — 기존 유지

export default function ClipPlayerSheet({
  clips: clipsProp,
  initialIndex = 0,
  onClose,
  onDelete,
  onEditTags,
  onShare,
}: ClipPlayerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localClips, setLocalClips] = useState(clipsProp);
  const [index, setIndex] = useState(initialIndex);
  const clips = localClips;

  const [paused, setPaused] = useState(false);
  const [videoError, setVideoError] = useState<{ code: number; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [playCount, setPlayCount] = useState(0);

  // 위아래 스와이프
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; time: number; locked: "h" | "v" | null } | null>(null);

  const clip = clips[index];
  const hasNext = index < clips.length - 1;
  const hasPrev = index > 0;
  const effects = clip?.effects;
  const touchHandled = useRef(false);

  // Lock body scroll — 기존과 동일
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Reset on clip change — 기존과 동일
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPaused(false);
    setVideoError(null);
    setRetryCount(0);
    setShowControls(true);
    scheduleHide();
  }, [index]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Video event listeners — 기존과 동일
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setDuration(v.duration || 0);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onPlay = () => { setPaused(false); scheduleHide(); setPlayCount((c) => c + 1); };
    const onPause = () => { setPaused(true); setShowControls(true); };
    const onLoaded = () => setDuration(v.duration || 0);
    const onError = () => {
      const code = v.error?.code ?? 0;
      const { message } = getVideoErrorMessage(code);
      setVideoError({ code, message });
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
    };
  }, [scheduleHide, index]);

  const handleTap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); setShowControls(true); scheduleHide(); }
    else { v.pause(); setPaused(true); setShowControls(true); }
  }, [scheduleHide]);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v || !clip || retryCount >= 3) return;
    setRetryCount((c) => c + 1);
    setVideoError(null);
    const sep = clip.videoUrl.includes("?") ? "&" : "?";
    v.src = `${clip.videoUrl}${sep}t=${Date.now()}`;
    v.load();
  }, [retryCount, clip]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoRef.current && duration) videoRef.current.currentTime = ratio * duration;
  };

  const goToClip = (i: number) => {
    if (i >= 0 && i < clips.length) setIndex(i);
  };

  // 위아래 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), locked: null };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeStart.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeStart.current.locked = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      } else return;
    }
    if (swipeStart.current.locked === "v") {
      setSwiping(true);
      setSwipeY(dy);
    }
  };
  const handleTouchEnd = () => {
    if (!swipeStart.current) return;
    if (swipeStart.current.locked === "v" && swiping) {
      const elapsed = Date.now() - swipeStart.current.time;
      const velocity = Math.abs(swipeY) / elapsed;
      if (swipeY < -60 || (swipeY < 0 && velocity > 0.3)) {
        // 위로 스와이프 → 다음 클립
        if (hasNext) goToClip(index + 1);
      } else if (swipeY > 60 || (swipeY > 0 && velocity > 0.3)) {
        if (velocity > 0.5 && !hasPrev) {
          // 첫 클립에서 빠르게 아래 → 닫기
          onClose();
        } else if (hasPrev) {
          goToClip(index - 1);
        } else if (velocity > 0.5) {
          onClose();
        }
      }
      setSwipeY(0);
      setSwiping(false);
    } else if (!swipeStart.current.locked) {
      handleTap();
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 300);
    }
    swipeStart.current = null;
  };

  const handleDelete = async () => {
    if (!clip || !onDelete) return;
    const ok = await onDelete(clip.id);
    if (ok) {
      const remaining = localClips.filter((c) => c.id !== clip.id);
      if (remaining.length === 0) { onClose(); return; }
      const nextIndex = index >= remaining.length ? remaining.length - 1 : index;
      setLocalClips(remaining);
      setIndex(nextIndex);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!clip?.videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{ animation: "fullscreen-player-in 0.25s ease-out" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 블러 배경 (가로 영상 처리) ── */}
      {clip.thumbnailUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${clip.thumbnailUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) brightness(0.35)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* ── 영상 ── */}
      {!videoError && (
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.videoUrl}
          autoPlay
          playsInline
          preload="metadata"
          loop
          className="absolute inset-0 z-10 h-full w-full"
          style={{
            objectFit: "contain",
            transform: swiping ? `translateY(${swipeY * 0.2}px)` : undefined,
            transition: swiping ? "none" : "transform 0.2s ease",
            filter: effects?.color ? "saturate(1.2) contrast(1.05) brightness(1.02)" : undefined,
          }}
          onClick={(e) => { e.preventDefault(); if (!touchHandled.current) handleTap(); }}
        />
      )}

      {/* ── VideoOverlay ── */}
      {clip.playerName && (clip.spotlightX != null || effects?.eafc || effects?.cinematic) && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <VideoOverlay
            key={playCount}
            spotlight={clip.spotlightX != null && clip.spotlightY != null
              ? { x: clip.spotlightX, y: clip.spotlightY }
              : null}
            player={{
              name: clip.playerName,
              position: clip.playerPosition,
              birthYear: clip.playerBirthYear,
              teamName: clip.teamName,
            }}
            effects={effects}
          />
        </div>
      )}

      {/* ── 에러 UI ── */}
      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-center text-[13px] text-white/70 px-8">{videoError.message}</p>
          {getVideoErrorMessage(videoError.code).retryable && retryCount < 3 && (
            <button onClick={handleRetry} className="rounded-lg bg-white/10 px-4 py-2 text-[12px] text-white active:bg-white/20">다시 시도</button>
          )}
        </div>
      )}

      {/* ── 일시정지 오버레이 ── */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* ── 상단 헤더 ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-2"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white active:bg-black/50"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {clips.length > 1 && (
          <span className="ml-3 font-stat text-[12px] text-white/70">{index + 1} / {clips.length}</span>
        )}
      </div>

      {/* ── 우측 액션 버튼 ── */}
      <div
        className="absolute right-4 bottom-32 z-40 flex flex-col items-center gap-5"
        style={{
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {onShare && (
          <button onClick={() => onShare(clip.id)} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-accent/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <span className="text-[10px] text-white/60">공유</span>
          </button>
        )}
        {onDelete && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/60 active:bg-red-500/30 active:text-red-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </div>
            <span className="text-[10px] text-white/40">삭제</span>
          </button>
        )}
      </div>

      {/* ── 하단 정보 + seekbar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,16px)]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* 선수 정보 */}
        <div className="mb-3 pr-16">
          {clip.playerName && (
            <p className="text-[15px] font-bold text-white">{clip.playerName}</p>
          )}
          {clip.tag && (
            <p className="text-[12px] text-white/60">{clip.tag}</p>
          )}
        </div>

        {/* Seekbar */}
        <div
          className="relative h-6 flex items-center cursor-pointer mb-1"
          onClick={handleSeek}
          onTouchMove={handleSeek}
        >
          <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute h-3 w-3 rounded-full bg-accent"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between font-stat text-[10px] text-white/40">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── 클립 도트 ── */}
      {clips.length > 1 && clips.length <= 12 && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5"
          style={{ opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}
        >
          {clips.map((_, i) => (
            <button
              key={i}
              onClick={() => goToClip(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? "h-5 w-1.5 bg-accent"
                  : "h-1.5 w-1.5 bg-white/30 active:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 로컬 확인**

`npm run dev` 후 피드에서 영상 탭 → 전체화면 플레이어 진입 확인:
- 블러 배경 표시되는지
- 위아래 스와이프로 이전/다음 이동하는지
- 컨트롤 자동 숨김 3초 작동하는지
- 닫기 버튼 (좌상단 ←) 동작하는지

- [ ] **Step 5: 커밋**

```bash
git add src/components/player/ClipPlayerSheet.tsx src/app/globals.css
git commit -m "feat: 전체화면 세로 플레이어 — 블러 배경 + 위아래 스와이프 (인스타그램 스타일)"
```

---

## 최종 점검

- [ ] 업로드 → 효과 선택 → 올리기 → 프로필 탭 → 영상 탭 → 전체화면 재생 → 효과 CSS 확인
- [ ] 가로 영상 업로드 시 블러 배경 확인
- [ ] 스와이프 위 → 다음 클립 / 스와이프 아래 → 이전 클립 / 빠른 스와이프 아래 → 닫기
- [ ] 스킬라벨 없음 확인 (업로드 페이지)
- [ ] 레이더 없음 확인 (스탯 탭)

```bash
git log --oneline -5
```
