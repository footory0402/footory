# 프로필 UX 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로필 페이지의 인증 뱃지 제거, 탭 명칭 명확화, 편집 접근성 개선, 빈 상태 가이드 강화, 프로필 완성도 가이드 신규 추가

**Architecture:** 기존 3탭 구조(하이라이트/기록/커리어) 유지, 각 컴포넌트에서 VerifyBadge 참조 제거 후 개별 UX 개선 적용. 신규 `ProfileCompletionGuide` 컴포넌트를 props 주입 방식으로 `profile/page.tsx`에 통합.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Zustand

**Spec:** `docs/superpowers/specs/2026-03-23-profile-ux-redesign-design.md`

---

## 파일 구조

| 파일 | 변경 |
|------|------|
| `src/components/profile/VerifyBadge.tsx` | 삭제 |
| `src/components/profile/ProfileTabBar.tsx` | "기록" → "스탯" 라벨 변경 |
| `src/components/profile/RecordsTabV5.tsx` | VerifyBadge 제거, 빈 상태 개선, 탭 설명 추가 |
| `src/components/profile/CareerTabV5.tsx` | VerifyBadge 제거 |
| `src/components/profile/HighlightsTabV5.tsx` | 완전 빈 상태 개선 |
| `src/components/profile/HeroSection.tsx` | 액션 바 제거, 아이콘 버튼 추가, `onPdf` prop 제거 |
| `src/components/player/ProfileEditSheet.tsx` | PDF 내보내기 버튼 추가 |
| `src/components/profile/ProfileCompletionGuide.tsx` | 신규 생성 |
| `src/app/profile/page.tsx` | ProfileCompletionGuide 통합, `onPdf` 제거 |
| `src/app/p/[handle]/client.tsx` | `isScoutViewer` 조건 검토 |

---

## Task 1: VerifyBadge 제거

**Files:**
- Delete: `src/components/profile/VerifyBadge.tsx`
- Modify: `src/components/profile/RecordsTabV5.tsx`
- Modify: `src/components/profile/CareerTabV5.tsx`

- [ ] **Step 1: RecordsTabV5에서 VerifyBadge import 및 사용 제거**

`RecordsTabV5.tsx`에서:
```diff
- import VerifyBadge from "./VerifyBadge";
```
그리고 범례 div 제거 (약 213~218행):
```diff
-       {stats.length > 0 && !isEditMode && (
-         <div className="mb-[10px] flex gap-2">
-           <VerifyBadge source="team" verifier="팀 인증" compact />
-           <VerifyBadge source="self" compact />
-         </div>
-       )}
```
그리고 개별 스탯 카드의 `<VerifyBadge source={source} compact />` 제거 (약 555행)

- [ ] **Step 2: CareerTabV5에서 VerifyBadge import 및 사용 제거**

`CareerTabV5.tsx`에서:
```diff
- import VerifyBadge from "./VerifyBadge";
```
그리고 `<VerifyBadge source={t.source} verifier={t.verifier} />` (약 394행) 제거
그리고 `<VerifyBadge source={a.source} verifier={a.verifier} compact />` (약 523행) 제거

- [ ] **Step 3: VerifyBadge.tsx 파일 삭제**

```bash
rm src/components/profile/VerifyBadge.tsx
```

- [ ] **Step 4: 빌드 확인**

```bash
npx tsc --noEmit
```
Expected: 타입 에러 없음 (VerifyBadge 참조 완전 제거 확인)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor: VerifyBadge 컴포넌트 제거 — 팀인증/자기기록 뱃지 단순화"
```

---

## Task 2: 탭 이름 변경 ("기록" → "스탯")

**Files:**
- Modify: `src/components/profile/ProfileTabBar.tsx`

- [ ] **Step 1: TABS 배열에서 "기록" → "스탯" 변경**

`ProfileTabBar.tsx` 14~17행:
```diff
  const TABS: { key: ProfileTabKey; label: string }[] = [
    { key: "highlights", label: "하이라이트" },
-   { key: "records", label: "기록" },
+   { key: "records", label: "스탯" },
    { key: "career", label: "커리어" },
  ];
