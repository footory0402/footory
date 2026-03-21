# 영상 업로드 단순화 + 효과 버그 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업로드 흐름을 4단계→2단계로 단순화하고, 슬로모/BGM을 제거하며, 나찾기(Spotlight) 트림 프레임 버그와 렌더 파이프라인 경량화로 효과 적용 신뢰성을 높인다.

**Architecture:** Zustand 스토어에서 slowmo/bgm 필드를 제거하고, upload/page.tsx를 2-step 단일 스크롤 흐름으로 재구성한다. render-worker의 pipeline/clip.ts에서 슬로모/BGM 패스를 제거해 4패스로 줄인다. SpotlightPicker에 trimStart prop을 추가해 트림 구간 첫 프레임을 보여준다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Zustand, Tailwind CSS, Cloudflare Worker (render-worker)

**Spec:** `docs/superpowers/specs/2026-03-21-upload-simplify-design.md`

---

## 파일 변경 맵

### 삭제
- `src/components/video/SlowmoPicker.tsx`
- `src/components/video/BgmPicker.tsx`
- `src/hooks/useAudioPreview.ts`
- `render-worker/src/container/pipeline/slowmo.ts`
- `render-worker/src/container/pipeline/bgm.ts`

### 수정
- `src/stores/upload-store.ts` — slowmo/bgm 필드·setter 제거
- `src/components/video/SpotlightPicker.tsx` — trimStart prop 추가
- `src/app/upload/page.tsx` — 2-step 흐름으로 재구성
- `src/lib/upload-service.ts` — clipPayload/renderParams 정리
- `src/lib/render-api.ts` — RenderRequest 타입 간소화
- `src/app/api/render/route.ts` — params 정규화 정리
- `render-worker/src/container/pipeline/clip.ts` — 6패스→4패스
- `render-worker/src/container/pipeline/highlight.ts` — bgm import 제거

---

## Task 1: Zustand 스토어 정리

slowmo/bgm 필드와 setter를 제거한다. 이 작업이 기준점이므로 먼저 진행한다.

**Files:**
- Modify: `src/stores/upload-store.ts`

- [ ] **Step 1: slowmo/bgm 필드·setter 제거**

`src/stores/upload-store.ts` 에서 다음을 제거:

```typescript
// interface UploadState에서 제거:
// slowmoStart: number | null;
// slowmoEnd: number | null;
// slowmoSpeed: number;
// bgmId: string | null;
// setSlowmo: (start, end, speed?) => void;
// setBgmId: (id) => void;

// initial 객체에서 제거:
// slowmoStart: null as number | null,
// slowmoEnd: null as number | null,
// slowmoSpeed: 0.5,
// bgmId: null as string | null,

// create() 본문에서 제거:
// setSlowmo: (start, end, speed) => set({...}),
// setBgmId: (bgmId) => set({ bgmId }),
```

- [ ] **Step 2: 타입 에러 확인**

```bash
cd /Users/jiminlee/Desktop/project/footory
npx tsc --noEmit 2>&1 | grep -E "upload-store|setSlowmo|setBgmId|slowmo|bgmId" | head -20
```

`upload-store.ts` 관련 에러가 없으면 OK. 다른 파일의 에러는 다음 Task에서 처리.

- [ ] **Step 3: 커밋**

```bash
git add src/stores/upload-store.ts
git commit -m "refactor: upload-store에서 slowmo/bgm 필드 제거"
```

---

## Task 2: 불필요한 컴포넌트·훅 삭제

**Files:**
- Delete: `src/components/video/SlowmoPicker.tsx`
- Delete: `src/components/video/BgmPicker.tsx`
- Delete: `src/hooks/useAudioPreview.ts`

- [ ] **Step 1: 파일 삭제**

```bash
rm src/components/video/SlowmoPicker.tsx
rm src/components/video/BgmPicker.tsx
rm src/hooks/useAudioPreview.ts
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "refactor: SlowmoPicker, BgmPicker, useAudioPreview 삭제"
```

---

## Task 3: SpotlightPicker — trimStart prop 추가

현재 `video.currentTime = 0.5` 하드코딩을 trimStart를 받아 트림 구간 첫 프레임을 보여주도록 수정.

**Files:**
- Modify: `src/components/video/SpotlightPicker.tsx`

- [ ] **Step 1: trimStart prop 추가**

`src/components/video/SpotlightPicker.tsx` 의 props 인터페이스와 frame capture 로직 수정:

```typescript
interface SpotlightPickerProps {
  file: File;
  spotlightX: number | null;
  spotlightY: number | null;
  onSpotlightChange: (x: number | null, y: number | null) => void;
  trimStart?: number;  // 추가: 트림 시작점 (기본값 0.5)
}
```

