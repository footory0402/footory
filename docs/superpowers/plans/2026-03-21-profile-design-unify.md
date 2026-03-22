# 프로필 디자인 통일 — V5 토큰 → 표준 토큰 마이그레이션

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로필 화면이 다른 화면(홈/탐색/팀)과 시각적으로 동떨어진 "각진" 느낌을 해소하여 앱 전체의 디자인 일관성을 확보한다.

**Architecture:** V5 리디자인에서 도입된 독립 토큰 시스템(`--v5-*`)과 인라인 스타일을 표준 디자인 토큰(`--color-*`) + Tailwind className 기반으로 전환한다. 8개 파일에서 총 149회 사용되는 V5 토큰을 표준 토큰으로 매핑하고, 인라인 스타일을 className으로 변환한다.

**Tech Stack:** Tailwind CSS v4, CSS Variables (`globals.css` @theme inline), Next.js 16 App Router

---

## 핵심 문제 분석

| 항목 | 프로필 (V5) | 다른 화면 (표준) | 해결 |
|------|-------------|-----------------|------|
| **Border Radius** | 14~16px | 12px (`rounded-xl`) | 12px로 통일 |
| **배경색** | `--v5-card: #111111` | `--color-card: #1C1C22` | 표준 토큰 사용 |
| **보더** | 골드 보더 강함 | `border-white/[0.06]` 약함 | 표준 보더 패턴으로 |
| **스타일 방식** | 인라인 `style={{}}` | `className` 기반 | className 전환 |
| **패딩** | 비표준 (5,9,14px) | 8진 스케일 (4,8,12,16px) | 표준 스케일로 |
| **텍스트 색상** | `--v5-text-dim: 0.22` | `text-text-3: #9E9EA8` | 표준 텍스트 토큰 |

## V5 → 표준 토큰 매핑

```
--v5-dark (#080808)        → bg-bg (#070709) 또는 bg-card (#1C1C22)
--v5-card (#111111)        → bg-card (#1C1C22)
--v5-card-border (0.06)    → border-white/[0.06] 또는 border-border
--v5-gold (#c9a84c)        → accent (#D4A853)
--v5-gold-light (#e8d48b)  → accent (#D4A853) 또는 text-accent
--v5-gold-dim (0.5)        → accent-dim (#8B6914)
--v5-gold-bg (0.08)        → accent-bg (rgba(212,168,83,0.08))
--v5-gold-border (0.15)    → border-accent (rgba(212,168,83,0.2))
--v5-gold-glow (0.12)      → accent-bg-12 (rgba(212,168,83,0.12))
--v5-text (#f0f0f0)        → text-text-1 (#FAFAFA)
--v5-text-sub (0.50)       → text-text-2 (#A1A1AA)
--v5-text-dim (0.22)       → text-text-3 (#9E9EA8)
--v5-green*                → green (#4ADE80) — 이미 동일
--v5-blue*                 → blue (#60A5FA) — 이미 동일
```

## 대상 파일 (8개)

1. `src/components/profile/HeroSection.tsx` — V5 토큰 29회
2. `src/components/profile/HighlightsTabV5.tsx` — V5 토큰 30회
3. `src/components/profile/CareerTabV5.tsx` — V5 토큰 43회
4. `src/components/profile/RecordsTabV5.tsx` — V5 토큰 31회
5. `src/components/profile/ProfileTabBar.tsx` — V5 토큰 4회
6. `src/components/profile/TournamentTypeBadge.tsx` — V5 토큰 8회
7. `src/components/profile/VerifyBadge.tsx` — V5 토큰 3회
8. `src/app/profile/page.tsx` — V5 토큰 1회 (`--v5-dark`)

추가: `src/app/globals.css` — V5 토큰 블록 정리

---

### Task 1: globals.css — 토큰 브릿지 추가 + V5 블록 보존

**Files:**
- Modify: `src/app/globals.css:94-123`

