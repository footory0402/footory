# Video Overlay (Spotlight Ring + EA FC Nametag) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영상 재생 시작 1초 동안 스포트라이트 링 + EA FC 스타일 네임태그를 CSS 오버레이로 표시하고, 업로드 2단계 화면에 SpotlightPicker를 통합한다.

**Architecture:** DB·업로드 파이프라인 변경 없이 기존 `clips.spotlight_x/y` 컬럼과 `upload-store`의 `setSpotlight()`을 그대로 활용. `VideoOverlay` 컴포넌트(CSS 애니메이션 전용)를 신규 생성하고, `SpotlightPicker`를 `_future/`에서 정식 경로로 이동 후 `ClipPlayerSheet`에 오버레이를 합성한다. 플레이어 정보(이름/포지션/팀명)는 이미 `FeedItemEnriched`에 있으며, `birth_year`만 추가로 파이프라인에 연결한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, React (CSS 애니메이션, `key` prop 리트리거 패턴)

---

## 파일 구조

### 신규 생성
| 파일 | 역할 |
|------|------|
| `src/components/video/VideoOverlay.tsx` | 스포트라이트 링 + 네임태그 + 애니메이션 (pure UI, props만 받음) |

### 이동 + 수정
| 원본 | 이동 후 | 변경 |
|------|---------|------|
| `src/components/video/_future/SpotlightPicker.tsx` | `src/components/upload/SpotlightPicker.tsx` | 볼드 스타일 적용, 힌트 텍스트 추가 |

### 수정
| 파일 | 변경 |
|------|------|
| `src/hooks/useFeed.ts` | `FeedItemEnriched`에 `playerBirthYear: number \| null` 추가 |
| `src/lib/server/feed.ts` | `mapRowToEnriched()`에서 `birth_year` 포함 |
| `src/components/player/ClipPlayerSheet.tsx` | `PlayableClip` 타입 확장 + `VideoOverlay` 합성 |
| `src/components/feed/FeedList.tsx` | `handlePlay()`에서 spotlight + birthYear → PlayableClip 전달 |
| `src/app/upload/page.tsx` | `SpotlightPicker`를 태그/메모 섹션에 통합 |

### 수정하지 않는 파일
- `src/lib/upload-service.ts` — spotlight_x/y 전달 이미 구현됨
- `src/stores/upload-store.ts` — setSpotlight() 이미 구현됨
- `supabase/migrations/` — DB 컬럼 이미 존재, 마이그레이션 불필요

> **주의:** `src/app/api/clips/route.ts`는 clips 테이블에 spotlight를 저장하지만, `feed_items.metadata`에는 포함하지 않는다. 오버레이가 피드에서 동작하려면 **Task 6에서 이 파일도 수정해야 한다.**

---

## Task 1: FeedItemEnriched에 birth_year 추가

**Files:**
- Modify: `src/hooks/useFeed.ts`
- Modify: `src/lib/server/feed.ts`

- [ ] **Step 1: `useFeed.ts`의 `FeedItemEnriched` 인터페이스에 필드 추가**

`src/hooks/useFeed.ts`의 `FeedItemEnriched` 인터페이스에 아래 필드를 추가한다:

```typescript
// 기존 필드들 아래에 추가
playerBirthYear: number | null;
```

- [ ] **Step 2: `feed.ts`의 `mapRowToEnriched()`에서 birth_year 포함**

`src/lib/server/feed.ts`의 `mapRowToEnriched()` 함수 반환 객체에 추가:

```typescript
playerBirthYear: profile?.birth_year ?? null,
```

`FeedRow` 인터페이스에 이미 `birth_year: number | null`이 있으므로 (`profiles` 서브타입) 타입 오류 없음.

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음 (또는 이 변경과 무관한 기존 오류만)

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/useFeed.ts src/lib/server/feed.ts
git commit -m "[Video-Overlay] feat: FeedItemEnriched에 playerBirthYear 추가"
```

---

## Task 2: VideoOverlay 컴포넌트 신규 생성

**Files:**
- Create: `src/components/video/VideoOverlay.tsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