그리고 line 42 (`video.currentTime = 0.5;`) 를:

```typescript
video.currentTime = trimStart ?? 0.5;
```

로 변경. `trimStart` prop을 함수 인자에도 구조분해:

```typescript
export default function SpotlightPicker({
  file,
  spotlightX,
  spotlightY,
  onSpotlightChange,
  trimStart,
}: SpotlightPickerProps) {
```

- [ ] **Step 2: 타입 확인**

```bash
npx tsc --noEmit 2>&1 | grep SpotlightPicker
```

에러 없으면 OK.

- [ ] **Step 3: 커밋**

```bash
git add src/components/video/SpotlightPicker.tsx
git commit -m "feat: SpotlightPicker에 trimStart prop 추가 (트림 구간 첫 프레임)"
```

---

## Task 4: upload/page.tsx — 2-step 흐름으로 재구성

4단계 탭 위저드를 2단계(선택+트림 / 꾸미기+업로드)로 재구성한다.

**Files:**
- Modify: `src/app/upload/page.tsx`

- [ ] **Step 1: 현재 파일 구조 파악 후 step 상수 수정**

파일 상단의 STEPS/DECORATE_TABS 상수를 2-step 구조로 교체:

```typescript
// 기존 탭/스텝 상수 제거 후 아래로 교체
const STEP_SELECT = 0;  // 영상 선택 + 트림
const STEP_EDIT = 1;    // 나 찾기 + 효과 + 태그 + 업로드
```

- [ ] **Step 2: Step 0 — 영상 선택 + 트림 통합**

기존 Step 0(파일 선택)과 Step 1(트림)을 하나로 합친다. 파일을 선택하면 바로 트리머가 나타나고, 트림 완료 후 "다음" 버튼이 활성화된다:

```tsx
{/* STEP_SELECT */}
{step === STEP_SELECT && (
  <div className="flex flex-col gap-4">
    {!file ? (
      <VideoSelector
        onFileSelect={(f) => { setFile(f); }}
        context={context}
        childId={childId}
      />
    ) : (
      <>
        <VideoTrimmer
          file={file}
          trimStart={trimStart}
          trimEnd={trimEnd}
          onTrimChange={(start, end) => {
            setTrimStart(start);
            setTrimEnd(end);
          }}
          onDurationDetected={setDuration}
        />
        <div className="flex gap-2 px-4">
          <button
            onClick={() => setFile(null)}
            className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-zinc-400"
          >
            다시 선택
          </button>
          <button
            onClick={() => setStep(STEP_EDIT)}
            className="flex-1 py-3 rounded-xl bg-[#D4A853] text-black font-semibold text-sm"
          >
            다음
          </button>
        </div>
      </>
    )}
  </div>
)}
```

- [ ] **Step 3: Step 1 — 나 찾기 + 효과 + 태그 + 업로드 (단일 스크롤)**

```tsx
{/* STEP_EDIT */}
{step === STEP_EDIT && (
  <div className="flex flex-col gap-6 pb-8">
    {/* 나 찾기 */}
    <section>
      <h3 className="text-sm font-medium text-zinc-400 px-4 mb-3">나 찾기</h3>
      <SpotlightPicker
        file={file!}
        spotlightX={spotlightX}
        spotlightY={spotlightY}
        onSpotlightChange={setSpotlight}
        trimStart={trimStart}
      />
    </section>

    {/* 효과 */}
    <section>
      <h3 className="text-sm font-medium text-zinc-400 px-4 mb-3">효과</h3>
      <div className="px-4">
        <EffectsToggle
          effects={effects}
          onChange={setEffects}
        />
      </div>
    </section>

    {/* 태그 + 메모 */}
    <section className="px-4">
      <TagMemoForm
        tags={tags}
        memo={memo}
        skillLabels={skillLabels}
        customLabels={customLabels}
        context={context}
        challengeTag={challengeTag}
        onTagsChange={setTags}
        onMemoChange={setMemo}
        onSkillLabelsChange={setSkillLabels}
        onCustomLabelsChange={setCustomLabels}
      />
    </section>

    {/* 공개 범위 */}
    <section className="px-4">
      <VisibilitySelector value={visibility} onChange={setVisibility} />
    </section>

    {/* 업로드 버튼 */}
    <div className="px-4">
      <button
        onClick={handleUpload}
        disabled={status === "uploading_raw" || status === "creating_job"}
        className="w-full py-4 rounded-xl bg-[#D4A853] text-black font-bold text-base disabled:opacity-50"
      >
        {status === "uploading_raw" ? `업로드 중 ${progress}%` : "업로드"}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: 헤더 뒤로가기 버튼 step 처리 수정**

```typescript
const handleBack = () => {
  if (step === STEP_EDIT) {
    setStep(STEP_SELECT);
  } else {
    router.back();
  }
};
```

- [ ] **Step 5: 사용되지 않는 import 정리**

`src/app/upload/page.tsx` 상단에서 다음 import 제거:
- `SlowmoPicker` import
- `BgmPicker` import
- `useAudioPreview` import (있다면)
- `SkillLabelPicker` import (line 14 근처 — 2-step 흐름에서 TagMemoForm이 대신 처리)
- `DECORATE_TABS` 상수 및 `decorateTab` 상태 변수 제거

- [ ] **Step 6: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | grep -E "upload/page|SlowmoPicker|BgmPicker|decorateTab|SkillLabelPicker" | head -20
```