이 단계에서는 V5 토큰을 표준 토큰으로 리다이렉트하여, 컴포넌트 전환 중에도 깨지지 않게 한다.

- [ ] **Step 1: V5 토큰을 표준 토큰으로 리다이렉트**

V5 블록의 값을 표준 토큰으로 교체 (점진적 마이그레이션 안전장치):

```css
/* ── v5 Profile tokens → bridged to standard tokens ── */
:root {
  --v5-dark: var(--color-bg);
  --v5-card: var(--color-card);
  --v5-card-border: rgba(255, 255, 255, 0.06);

  --v5-gold: var(--color-accent);
  --v5-gold-light: var(--color-accent);
  --v5-gold-dim: var(--color-accent-dim);
  --v5-gold-bg: var(--accent-bg);
  --v5-gold-border: rgba(212, 168, 83, 0.2);
  --v5-gold-glow: var(--accent-bg-12);

  --v5-text: var(--color-text-1);
  --v5-text-sub: var(--color-text-2);
  --v5-text-dim: var(--color-text-3);

  --v5-green: var(--color-green);
  --v5-green-bg: rgba(74, 222, 128, 0.08);
  --v5-green-border: rgba(74, 222, 128, 0.18);

  --v5-blue: var(--color-blue);
  --v5-blue-bg: rgba(96, 165, 250, 0.08);
  --v5-blue-border: rgba(96, 165, 250, 0.18);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -5`
Expected: 빌드 성공 (CSS 토큰 변경은 런타임 호환)

- [ ] **Step 3: 커밋**

```bash
git add src/app/globals.css
git commit -m "[design-unify] step 1: bridge v5 tokens to standard design tokens"
```

---

### Task 2: ProfileTabBar — className 전환 + 표준 토큰

**Files:**
- Modify: `src/components/profile/ProfileTabBar.tsx`

가장 작은 파일(65줄, V5 4회)부터 시작.

- [ ] **Step 1: 인라인 스타일 → className 변환**

변환 규칙:
- `background: "rgba(8,8,8,0.96)"` → `bg-bg/95`
- `backdropFilter: "blur(14px)"` → `backdrop-blur-sm`
- `borderBottom: "1px solid var(--v5-card-border)"` → `border-b border-white/[0.06]`
- `padding: "11px 0 9px"` → `py-[10px]` (8진 스케일 근사)
- `border: "none"` → 제거 (button 기본 리셋은 Tailwind에서 처리)
- `borderBottom: active ? "2px solid var(--v5-gold)" : "2px solid transparent"` → `border-b-2 ${active ? "border-accent" : "border-transparent"}`
- `color: active ? "var(--v5-gold-light)" : "var(--v5-text-dim)"` → `${active ? "text-accent" : "text-text-3"}`
- `fontSize: 12` → `text-xs`

```tsx
function ProfileTabBarInner({ activeTab, onTabChange }: ProfileTabBarProps) {
  return (
    <div className="sticky z-40 flex border-b border-white/[0.06] bg-bg/95 backdrop-blur-sm" style={{ top: 49 }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1 border-b-2 py-[10px] text-xs font-body transition-colors ${
              active
                ? "border-accent text-accent font-bold"
                : "border-transparent text-text-3"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: dev 서버에서 시각 확인**

Run: 브라우저에서 프로필 탭바 확인 — 활성/비활성 상태, sticky 동작

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/ProfileTabBar.tsx
git commit -m "[design-unify] step 2: ProfileTabBar — className + standard tokens"
```

---

### Task 3: VerifyBadge + TournamentTypeBadge — 소형 컴포넌트 전환

**Files:**
- Modify: `src/components/profile/VerifyBadge.tsx`
- Modify: `src/components/profile/TournamentTypeBadge.tsx`

- [ ] **Step 1: VerifyBadge 전환**