`src/components/video/VideoOverlay.tsx` 신규 작성:

```tsx
"use client";

/**
 * VideoOverlay — 스포트라이트 링 + EA FC 네임태그 오버레이
 *
 * 영상 재생 시작 1초 동안 표시 후 페이드아웃.
 * key prop 변경으로 애니메이션 리트리거 (재생할 때마다 새 key 전달).
 * pointer-events: none → 영상 컨트롤 방해 없음.
 */

interface VideoOverlayProps {
  spotlight: { x: number; y: number };
  player: {
    name: string;
    position?: string | null;
    birthYear?: number | null;
    teamName?: string | null;
  };
}

function calcAgeGroup(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  return `U${age}`;
}

function getTeamInitial(teamName: string): string {
  // "서울 FC" → "서울", "광주" → "광", 최대 2글자
  const parts = teamName.trim().split(/\s+/);
  return parts[0].slice(0, 2);
}

export default function VideoOverlay({ spotlight, player }: VideoOverlayProps) {
  const { x, y } = spotlight;

  const infoChunks: string[] = [];
  if (player.position) infoChunks.push(player.position);
  if (player.birthYear) infoChunks.push(calcAgeGroup(player.birthYear));
  if (player.teamName) infoChunks.push(player.teamName);
  const infoLine = infoChunks.join(" · ");

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ willChange: "opacity" }}
    >
      {/* 스포트라이트 링 — 0.2s 등장 후 0.8s에 페이드아웃 */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          animation: "overlay-ring-in 0.2s ease-out forwards, overlay-fadeout 0.2s ease-in 0.8s forwards",
        }}
      >
        {/* 링 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3.5px solid #D4A853",
            background:
              "radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)",
            boxShadow:
              "0 0 0 0 rgba(212,168,83,0.4), 0 0 16px rgba(212,168,83,0.3)",
            animation: "overlay-pulse 0.8s ease-out 0.8s forwards",
          }}
        />

        {/* ▼ 화살표 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translateX(-50%)",
            marginTop: 4,
            color: "#D4A853",
            fontSize: 12,
            filter: "drop-shadow(0 0 4px rgba(212,168,83,0.6))",
            animation: "overlay-bounce 0.6s ease-in-out 0.2s",
          }}
        >
          ▼
        </div>
      </div>

      {/* 네임태그 카드 — 하단 중앙 */}
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
            background: "rgba(15,15,18,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(212,168,83,0.35)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "overlay-fadeout 0.2s ease-in 0.8s forwards",
          }}
        >
          {/* 팀 배지 */}
          {player.teamName && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #D4A853 0%, #A07830 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#0A0A0C",
                letterSpacing: "-0.5px",
              }}
            >
              {getTeamInitial(player.teamName)}
            </div>
          )}

          {/* 텍스트 */}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-body, 'Noto Sans KR', sans-serif)",
                fontSize: 15,
                fontWeight: 700,
                color: "#FAFAFA",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {player.name}
            </p>
            {infoLine && (
              <p
                style={{
                  fontSize: 11,
                  color: "#A1A1AA",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
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

- [ ] **Step 2: globals.css에 애니메이션 키프레임 추가**

`src/app/globals.css`에 아래 keyframe 블록을 추가한다 (기존 @keyframes 섹션 근처):

```css
/* ── VideoOverlay 애니메이션 ── */
@keyframes overlay-ring-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes overlay-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(212,168,83,0.4), 0 0 16px rgba(212,168,83,0.3); }
  100% { box-shadow: 0 0 0 8px rgba(212,168,83,0), 0 0 0 rgba(212,168,83,0); }
}
@keyframes overlay-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(4px); }
}
@keyframes overlay-nametag-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes overlay-fadeout {
  from { opacity: 1; }
  to   { opacity: 0; visibility: hidden; }
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/video/VideoOverlay.tsx src/app/globals.css
git commit -m "[Video-Overlay] feat: VideoOverlay 컴포넌트 + 애니메이션 키프레임 추가"
```

---

## Task 3: SpotlightPicker 정식 경로로 이동 + 볼드 스타일 적용

**Files:**
- Create: `src/components/upload/SpotlightPicker.tsx` (내용은 `_future/` 버전 기반으로 업데이트)
- 기존 `_future/SpotlightPicker.tsx`는 삭제하지 않음 (다른 참조 없음 확인 후 삭제 가능)

- [ ] **Step 1: 새 경로에 SpotlightPicker 작성**

`src/components/upload/SpotlightPicker.tsx`를 아래와 같이 작성한다. 기존 `_future/` 버전의 로직(프레임 캡처, 포인터 이벤트, 초기화)을 유지하되 볼드 스타일과 힌트 텍스트를 적용한다:

```tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";
import { useUploadStore } from "@/stores/upload-store";

interface SpotlightPickerProps {
  file: File;
  trimStart?: number;
}

export default function SpotlightPicker({ file, trimStart }: SpotlightPickerProps) {
  const { profile } = useProfileContext();
  const isParent = useUploadStore((s) => s.context === "parent");
  const childName = useUploadStore((s) => s.childName);
  const spotlightX = useUploadStore((s) => s.spotlightX);
  const spotlightY = useUploadStore((s) => s.spotlightY);
  const setSpotlight = useUploadStore((s) => s.setSpotlight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [frameUrl, setFrameUrl] = useState<string>("");
  const [hintVisible, setHintVisible] = useState(true);

  const hasPoint = spotlightX !== null && spotlightY !== null;

  // 첫 프레임 캡처
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = trimStart && trimStart > 0 ? trimStart : 0.5;
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
      URL.revokeObjectURL(url);
    };

    return () => URL.revokeObjectURL(url);
  }, [file, trimStart]);

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setSpotlight(x, y);
      setHintVisible(false);
    },
    [setSpotlight]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSpotlight(null, null);
      setHintVisible(true);
    },
    [setSpotlight]
  );

  const displayName = isParent ? (childName ?? "아이") : (profile?.name ?? "나");

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[14px] font-semibold text-text-1">
        주인공 위치 <span className="text-[12px] font-normal text-text-3">(선택)</span>
      </h3>

      {/* 프레임 + 터치 영역 */}
      <div
        ref={containerRef}
        className="relative overflow-visible rounded-xl bg-black touch-none cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        onPointerDown={handleTap}
        role="application"
        aria-label={isParent ? "영상에서 아이 위치 선택" : "영상에서 선수 위치 선택"}
        tabIndex={0}
      >
        {frameUrl ? (
          <img src={frameUrl} alt="영상 프레임" className="w-full rounded-xl" />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-xl bg-card">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        )}

        {/* 힌트 텍스트 */}
        {frameUrl && hintVisible && !hasPoint && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
            <div className="rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
              <p className="text-[13px] font-medium text-white/90">
                {displayName}의 위치를 탭하세요
              </p>
            </div>
          </div>
        )}

        {/* 볼드 스타일 링 */}
        {hasPoint && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${spotlightX! * 100}%`,
              top: `${spotlightY! * 100}%`,
            }}
          >
            {/* 링 */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "3.5px solid #D4A853",
                background: "radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)",
                boxShadow: "0 0 0 4px rgba(212,168,83,0.15), 0 0 16px rgba(212,168,83,0.3)",
              }}
            />

            {/* 네임태그 미리보기 */}
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-sm border border-accent/30">
              <p className="text-[12px] font-bold text-accent">{displayName}</p>
              {profile?.position && !isParent && (
                <p className="text-[10px] text-text-3">{profile.position}</p>
              )}
            </div>

            {/* X 버튼 */}
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/70 ring-1 ring-white/20 active:text-white"
              aria-label="선수 위치 초기화"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 안내 텍스트 */}
      <p className="text-[12px] text-text-3">
        {hasPoint
          ? `영상 시작 1초 동안 ${displayName}의 위치가 하이라이트됩니다`
          : "탭한 위치에 스포트라이트 링이 표시됩니다"}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/upload/SpotlightPicker.tsx
git commit -m "[Video-Overlay] feat: SpotlightPicker 정식 경로로 이동 + 볼드 스타일 적용"
```

---

## Task 4: 업로드 페이지에 SpotlightPicker 통합

**Files:**
- Modify: `src/app/upload/page.tsx`

- [ ] **Step 1: import 추가**

`src/app/upload/page.tsx` 상단 import 섹션에 추가:

```typescript
import SpotlightPicker from "@/components/upload/SpotlightPicker";
```

- [ ] **Step 2: 태그/메모 섹션에 SpotlightPicker 삽입**

`store.file && (...)` 블록 내, 태그 섹션 위에 SpotlightPicker를 추가한다:

```tsx
{/* 주인공 위치 선택 */}
<SpotlightPicker
  file={store.file}
  trimStart={store.trimStart > 0 ? store.trimStart : undefined}
/>
```

삽입 위치: `{/* 태그 */}` 주석 바로 위.

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/upload/page.tsx
git commit -m "[Video-Overlay] feat: 업로드 페이지에 SpotlightPicker 통합"
```

---

## Task 5: ClipPlayerSheet — PlayableClip 확장 + VideoOverlay 합성

**Files:**
- Modify: `src/components/player/ClipPlayerSheet.tsx`

- [ ] **Step 1: PlayableClip 인터페이스 확장 + VideoOverlay import**

`ClipPlayerSheet.tsx` 상단에 import 추가:

```typescript
import VideoOverlay from "@/components/video/VideoOverlay";
```

`PlayableClip` 인터페이스에 아래 필드를 추가:

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
}
```

- [ ] **Step 2: playCount state 추가 (애니메이션 리트리거용)**

컴포넌트 state 선언부에 추가:

```typescript
const [playCount, setPlayCount] = useState(0);
```

기존 `onPlay` 이벤트 핸들러에서 `playCount` 증가:

```typescript
const onPlay = () => {
  setPaused(false);
  scheduleHide();
  setPlayCount((c) => c + 1); // overlay 애니메이션 리트리거
};
```

- [ ] **Step 3: VideoOverlay를 video 요소 아래에 합성**

`<video ... />` 태그 바로 아래, `{/* Video error UI */}` 주석 위에 삽입:

```tsx
{/* VideoOverlay — spotlight_x/y가 있을 때만 표시 */}
{clip.spotlightX != null && clip.spotlightY != null && clip.playerName && (
  <VideoOverlay
    key={playCount}
    spotlight={{ x: clip.spotlightX, y: clip.spotlightY }}
    player={{
      name: clip.playerName,
      position: clip.playerPosition,
      birthYear: clip.playerBirthYear,
      teamName: clip.teamName,
    }}
  />
)}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/player/ClipPlayerSheet.tsx src/components/video/VideoOverlay.tsx
git commit -m "[Video-Overlay] feat: ClipPlayerSheet에 VideoOverlay 합성"
```

---

## Task 6: FeedList — handlePlay에서 spotlight + birthYear 전달

**Files:**
- Modify: `src/components/feed/FeedList.tsx`

- [ ] **Step 1: handlePlay()에서 spotlight + 선수 정보 포함**

기존 `setPlayerClips([{...}])` 블록을 아래와 같이 업데이트:

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
    // spotlight overlay
    spotlightX: typeof meta.spotlight_x === "number" ? meta.spotlight_x : null,
    spotlightY: typeof meta.spotlight_y === "number" ? meta.spotlight_y : null,
    playerName: item.playerName,
    playerPosition: item.playerPosition,
    playerBirthYear: item.playerBirthYear,
    teamName: item.teamName,
  }]);
}, []);
```

**주의:** `meta.spotlight_x/y`는 feed_items.metadata JSON에 포함되어 있어야 함. 현재 clips route가 feed_item 생성 시 metadata에 spotlight를 포함하는지 확인 필요.

- [ ] **Step 2: `src/app/api/clips/route.ts`의 `feedTask()` metadata에 spotlight 추가**

`clips/route.ts`의 `feedTask()` 함수 (약 line 172-185)에서 `feed_items` INSERT 시 metadata 객체에 spotlight를 추가한다.
현재 코드:

```typescript
metadata: {
  video_url: clip.video_url,
  thumbnail_url: clip.thumbnail_url,
  duration: clip.duration_seconds,
  tags: validTags,
  memo: clip.memo,
},
```

수정 후:

```typescript
metadata: {
  video_url: clip.video_url,
  thumbnail_url: clip.thumbnail_url,
  duration: clip.duration_seconds,
  tags: validTags,
  memo: clip.memo,
  spotlight_x: clip.spotlight_x ?? null,
  spotlight_y: clip.spotlight_y ?? null,
},
```

`clip` 객체는 `.select().single()` 반환값이므로 `clip.spotlight_x/y`가 타입 안전하게 접근 가능하다.

**동일한 패턴이 `src/app/api/parent/upload/route.ts`에도 있는지 확인하여 동일하게 수정한다.**

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/feed/FeedList.tsx src/app/api/clips/route.ts src/app/api/parent/upload/route.ts
git commit -m "[Video-Overlay] feat: FeedList handlePlay spotlight 전달 + clips route metadata 포함"
```