```

> `ProfileTabKey` 타입 (`"records"`)은 변경하지 않음. 라벨만 변경.

- [ ] **Step 2: 브라우저에서 확인**

`/profile` 접속 → 탭 바에 "스탯"으로 표시되는지 확인

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/ProfileTabBar.tsx
git commit -m "feat: 프로필 탭 이름 '기록' → '스탯' 변경"
```

---

## Task 3: HeroSection 액션 바 → 아이콘 버튼으로 교체

**Files:**
- Modify: `src/components/profile/HeroSection.tsx`

현재: 카드 하단에 텍스트 버튼 3개 (공유/PDF/편집)
변경: `onPdf` prop 제거, 편집/공유 아이콘 버튼을 카드 우상단으로 이동

- [ ] **Step 1: HeroSectionProps에서 onPdf 제거, 아이콘 버튼 추가**

`HeroSection.tsx` 상단 인터페이스:
```diff
  interface HeroSectionProps {
    profile: Profile;
    playStyle: PlayStyle | null;
    teamState: TeamState;
    onEdit?: () => void;
    onShare?: () => void;
-   onPdf?: () => void;
    onAvatarUpload?: (file: File) => Promise<void>;
    onTeamChange?: () => void;
  }
```

함수 파라미터:
```diff
  function HeroSectionInner({
    profile,
    playStyle: _playStyle,
    teamState,
    onEdit,
    onShare,
-   onPdf,
    onAvatarUpload,
    onTeamChange,
  }: HeroSectionProps) {
```

- [ ] **Step 2: 카드 상단 우측에 아이콘 버튼 추가**

카드 컨테이너 div (약 87행, `background: "#111111"`) 내부, 상단 섹션 시작 전에:

```tsx
{/* 우상단 액션 아이콘 */}
{(onEdit || onShare) && (
  <div style={{
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 6,
    zIndex: 4,
  }}>
    {onShare && (
      <button
        onClick={onShare}
        style={{
          width: 32, height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
        aria-label="프로필 공유"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </button>
    )}
    {onEdit && (
      <button
        onClick={onEdit}
        style={{
          width: 32, height: 32,
          borderRadius: "50%",
          background: "rgba(212,168,83,0.12)",
          border: "1px solid rgba(212,168,83,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
        aria-label="프로필 편집"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e8d48b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    )}
  </div>
)}
```

카드 컨테이너 div에 `position: "relative"` 추가 확인 (이미 있을 수 있음).

- [ ] **Step 3: 하단 액션 바 제거**

`showActionBar` 변수 및 하단 액션 바 렌더링 전체 제거 (약 83행, 316~355행):
```diff
- const showActionBar = onShare || onPdf || onEdit;
  ...
- {showActionBar && (
-   <div style={{ display: "flex", borderTop: ... }}>
-     ...
-   </div>
- )}
```

- [ ] **Step 4: 브라우저 확인**

`/profile` → HeroSection 우상단에 편집(금색)/공유(회색) 아이콘 버튼 표시 확인
하단 텍스트 버튼 없어졌는지 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/profile/HeroSection.tsx
git commit -m "feat: HeroSection 편집/공유 버튼 우상단 아이콘으로 개선, PDF 버튼 제거"
```

---

## Task 4: ProfileEditSheet에 PDF 내보내기 버튼 추가

**Files:**
- Modify: `src/components/player/ProfileEditSheet.tsx`
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: ProfileEditSheet props에 onPdf 추가**

```diff
  interface ProfileEditSheetProps {
    profile: Profile;
    open: boolean;
    onClose: () => void;
    onSave: (updates: Record<string, unknown>) => Promise<void>;
    onAvatarUpload: (file: File) => Promise<void>;
    onCheckHandle: (handle: string) => Promise<boolean>;
+   onPdf?: () => void;
  }
```

- [ ] **Step 2: Sticky Actions에 PDF 버튼 추가**

`ProfileEditSheet.tsx` Sticky Actions 섹션 (285~302행) 수정:
```diff
  <div className="shrink-0 border-t border-white/[0.06] bg-card px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