`--v5-green*`, `--v5-text-dim` → 표준 토큰. 인라인 → className.
- `--v5-green` → `text-green`
- `--v5-text-dim` → `text-text-3`
- `borderRadius: *` → `rounded-md` (8px) 또는 `rounded-sm` (4px)

- [ ] **Step 2: TournamentTypeBadge 전환**

`--v5-gold*`, `--v5-text-dim` → 표준 토큰. borderRadius 통일.
- 뱃지 borderRadius: 4~5px → `rounded-sm` (4px, 디자인 시스템 `radius-sm`)
- `--v5-gold-bg` → `bg-accent/[0.08]`
- `--v5-gold-border` → `border-accent/20`

> **주의: `rounded-sm`은 현재 CSS에서 6px** (`--radius-sm: 6px`). 디자인 시스템 문서는 4px라고 기술하지만 실제 CSS 값이 6px이므로, 이 계획에서 `rounded-sm`은 6px로 렌더링된다. 4px가 의도라면 인라인 `rounded-[4px]` 사용. Task 9에서 문서와 CSS를 일치시킴.

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/VerifyBadge.tsx src/components/profile/TournamentTypeBadge.tsx
git commit -m "[design-unify] step 3: VerifyBadge + TournamentTypeBadge — standard tokens"
```

---

### Task 4: HeroSection + profile/page.tsx — 핵심 카드 전환

**Files:**
- Modify: `src/components/profile/HeroSection.tsx`
- Modify: `src/app/profile/page.tsx:222` — `background: "var(--v5-dark)"` → `className="bg-bg"`

프로필의 "얼굴"인 히어로 섹션 + 페이지 래퍼.

- [ ] **Step 1: 배경색 + 카드 배경 전환**

```
// Before
style={{ background: "var(--v5-card)" }}
// After
className="bg-card"