- [ ] **Step 7: 커밋**

```bash
git add src/app/upload/page.tsx
git commit -m "feat: 업로드 흐름 4단계→2단계 재구성 (나찾기+효과+태그 단일 스크롤)"
```

---

## Task 5: upload-service.ts — clipPayload 및 renderParams 정리

**Files:**
- Modify: `src/lib/upload-service.ts`

- [ ] **Step 1: clipPayload에서 slowmo/bgm 필드 제거**

`startRenderUpload()` 내 클립 저장 payload 에서 다음 제거 (약 lines 722-725):
```typescript
// 제거:
// slowmo_start: store.slowmoStart,
// slowmo_end: store.slowmoEnd,
// slowmo_speed: store.slowmoSpeed,
// bgm_id: store.bgmId,
```

- [ ] **Step 2: renderParams에서 slowmo/bgm 제거**

약 lines 759-763:
```typescript
// 제거:
// ...(store.slowmoStart !== null ? { slowmoStart: store.slowmoStart } : {}),
// ...(store.slowmoEnd !== null ? { slowmoEnd: store.slowmoEnd } : {}),
// ...(store.slowmoStart !== null && store.slowmoEnd !== null && store.slowmoSpeed > 0
//   ? { slowmoSpeed: store.slowmoSpeed } : {}),
// ...(store.bgmId ? { bgmId: store.bgmId } : {}),
```

- [ ] **Step 3: effects 전달 조건 수정 — 항상 포함**

현재 `Object.keys(store.effects).length > 0` 조건은 항상 true라 문제없지만, 명확하게 수정:

```typescript
// 기존 (line 764):
// ...(Object.keys(store.effects).length > 0 ? { effects: store.effects } : {}),

// 수정:
effects: store.effects,
```

- [ ] **Step 4: 타입 에러 확인**

```bash
npx tsc --noEmit 2>&1 | grep upload-service | head -20
```

- [ ] **Step 5: 커밋**

```bash
git add src/lib/upload-service.ts
git commit -m "fix: renderParams에 effects 항상 포함, slowmo/bgm payload 제거"
```

---

## Task 6: render-api.ts + api/render/route.ts 타입 정리

**Files:**
- Modify: `src/lib/render-api.ts`
- Modify: `src/app/api/render/route.ts`

- [ ] **Step 1: render-api.ts RenderRequest 타입에서 slowmo/bgm 제거**

```typescript
export interface RenderRequest {
  jobId: string;
  clipId: string;
  ownerId: string;
  inputKey: string;
  params: {
    trimStart?: number;
    trimEnd?: number;
    spotlightX?: number;
    spotlightY?: number;
    skillLabels?: string[];
    customLabels?: string[];
    // slowmoStart/End/Speed 제거
    // bgmId 제거
    effects?: {
      color?: boolean;
      cinematic?: boolean;
      eafc?: boolean;
      intro?: boolean;
    };
  };
}
```

- [ ] **Step 2: api/render/route.ts normalizeRenderParams에서 slowmo/bgm 제거**

`NumericRenderParamKey` 타입과 `normalizeRenderParams` 함수에서 slowmo/bgm 관련 코드 제거:

```typescript
// 제거:
// type NumericRenderParamKey = ... | "slowmoStart" | "slowmoEnd" | "slowmoSpeed"

// normalizeRenderParams 내:
// assignNumber("slowmoStart", params.slowmoStart);
// assignNumber("slowmoEnd", params.slowmoEnd);
// assignNumber("slowmoSpeed", params.slowmoSpeed);
// bgmId 처리 블록
```

- [ ] **Step 3: 타입 에러 확인**