+   {onPdf && (
+     <button
+       onClick={() => { onClose(); setTimeout(onPdf!, 300); }}
+       className="mb-2 w-full rounded-lg bg-bg py-2.5 text-sm font-medium text-text-3 ring-1 ring-border"
+     >
+       PDF로 내보내기
+     </button>
+   )}
    <div className="flex gap-3">
      <button onClick={onClose} ...>취소</button>
      <button onClick={handleSave} ...>저장</button>
    </div>
  </div>
```

- [ ] **Step 3: profile/page.tsx에서 onPdf prop 전달 및 HeroSection onPdf 제거**

`profile/page.tsx`에서:
1. 선수 뷰 HeroSection (약 168행): `onPdf={() => setPdfExportOpen(true)}` 제거
2. 스카우터 뷰 HeroSection (약 239행): `onPdf={() => setPdfExportOpen(true)}` 제거
3. 선수 뷰 ProfileEditSheet (약 205행): `onPdf={() => setPdfExportOpen(true)}` 추가
4. 스카우터 뷰 ProfileEditSheet (약 281행): `onPdf={() => setPdfExportOpen(true)}` 추가

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/player/ProfileEditSheet.tsx src/app/profile/page.tsx
git commit -m "feat: PDF 내보내기 버튼 ProfileEditSheet 내부로 이동"
```

---

## Task 5: HighlightsTab 빈 상태 개선

**Files:**
- Modify: `src/components/profile/HighlightsTabV5.tsx`

현재: 클립이 없을 때 아무것도 표시 안 됨 (`!readOnly ? null : null`)
변경: 빈 상태에 명확한 CTA 추가

- [ ] **Step 1: 완전 빈 상태 CTA 추가**

`HighlightsTabV5.tsx` 156~173행 중 빈 상태 처리 부분 수정:

```diff
- ) : !readOnly ? null : null}
+ ) : !readOnly ? (
+   <div style={{
+     display: "flex", flexDirection: "column", alignItems: "center",
+     gap: 12, padding: "32px 16px", textAlign: "center",
+   }}>
+     <div style={{
+       width: 56, height: 56, borderRadius: "50%",
+       background: "rgba(212,168,83,0.08)",
+       display: "flex", alignItems: "center", justifyContent: "center",
+     }}>
+       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
+         <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
+       </svg>
+     </div>
+     <div>
+       <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-1)", marginBottom: 4, fontFamily: "var(--font-body)" }}>
+         첫 하이라이트를 올려보세요
+       </p>
+       <p style={{ fontSize: 12, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
+         스킬을 태그하면 포지션별로 정리돼요
+       </p>
+     </div>
+     <Link
+       href="/upload"
+       style={{
+         marginTop: 4, padding: "10px 20px", borderRadius: 12,
+         background: "var(--color-accent)", color: "var(--color-bg)",
+         fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
+         textDecoration: "none",
+       }}
+     >
+       영상 업로드 →
+     </Link>
+   </div>
+ ) : null}
```

- [ ] **Step 2: 브라우저 확인**