// Before (photo area)
background: "linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)"
// After — 표준 bg 톤에 맞춰 조정
background: "linear-gradient(165deg, var(--color-card) 0%, var(--color-bg) 100%)"
```

- [ ] **Step 2: 포지션 뱃지 — borderRadius 6→4px + 표준 보더**

```
// Before
borderRadius: 6, border: "1px solid rgba(201,168,76,0.25)"
// After
className="rounded-sm" + border: "1px solid rgba(212,168,83,0.2)"
```

- [ ] **Step 3: 우측 정보 패딩 — 비표준→표준**

```
// Before
style={{ padding: "14px 14px 10px" }}
// After
className="p-4 pb-3"   // 16px padding, 12px bottom
```

- [ ] **Step 4: 이름/핸들 텍스트 — 인라인→className**

```
// Before
style={{ fontFamily: "var(--font-body)", fontSize: 21, fontWeight: 800, color: "var(--v5-text)" }}
// After
className="font-body text-[20px] font-extrabold text-text-1"  // 21→20 (디자인시스템 H1)
```

- [ ] **Step 5: 구분선/디바이더 — 두드러짐→부드럽게**

```
// Before
style={{ height: 1, background: "var(--v5-card-border)" }}
// After
className="h-px bg-white/[0.05]"  // divider 토큰과 동일
```

- [ ] **Step 6: 피지컬 태그 — borderRadius 4→sm, 보더 약하게**

```
// Before
borderRadius: 4, border: "1px solid var(--v5-card-border)"
// After
className="rounded-sm border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-text-2 font-body"
```

- [ ] **Step 7: Play Style 뱃지 — borderRadius 7→8px (radius-md)**

- [ ] **Step 8: 팀 정보 + 팔로워 행 — 인라인→className**

모든 `fontFamily: "var(--font-body)"` → `font-body` 클래스
모든 `color: "var(--v5-text-*)"` → `text-text-*` 클래스

- [ ] **Step 9: 액션바 — 보더 약하게**

```
// Before
borderTop: "1px solid var(--v5-card-border)"
// After
className="border-t border-white/[0.05]"
```

- [ ] **Step 10: profile/page.tsx 래퍼 배경 전환**

```tsx
// Before (src/app/profile/page.tsx:222)
<div style={{ background: "var(--v5-dark)" }}>
// After
<div className="bg-bg">
```

- [ ] **Step 11: dev 확인 + 커밋**

```bash
git add src/components/profile/HeroSection.tsx src/app/profile/page.tsx
git commit -m "[design-unify] step 4: HeroSection + page wrapper — standard tokens + className"
```

---

### Task 5: HighlightsTabV5 — 클립 그리드 + Featured 카드

**Files:**
- Modify: `src/components/profile/HighlightsTabV5.tsx`

- [ ] **Step 1: FeaturedCard — borderRadius 16→12, 보더 부드럽게**

```
// Before
borderRadius: 16, border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 4px 24px rgba(201,168,76,0.1)"
// After
className="rounded-xl overflow-hidden border border-accent/20 shadow-[0_4px_20px_rgba(212,168,83,0.06)]"
```

- [ ] **Step 2: FeaturedCard 내부 뱃지들 — borderRadius 통일**

FEATURED 뱃지: `borderRadius: 4` → `rounded-sm`
Duration 뱃지: `borderRadius: 4` → `rounded-sm`

- [ ] **Step 3: TagPill — borderRadius 16→full (pill 형태 유지, 표준화)**

```
// Before
borderRadius: 16
// After
className="rounded-full"  // 999px — 디자인 시스템 radius-full
```

보더: `--v5-card-border` → `border-white/[0.06]`

- [ ] **Step 4: ClipCard — borderRadius 14→12**

```
// Before
borderRadius: 14, border: "1px solid var(--v5-card-border)"
// After
className="rounded-xl border border-white/[0.06]"
```

- [ ] **Step 5: 업로드 카드 — borderRadius 14→12**

- [ ] **Step 6: SectionHeader 골드 바/카운트 — 표준 토큰**

```
// Before
background: "var(--v5-gold)"
// After
className="bg-accent"
```

- [ ] **Step 7: FeaturedEmptyCTA — borderRadius 14→12, 표준 토큰**

- [ ] **Step 8: 스켈레톤 — rounded-[14px]→rounded-xl**

- [ ] **Step 9: 모든 인라인 color/font/fontSize → className 전환**

- [ ] **Step 10: 커밋**

```bash
git add src/components/profile/HighlightsTabV5.tsx
git commit -m "[design-unify] step 5: HighlightsTabV5 — radius 12px + standard tokens"
```

---

### Task 6: RecordsTabV5 — 기록 탭 전환

**Files:**
- Modify: `src/components/profile/RecordsTabV5.tsx`

- [ ] **Step 1: Play style compact card — borderRadius 14→12**

```
borderRadius: 14 → className="rounded-xl"
```

- [ ] **Step 2: stat 카드들 — 인라인→className, 표준 토큰**

모든 `--v5-*` 참조를 표준 토큰으로 교체:
- `--v5-text` → `text-text-1`
- `--v5-text-sub` → `text-text-2`
- `--v5-text-dim` → `text-text-3`
- `--v5-gold-*` → `accent` 계열
- `--v5-card-border` → `border-white/[0.06]`

- [ ] **Step 3: 커밋**

```bash
git add src/components/profile/RecordsTabV5.tsx
git commit -m "[design-unify] step 6: RecordsTabV5 — standard tokens + radius"
```

---

### Task 7: CareerTabV5 — 커리어 탭 전환 (가장 큰 파일)

**Files:**
- Modify: `src/components/profile/CareerTabV5.tsx`

V5 토큰 43회로 가장 많음. 내부 서브 컴포넌트 6개 포함.

- [ ] **Step 1: CurrentTeamCard — borderRadius 14→12, 표준 토큰**

- [ ] **Step 2: TournamentCard — borderRadius 14→12**

team source 보더: `--v5-green-border` → 표준 green/18 유지 (시맨틱)
self source 보더: `--v5-card-border` → `border-white/[0.06]`

- [ ] **Step 3: AwardCard — borderRadius 12 유지, 토큰만 교체**

- [ ] **Step 4: HistoryRow — 표준 토큰**

- [ ] **Step 5: SectionHeader — 골드 바 accent**

(HighlightsTabV5의 SectionHeader와 동일 패턴 — 추후 공통 컴포넌트 추출 가능)

- [ ] **Step 6: AddButton — borderRadius 6→sm, 표준 토큰**

- [ ] **Step 7: EmptyState — borderRadius 12 유지, 보더/텍스트 표준화**

CTA 버튼: `--v5-gold` → `bg-accent`

- [ ] **Step 8: 커밋**

```bash
git add src/components/profile/CareerTabV5.tsx
git commit -m "[design-unify] step 7: CareerTabV5 — standard tokens + radius"
```

---

### Task 8: globals.css — V5 토큰 블록 제거 + 정리

**Files:**
- Modify: `src/app/globals.css:94-123`

- [ ] **Step 1: V5 토큰 사용 여부 최종 확인**

Run: `grep -r "v5-" src/components/profile/ --include="*.tsx" | wc -l`
Expected: `0`

- [ ] **Step 2: V5 토큰 블록 삭제**

`globals.css`에서 V5 브릿지 블록 전체 삭제:
```css
/* ── v5 Profile tokens → bridged to standard tokens ── */
:root { ... }
```

- [ ] **Step 3: 빌드 확인**

Run: `npx next build 2>&1 | tail -5`
Expected: 빌드 성공, V5 토큰 참조 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/globals.css
git commit -m "[design-unify] step 8: remove v5 token block — migration complete"
```