```bash
npx tsc --noEmit 2>&1 | grep -E "render-api|render/route" | head -20
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/render-api.ts src/app/api/render/route.ts
git commit -m "refactor: render API 타입에서 slowmo/bgm 제거"
```

---

## Task 7: render-worker 파이프라인 경량화

render-worker 내 slowmo/bgm 패스를 제거하고 4패스 파이프라인으로 축소.

**Files:**
- Delete: `render-worker/src/container/pipeline/slowmo.ts`
- Delete: `render-worker/src/container/pipeline/bgm.ts`
- Modify: `render-worker/src/container/pipeline/clip.ts`
- Modify: `render-worker/src/container/pipeline/highlight.ts`

- [ ] **Step 1: highlight.ts — bgm 참조 먼저 제거 (삭제 전 선행)**

`render-worker/src/container/pipeline/highlight.ts` 에서 다음을 제거:
- line 6: `import { passBgm, downloadBgm } from "./bgm.js";`
- line 15: `bgmR2Key?: string;` (인터페이스에서)
- line 25 구조분해: `const { ..., bgmR2Key } = input;` 에서 `bgmR2Key` 제거
- lines 52-63: `if (bgmR2Key)` 블록 전체 제거

- [ ] **Step 2: slowmo.ts, bgm.ts 삭제**

```bash
rm render-worker/src/container/pipeline/slowmo.ts
rm render-worker/src/container/pipeline/bgm.ts
```

- [ ] **Step 3: clip.ts — 4패스로 재작성**

`render-worker/src/container/pipeline/clip.ts` 에서 slowmo/BGM 관련 코드 전부 제거하고 4패스 구조로 정리:

```typescript
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { downloadFromR2, uploadToR2 } from "../r2.js";
import { updateClipRendered } from "../supabase.js";
import { passColor } from "./color.js";
import { passText } from "./text.js";
import { passRing } from "./ring.js";
import { passIntro } from "./intro.js";
import { passConcat } from "./concat.js";

interface RenderParams {
  trimStart?: number;
  trimEnd?: number;
  spotlightX?: number;
  spotlightY?: number;
  skillLabels?: string[];
  customLabels?: string[];
  playerName?: string;
  playerPosition?: string;
  playerNumber?: number;
  effects?: {
    color?: boolean;
    cinematic?: boolean;
    eafc?: boolean;
    intro?: boolean;
  };
}

interface RenderInput {
  jobId: string;
  clipId: string;
  inputKey: string;
  params: RenderParams;
}

/**
 * 4패스 렌더 파이프라인
 *
 * Pass 1: 색보정 + 스케일 + 레터박스 (트림 포함)
 * Pass 2: 텍스트 오버레이 (EA FC 카드)
 * Pass 3: 골드 링 / 스포트라이트
 * Pass 4: 인트로 카드 + concat (인트로 있을 때만)
 */
export async function renderClip(input: RenderInput): Promise<string> {
  const { jobId, clipId, inputKey, params } = input;
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const workDir = await mkdtemp(join(tmpdir(), `render-${jobId}-`));

  try {
    const rawPath = join(workDir, "raw.mp4");
    const pass1Out = join(workDir, "pass1.mp4");
    const pass2Out = join(workDir, "pass2.mp4");
    const pass3Out = join(workDir, "pass3.mp4");
    const introOut = join(workDir, "intro.mp4");
    const finalOut = join(workDir, "final.mp4");

    console.log(`[Render] Downloading ${inputKey}...`);
    await downloadFromR2(inputKey, rawPath);

    // Pass 1: 색보정 + 스케일 + 트림
    console.log(`[Render] Pass 1: Color + scale + trim...`);
    await passColor(rawPath, pass1Out, {
      trimStart: params.trimStart,
      trimEnd: params.trimEnd,
      colorEnabled: params.effects?.color,
      cinematicEnabled: params.effects?.cinematic,
    });

    // Pass 2: 텍스트 (EA FC 카드)
    console.log(`[Render] Pass 2: Text overlay...`);
    await passText(pass1Out, pass2Out, {
      skillLabels: params.skillLabels,
      customLabels: params.customLabels,
      playerName: params.playerName,
      playerPosition: params.playerPosition,
      playerNumber: params.playerNumber,
      eafcEnabled: params.effects?.eafc,
    });

    // Pass 3: 골드 링 / 스포트라이트
    console.log(`[Render] Pass 3: Ring overlay...`);
    await passRing(pass2Out, pass3Out, {
      spotlightX: params.spotlightX,
      spotlightY: params.spotlightY,
    });

    // Pass 4: 인트로 카드 + concat (인트로 있을 때만)
    if (params.effects?.intro && params.playerName) {
      console.log(`[Render] Pass 4: Intro card + concat...`);
      await passIntro(introOut, {
        playerName: params.playerName,
        playerPosition: params.playerPosition,
        playerNumber: params.playerNumber,
      });
      await passConcat([introOut, pass3Out], finalOut);
    } else {
      // 인트로 없음 — pass3 결과를 finalOut으로 복사
      await passConcat([pass3Out], finalOut);
    }

    const outputKey = inputKey.replace("raw/", "clips/");
    console.log(`[Render] Uploading to ${outputKey}...`);
    await uploadToR2(finalOut, outputKey);

    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${outputKey}`
      : outputKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase env not configured");
    }

    await updateClipRendered(supabaseUrl, supabaseKey, clipId, publicUrl, jobId);

    console.log(`[Render] Job ${jobId} completed.`);
    return outputKey;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