---

## Task 7: 엣지 케이스 처리 및 검증

**Files:**
- Review: `src/components/video/VideoOverlay.tsx`
- Review: `src/components/upload/SpotlightPicker.tsx`

- [ ] **Step 1: 엣지 케이스 체크리스트 검토**

| 케이스 | 처리 방법 | 확인 |
|--------|-----------|------|
| 팀 없는 선수 | `player.teamName` 없으면 팀배지 숨김 (이미 `&&` 조건으로 처리됨) | ✓ |
| 포지션 없는 선수 | `infoLine`에서 `position` 생략됨 | ✓ |
| `spotlight_x == null` | `ClipPlayerSheet`에서 `clip.spotlightX != null` 조건으로 오버레이 미표시 | ✓ |
| 가장자리 좌표 (x>0.9 등) | `overflow-visible`로 링이 잘리지 않음 | ✓ |
| 재생 반복 시 리트리거 | `key={playCount}` 패턴으로 재마운트 | ✓ |
| 부모 업로드 | `isParent` + `childName` 으로 힌트 텍스트 분기됨 | ✓ |

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory && npx next build 2>&1 | tail -20
```

Expected: 빌드 성공 (오류 없음)

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "[Video-Overlay] chore: 엣지 케이스 확인 및 최종 정리"
```

---

## 완료 기준

- [ ] 영상 업로드 2단계 화면에 SpotlightPicker가 표시되고, 탭 시 골드 링 미리보기가 나타남
- [ ] spotlight 지정 없이 업로드 시 기존 플로우와 동일하게 동작
- [ ] ClipPlayerSheet 재생 시, spotlight_x/y가 있는 클립에서 1초 인트로 오버레이가 나타나고 페이드아웃
- [ ] 재생 반복 시마다 오버레이 애니메이션이 리트리거됨
- [ ] 팀 없는 선수 / 포지션 없는 선수 엣지 케이스에서 UI가 깨지지 않음
- [ ] TypeScript 컴파일 오류 없음
- [ ] `npx next build` 성공