---

### Task 9: DESIGN-SYSTEM.md 업데이트

**Files:**
- Modify: `docs/DESIGN-SYSTEM.md`

- [ ] **Step 1: V5 리디자인 참조 노트 제거**

9행의 `⚠️ 프로필 V5 리디자인 반영` 노트를 제거하고, 프로필이 표준 토큰을 사용하는 것으로 업데이트.

- [ ] **Step 2: Border Radius 테이블 업데이트**

디자인 시스템의 radius 테이블(125-131행)을 **실제 CSS 값**과 일치시킴:
```
radius-sm: 6px → 뱃지, 작은 태그, 포지션 뱃지
radius-md: 6px → 태그, 작은 버튼 (sm과 동일 — 향후 구분 필요 시 8px로 변경)
radius-lg: 12px → 카드, 입력필드 (모든 화면 통일)
radius-xl: 12px → lg와 동일 (실질적으로 3단계: 6/12/full)
radius-full: 999px → 아바타, 필 뱃지, 검색바
```
(기존 문서의 14px `radius-xl` 삭제 — 12px와 통합됨)

- [ ] **Step 3: 커밋**

```bash
git add docs/DESIGN-SYSTEM.md
git commit -m "[design-unify] step 9: update design system doc — unified radius"
```

---

## 작업 요약

| Task | 파일 | V5 토큰 수 | 난이도 |
|------|------|-----------|--------|
| 1 | globals.css (브릿지) | - | 쉬움 |
| 2 | ProfileTabBar | 4 | 쉬움 |
| 3 | VerifyBadge + TournamentTypeBadge | 11 | 쉬움 |
| 4 | HeroSection + profile/page.tsx | 30 | 중간 |
| 5 | HighlightsTabV5 | 30 | 중간 |
| 6 | RecordsTabV5 | 31 | 중간 |
| 7 | CareerTabV5 | 43 | 중간 |
| 8 | globals.css (정리) | - | 쉬움 |
| 9 | DESIGN-SYSTEM.md | - | 쉬움 |

**총 예상**: V5 토큰 149회 교체 (8개 파일), 인라인 스타일 대부분 className 전환