```

- [ ] **Step 4: render-worker 타입 확인**

```bash
cd render-worker && npx tsc --noEmit 2>&1 | head -30 && cd ..
```

에러 없으면 OK.

- [ ] **Step 5: 커밋**

```bash
git add render-worker/
git commit -m "refactor: render-worker 4패스로 경량화, slowmo/bgm 파이프라인 제거"
```

---

## Task 8: 전체 빌드 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 TypeScript 타입 체크**

```bash
cd /Users/jiminlee/Desktop/project/footory
npx tsc --noEmit 2>&1 | head -40
```

에러가 있으면 해당 파일 수정 후 재확인.

- [ ] **Step 2: Next.js 빌드**

```bash
npm run build 2>&1 | tail -30
```

빌드 성공 확인.

- [ ] **Step 3: 커밋 (빌드 픽스가 있었다면)**

```bash
git add -A
git commit -m "fix: 빌드 에러 수정"
```

---

## Task 9: 효과 버그 디버깅

효과가 실제로 렌더에 반영되는지 확인하고, 문제가 있으면 수정한다.

**Files:**
- Modify: `src/lib/upload-service.ts` (로그 추가)
- Modify: `src/app/api/render/route.ts` (로그 추가)

- [ ] **Step 1: upload-service.ts에 렌더 요청 로그 추가**

`startRenderUpload()` 내 `/api/render` 호출 직전에 추가:

```typescript
console.log("[upload-service] render params:", JSON.stringify(renderParams, null, 2));
```

- [ ] **Step 2: api/render/route.ts에 params 수신 로그 추가**

```typescript
// POST handler 상단 body 파싱 후:
console.log("[render/route] received params:", JSON.stringify(normalizedParams, null, 2));
```

- [ ] **Step 3: 실제 업로드 테스트**

앱을 실행해서 영상 업로드 후:
1. 색보정 효과를 켜고 업로드
2. Vercel Functions 로그에서 `[render/route] received params:` 확인
3. `effects.color: true` 가 포함되어 있는지 확인

```bash
# 로컬 테스트라면:
npm run dev
# Vercel 배포 환경이라면 Vercel 대시보드 Functions 탭 → 로그 확인
```

- [ ] **Step 4: 결과에 따른 조치**

**케이스 A — params에 effects가 없거나 false로 고정:**
→ upload-service.ts Task 5 Step 3 확인, 이미 수정됨

**케이스 B — params 정상인데 렌더 결과가 원본과 동일:**
→ Cloudflare Worker 로그 확인:
```bash
cd render-worker
npx wrangler tail --format pretty
```
`[RenderContainer] Started` 메시지가 없으면 Container cold start 실패

**케이스 C — Container 시작 실패:**
→ Cloudflare Dashboard → Workers → footory-render → Logs 에서 에러 확인
→ 필요시 `cd render-worker && npx wrangler deploy` 로 재배포

- [ ] **Step 5: 로그 코드 제거 후 커밋**

디버깅 완료 후 추가했던 console.log 제거:

```bash
git add src/lib/upload-service.ts src/app/api/render/route.ts
git commit -m "fix: 효과 렌더 파라미터 전달 검증 완료"
```

---

## 완료 기준

- [ ] 업로드가 2단계로 동작함 (선택+트림 → 나찾기+효과+태그+업로드)
- [ ] SlowmoPicker, BgmPicker UI가 없음
- [ ] SpotlightPicker가 트림 시작점 프레임을 보여줌
- [ ] 색보정 ON 후 업로드 시 최종 영상에 색보정이 적용됨
- [ ] `npm run build` 성공
- [ ] `npx tsc --noEmit` 에러 없음