클립이 없는 계정으로 `/profile` → 하이라이트 탭 → 빈 상태 CTA 표시 확인

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/HighlightsTabV5.tsx
git commit -m "feat: 하이라이트 탭 빈 상태 CTA 추가"
```

---

## Task 6: RecordsTab (스탯) 빈 상태 개선

**Files:**
- Modify: `src/components/profile/RecordsTabV5.tsx`

현재: 스탯 없을 때 빈 화면 또는 단순 "추가하기" 버튼
변경: 측정 가능한 스탯 항목을 카드 형태로 나열, 각 항목 탭하면 StatInputSheet 열림

- [ ] **Step 1: 스탯 탭 설명 텍스트 추가**

`RecordsTabV5.tsx` `return` 블록 상단(약 39행) `<div className="pt-3 flex flex-col gap-4">` 직후:

```tsx
{/* 탭 설명 (스탯 없거나 첫 방문 시) */}
{stats.length === 0 && (
  <p style={{ fontSize: 11, color: "var(--color-text-3)", fontFamily: "var(--font-body)", margin: "0 0 4px", paddingLeft: 2 }}>
    100m 달리기, 슈팅파워 등 신체능력 수치를 기록해요
  </p>
)}
```

- [ ] **Step 2: 스탯 빈 상태 카드 그리드 추가**

`RecordsTabV5.tsx`에서 `onAddStat`이 있고 `stats.length === 0`일 때 표시할 빠른 추가 카드를 구성한다.
`getStatMeta`와 `MEASUREMENTS`(또는 상수에서 스탯 타입 목록)를 활용해 주요 스탯 3~4개 카드 표시.

스탯 항목 버튼:
```tsx
{onAddStat && stats.length === 0 && (
  <div>
    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-2)", fontFamily: "var(--font-body)", marginBottom: 10 }}>
      기록해볼 항목
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {["sprint_100m", "shooting_power", "dribble_speed", "jump_height"].map((statType) => {
        const meta = getStatMeta(statType);
        if (!meta) return null;
        return (
          <button
            key={statType}
            onClick={() => onUpdateStat?.(statType)}
            style={{
              padding: "12px", borderRadius: 12, textAlign: "left", cursor: "pointer",
              background: "var(--color-card)", border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-1)", fontFamily: "var(--font-body)", marginBottom: 2 }}>
              {meta.label}
            </p>
            <p style={{ fontSize: 10, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
              {meta.unit} · 탭하여 기록
            </p>
          </button>
        );
      })}
    </div>
  </div>
)}
```

> `getStatMeta` 함수와 실제 stat 타입 키는 `src/lib/constants.ts`를 확인하여 정확한 키 사용.

- [ ] **Step 3: 브라우저 확인**

스탯이 없는 계정 → 스탯 탭 → 설명 텍스트 + 항목 카드 표시 확인
항목 카드 탭 → StatInputSheet 열리는지 확인

- [ ] **Step 4: 커밋**

```bash
git add src/components/profile/RecordsTabV5.tsx
git commit -m "feat: 스탯 탭 빈 상태 개선 — 설명 텍스트 + 항목 카드 추가"
```

---

## Task 7: CareerTab 빈 상태 개선

**Files:**
- Modify: `src/components/profile/CareerTabV5.tsx`

- [ ] **Step 1: 시즌 빈 상태 CTA 강화**

`CareerTabV5.tsx`에서 `seasons.length === 0`이고 `onAddSeason`이 있을 때:

기존 빈 상태 UI를 찾아서 (없다면 추가) 다음으로 교체:
```tsx
{seasons.length === 0 && (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 12, padding: "28px 16px", textAlign: "center",
    background: "var(--color-card)", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
  }}>
    <span style={{ fontSize: 32 }}>🏟</span>
    <div>
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-1)", marginBottom: 4, fontFamily: "var(--font-body)" }}>
        이번 시즌을 추가해보세요
      </p>
      <p style={{ fontSize: 12, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
        소속팀과 포지션을 기록하면 커리어가 쌓여요
      </p>
    </div>
    {onAddSeason && (
      <button
        onClick={onAddSeason}
        style={{
          padding: "10px 20px", borderRadius: 12,
          background: "var(--color-accent)", color: "var(--color-bg)",
          fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
          border: "none", cursor: "pointer",
        }}
      >
        + 시즌 추가
      </button>
    )}
  </div>
)}
```

- [ ] **Step 2: 브라우저 확인**

시즌 없는 계정 → 커리어 탭 → 빈 상태 CTA 표시 확인

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/CareerTabV5.tsx
git commit -m "feat: 커리어 탭 빈 상태 CTA 강화"
```

---

## Task 8: ProfileCompletionGuide 컴포넌트 생성

**Files:**
- Create: `src/components/profile/ProfileCompletionGuide.tsx`

- [ ] **Step 1: 완성도 계산 로직 작성**

```tsx
"use client";

import React, { useMemo } from "react";
import type { Profile, Stat, Season, PlayStyle } from "@/lib/types";

interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  action?: string;           // 탭 이동 or 시트 열기 식별자
}

interface ProfileCompletionGuideProps {
  profile: Profile;
  stats: Stat[];
  seasons: Season[];
  playStyle: PlayStyle | null;
  hasFeatured: boolean;
  onAction: (action: string) => void;
  userId: string;
}

function getStorageKey(userId: string, role: string) {
  return `footory_profile_complete_${userId}_${role}`;
}

export default function ProfileCompletionGuide({
  profile,
  stats,
  seasons,
  playStyle,
  hasFeatured,
  onAction,
  userId,
}: ProfileCompletionGuideProps) {
  // 100% 완성 시 영구 숨김 체크
  const storageKey = getStorageKey(userId, profile.role ?? "player");
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });

  const items: CompletionItem[] = useMemo(() => {
    if (profile.role === "scout") {
      return [
        { key: "avatar", label: "프로필 사진", done: !!profile.avatarUrl },
        { key: "bio", label: "자기소개", done: !!profile.bio, action: "edit" },
        { key: "org", label: "소속 기관", done: !!profile.teamName, action: "edit" },
        { key: "city", label: "지역", done: !!profile.city, action: "edit" },
      ];
    }
    return [
      { key: "avatar", label: "프로필 사진", done: !!profile.avatarUrl, action: "edit" },
      { key: "position", label: "포지션", done: !!profile.position, action: "edit" },
      { key: "physical", label: "신체 정보", done: !!(profile.heightCm || profile.weightKg), action: "edit" },
      { key: "featured", label: "대표 영상", done: hasFeatured, action: "highlights" },
      { key: "stat", label: "스탯 기록", done: stats.length > 0, action: "records" },
      { key: "season", label: "시즌 추가", done: seasons.length > 0, action: "career" },
      { key: "playstyle", label: "플레이스타일", done: !!playStyle, action: "playstyle" },
    ];
  }, [profile, stats, seasons, playStyle, hasFeatured]);

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);
  const nextItem = items.find((i) => !i.done);

  // 100% 완성 시 localStorage에 저장 후 숨김
  React.useEffect(() => {
    if (pct === 100 && !dismissed) {
      localStorage.setItem(storageKey, "1");
      setDismissed(true);
    }
  }, [pct, dismissed, storageKey]);

  if (dismissed || pct === 100) return null;

  return (
    <div style={{
      margin: "8px 14px 0",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
    }}>
      {/* 진행 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: 4, borderRadius: 2,
            background: "var(--color-accent)",
            width: `${pct}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{
          fontFamily: "var(--font-stat)",
          fontSize: 12, fontWeight: 700,
          color: "var(--color-accent)",
          minWidth: 34, textAlign: "right",
        }}>{pct}%</span>
      </div>
      {/* 다음 추천 액션 */}
      {nextItem && (
        <button
          onClick={() => nextItem.action && onAction(nextItem.action)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", padding: 0, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--color-text-3)", fontFamily: "var(--font-body)" }}>
            다음:
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", fontFamily: "var(--font-body)" }}>
            {nextItem.label} 추가하기 →
          </span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/ProfileCompletionGuide.tsx
git commit -m "feat: ProfileCompletionGuide 컴포넌트 생성"
```

---

## Task 9: profile/page.tsx에 ProfileCompletionGuide 통합

**Files:**
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: import 추가**

```tsx
import ProfileCompletionGuide from "@/components/profile/ProfileCompletionGuide";
```

- [ ] **Step 2: featured 상태 확인**

`useFeaturedClips` 훅이 있는지 확인. 없으면 `HighlightsTabV5` 내부에서만 관리되므로, `profile/page.tsx`에서 `tagClips` 데이터로 featured 여부를 간접 확인.

```tsx
// hasFeatured: tagClips에 클립이 있거나 untaggedClips에 클립이 있으면 true (근사값)
const hasFeatured = Object.values(tagClips).some((arr) => arr.length > 0);
```

또는 `useFeaturedClips` 훅을 직접 사용:
```tsx
import { useFeaturedClips } from "@/hooks/useClips";
const { featured } = useFeaturedClips();
const hasFeatured = featured.length > 0;
```

> `useFeaturedClips`가 이미 `HighlightsTabV5` 내부에서만 호출된다면 `tagClips`로 근사값 사용 권장.

- [ ] **Step 3: HeroSection 다음에 ProfileCompletionGuide 삽입**

선수 뷰의 HeroSection 렌더링 직후:
```tsx
<HeroSection ... />
<ProfileCompletionGuide
  profile={profile}
  stats={stats}
  seasons={seasons}
  playStyle={playStyle}
  hasFeatured={hasFeatured}
  userId={profile.id}
  onAction={(action) => {
    if (action === "edit") setEditOpen(true);
    else if (action === "highlights") setActiveTab("highlights");
    else if (action === "records") setActiveTab("records");
    else if (action === "career") setActiveTab("career");
    else if (action === "playstyle") setPlayStyleTestOpen(true);
  }}
/>
```

스카우터 뷰에도 추가 (간단한 4-항목 버전):
```tsx
<HeroSection ... />
<ProfileCompletionGuide
  profile={profile}
  stats={[]}
  seasons={[]}
  playStyle={null}
  hasFeatured={false}
  userId={profile.id}
  onAction={(action) => {
    if (action === "edit") setEditOpen(true);
  }}
/>
```

스카우터 뷰의 기존 빈 상태 카드(`bio/city/teamName` 없을 때 나오는 카드)는 `ProfileCompletionGuide`가 대체하므로 제거.

- [ ] **Step 4: 브라우저 확인**

프로필이 미완성인 계정 → `/profile` → HeroSection 하단에 완성도 바 + 다음 액션 표시 확인
100% 완성 계정 → 가이드 미표시 확인
"다음" 링크 탭 → 해당 탭 이동 또는 시트 열리는지 확인

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: 프로필 완성도 가이드(ProfileCompletionGuide) 통합"
```

---

## Task 10: 공개 프로필 isScoutViewer 조건 검토

**Files:**
- Modify: `src/app/p/[handle]/client.tsx` (필요한 경우에만)

현재: `isScoutViewer = data.viewerAccess?.role === "scout" && data.role === "player"` (540행)
→ 스카우터가 선수 프로필을 볼 때만 `ScoutSummarySection` 표시

- [ ] **Step 1: 조건 검토**

`src/app/p/[handle]/client.tsx` 340행과 542~546행 확인:
```tsx
const isScoutViewer = data.viewerAccess?.role === "scout" && data.role === "player";
...
{isScoutViewer && <ScoutSummarySection ... />}
```

- [ ] **Step 2: 조건 완화 여부 결정**

스카우터가 아닌 일반 방문자도 핵심 신체 요약을 볼 수 있도록 조건 완화:
```diff
- const isScoutViewer = data.viewerAccess?.role === "scout" && data.role === "player";
+ const isScoutViewer = data.role === "player"; // 모든 방문자에게 신체 요약 표시
```

또는 유지 (스카우터 전용 유지가 UX상 더 깔끔한 경우).

> 결정 기준: 신체 정보 공개 범위. 선수 본인이 공개 설정한 정보라면 모든 방문자에게 표시해도 OK.

- [ ] **Step 3: 커밋 (변경 있을 경우)**

```bash
git add src/app/p/[handle]/client.tsx
git commit -m "fix: 공개 프로필 ScoutSummarySection 노출 조건 완화"
```

---

## Task 11: 최종 배포

- [ ] **Step 1: 전체 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: 로컬 브라우저 전체 플로우 확인**

체크리스트:
- [ ] `/profile` 선수 계정 → HeroSection 우상단 편집/공유 아이콘
- [ ] 편집 시트 열기 → 하단에 "PDF로 내보내기" 버튼 표시
- [ ] 탭 바에 "스탯" 표시
- [ ] 스탯 탭 → VerifyBadge 없음
- [ ] 커리어 탭 → VerifyBadge 없음
- [ ] 하이라이트 탭 빈 상태 → 업로드 CTA 표시
- [ ] 스탯 탭 빈 상태 → 항목 카드 표시
- [ ] 커리어 탭 빈 상태 → 시즌 추가 CTA 표시
- [ ] HeroSection 하단에 완성도 가이드 표시 (미완성 계정)
- [ ] `/p/[handle]` 공개 프로필 접속 이상 없음

- [ ] **Step 3: Vercel 프로덕션 배포**

```bash
vercel --prod
```

