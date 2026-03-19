# 프로필 카드 게이미피케이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ProfileCard를 피파/FM 스타일의 세로 카드 레이아웃으로 전면 재작성하여, 사진+이름+레이더차트+스탯이 하나의 카드 단위로 통합된 게이미피케이션 프로필을 구현한다.

**Architecture:** 기존 ProfileCard.tsx를 전면 재작성하고, 레이더 차트(ProfileRadar)와 스탯 리스트(ProfileStatList), 소셜 카드(SocialCard)를 독립 컴포넌트로 분리한다. 기존 `radar-calc.ts`의 `calcRadarStats()` 로직과 `useStats` 훅을 그대로 활용하며, `RADAR_STATS` 상수도 변경하지 않는다.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, SVG (레이더 차트)

**Spec:** `docs/superpowers/specs/2026-03-19-profile-card-gamification-design.md`

---

## 파일 구조

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/components/player/ProfileRadar.tsx` | 프로필 전용 골드 테마 헥사곤 레이더 (130px, 글로우 도트, 애니메이션) | 신규 |
| `src/components/player/ProfileStatList.tsx` | 6행 스탯 리스트 (라벨, 수치, 단위, 변화량) | 신규 |
| `src/components/player/SocialCard.tsx` | 분리된 소셜 지표 카드 (팔로워/팔로잉/조회, 세로 구분선) | 신규 |
| `src/components/player/ProfileCard.tsx` | 전면 재작성 — 세로 카드 레이아웃으로 위 3개 컴포넌트를 조합 | 수정 |
| `src/styles/globals.css` | shimmer, radarIn, slideR 애니메이션 키프레임 추가 | 수정 |
| `src/app/profile/page.tsx` | ProfileCard에 stats/radarStats props 전달, SocialCard 배치 | 수정 |
| `src/app/p/[handle]/page.tsx` | 공개 프로필에서도 동일 카드 사용 | 수정 |

---

### Task 1: CSS 애니메이션 키프레임 추가

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: globals.css에 애니메이션 키프레임 추가**

`src/styles/globals.css`의 기존 애니메이션 섹션(fade-up 등이 있는 곳) 근처에 다음을 추가:

```css
@keyframes radar-in {
  from { opacity: 0; transform: scale(0.75) rotate(-8deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes slide-r {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -5` (또는 `npm run build`)
Expected: 빌드 성공, 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/styles/globals.css
git commit -m "style: 프로필 카드용 애니메이션 키프레임 추가 (radar-in, slide-r, shimmer)"
```

---

### Task 2: ProfileRadar 컴포넌트 생성

**Files:**
- Create: `src/components/player/ProfileRadar.tsx`
- Reference: `src/components/player/RadarChart.tsx` (hexPoint 로직 참조)
- Reference: `src/lib/constants.ts` (RADAR_STATS)

- [ ] **Step 1: ProfileRadar.tsx 생성**

기존 `RadarChart.tsx`의 `hexPoint` 함수 로직을 재사용하되, 프로필 카드 전용 골드 테마 SVG 레이더를 구현한다. 핵심 차이점:
- 크기 고정 130px (viewBox 140x140)
- 골드 색상 (#F5C542, rgba(245,197,66,...))
- 꼭짓점에 더블 링 글로우 (3px 도트 + 6px 링)
- radialGradient 채움
- `RADAR_STATS`의 `shortLabel`을 라벨로 사용
- OVR 표시 없음 (스펙에 없음)
- `role="img"` + `aria-label` 접근성

```tsx
"use client";

import React, { useMemo } from "react";
import { RADAR_STATS, type RadarStatId } from "@/lib/constants";

interface ProfileRadarProps {
  stats: Record<RadarStatId, number>; // 0~99 정규화 값
  className?: string;
}

/** 꼭짓점 좌표 계산 (위쪽 시작, 시계방향) */
function hexPoint(cx: number, cy: number, radius: number, index: number): [number, number] {
  const angle = (Math.PI / 180) * (index * 60 - 90);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function ProfileRadarInner({ stats, className }: ProfileRadarProps) {
  const size = 140;
  const cx = 70;
  const cy = 63; // 약간 위로 올려서 하단 라벨 공간 확보
  const maxRadius = 48;

  const gridLevels = [0.33, 0.66, 1.0];

  const dataPoints = useMemo(() => {
    return RADAR_STATS.map((s, i) => {
      const val = Math.max(0, Math.min(99, stats[s.id] ?? 0));
      const r = (val / 99) * maxRadius;
      return hexPoint(cx, cy, r, i);
    });
  }, [stats]);

  const dataPath = dataPoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ") + " Z";

  const hasData = RADAR_STATS.some((s) => (stats[s.id] ?? 0) > 0);

  return (
    <div className={className} style={{ width: 130, height: 130, flexShrink: 0 }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="130"
        height="130"
        role="img"
        aria-label="선수 능력치 레이더 차트"
        style={{
          filter: "drop-shadow(0 0 12px rgba(212,168,83,0.1))",
          animation: "radar-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both",
        }}
      >
        <defs>
          <radialGradient id="profileRadarFill" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(245,197,66,0.12)" />
            <stop offset="100%" stopColor="rgba(245,197,66,0.03)" />
          </radialGradient>
        </defs>

        {/* Grid hexagons */}
        {gridLevels.map((level) => {
          const path = Array.from({ length: 6 })
            .map((_, i) => {
              const [x, y] = hexPoint(cx, cy, maxRadius * level, i);
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ") + " Z";
          return (
            <path key={level} d={path} fill="none" stroke="rgba(245,197,66,0.06)" strokeWidth="0.5" />
          );
        })}

        {/* Axis lines */}
        {RADAR_STATS.map((_, i) => {
          const [x, y] = hexPoint(cx, cy, maxRadius, i);
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(245,197,66,0.025)" strokeWidth="0.5" />
          );
        })}

        {/* Data polygon */}
        {hasData && (
          <>
            <path d={dataPath} fill="url(#profileRadarFill)" stroke="none" />
            <path d={dataPath} fill="none" stroke="rgba(245,197,66,0.65)" strokeWidth="1.3" strokeLinejoin="round" />
          </>
        )}

        {/* Vertex dots with glow ring */}
        {hasData && dataPoints.map(([x, y], i) => (
          <g key={RADAR_STATS[i].id}>
            <circle cx={x} cy={y} r="6" fill="none" stroke="rgba(245,197,66,0.15)" strokeWidth="1" />
            <circle cx={x} cy={y} r="2.5" fill="#F5C542" opacity="0.9" />
          </g>
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="1.5" fill="rgba(245,197,66,0.2)" />

        {/* Labels */}
        {RADAR_STATS.map((s, i) => {
          const labelR = maxRadius + 14;
          const [lx, ly] = hexPoint(cx, cy, labelR, i);
          return (
            <text
              key={s.id}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "7px", fontWeight: 600, fill: "#71717A", fontFamily: "Rajdhani, sans-serif" }}
            >
              {s.shortLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

const ProfileRadar = React.memo(ProfileRadarInner);
export default ProfileRadar;
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/player/ProfileRadar.tsx
git commit -m "feat: ProfileRadar 컴포넌트 — 프로필 카드 전용 골드 테마 헥사곤 레이더"
```

---

### Task 3: ProfileStatList 컴포넌트 생성

**Files:**
- Create: `src/components/player/ProfileStatList.tsx`
- Reference: `src/lib/constants.ts` (RADAR_STATS, MEASUREMENTS)
- Reference: `src/lib/types.ts` (Stat)

- [ ] **Step 1: ProfileStatList.tsx 생성**

6행 스탯 리스트. 각 행에 라벨, 수치, 단위, 변화량(▲/▼) 표시. `lowerIsBetter` 방향에 따라 변화량 색상 결정.

```tsx
import React from "react";
import { RADAR_STATS, MEASUREMENTS } from "@/lib/constants";
import type { Stat } from "@/lib/types";

interface ProfileStatListProps {
  stats: Stat[];
  className?: string;
}

function ProfileStatListInner({ stats, className }: ProfileStatListProps) {
  const statMap = new Map(stats.map((s) => [s.type, s]));

  return (
    <div className={`flex flex-1 flex-col ${className ?? ""}`}>
      {RADAR_STATS.map((axis, i) => {
        const stat = statMap.get(axis.statType);
        const measurement = MEASUREMENTS.find((m) => m.id === axis.statType);
        const unit = measurement?.unit ?? "";
        const hasValue = stat != null;

        // Delta calculation
        let delta: number | null = null;
        let isImproved = false;
        if (stat?.previousValue != null) {
          delta = stat.value - stat.previousValue;
          isImproved = axis.lowerIsBetter ? delta < 0 : delta > 0;
        }

        return (
          <div
            key={axis.id}
            className="flex items-center justify-between border-b border-white/[0.02] last:border-b-0"
            style={{
              padding: "3.5px 0",
              animation: `slide-r 0.35s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.05}s both`,
            }}
          >
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: "#52525B", fontFamily: "Rajdhani, sans-serif", minWidth: 32 }}
            >
              {axis.label}
            </span>
            <div className="flex items-baseline gap-0.5">
              {hasValue ? (
                <>
                  <span className="font-stat text-[16px] font-medium leading-none text-text-1">
                    {stat.value}
                  </span>
                  <span
                    className="text-[8px] font-semibold"
                    style={{ color: "#3F3F46", fontFamily: "Rajdhani, sans-serif", marginLeft: 1 }}
                  >
                    {unit}
                  </span>
                  {delta != null && delta !== 0 && (
                    <span
                      className="font-stat text-[8px] font-medium"
                      style={{ color: isImproved ? "#4ADE80" : "#F87171", marginLeft: 3 }}
                    >
                      {isImproved ? "▲" : "▼"}
                      {Math.abs(delta)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-text-3/40">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ProfileStatList = React.memo(ProfileStatListInner);
export default ProfileStatList;
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/player/ProfileStatList.tsx
git commit -m "feat: ProfileStatList 컴포넌트 — 6행 스탯 리스트 (변화량, lowerIsBetter 처리)"
```

---

### Task 4: SocialCard 컴포넌트 생성

**Files:**
- Create: `src/components/player/SocialCard.tsx`

- [ ] **Step 1: SocialCard.tsx 생성**

ProfileCard에서 분리된 소셜 지표 카드. 세로 구분선으로 항목 구분.

```tsx
import React from "react";
import Link from "next/link";

interface SocialCardProps {
  followers: number;
  following: number;
  views: number;
  /** 팔로워/팔로잉 클릭 시 이동할 경로 (내 프로필에서만) */
  followsHref?: string;
  className?: string;
}

function SocialCardInner({ followers, following, views, followsHref, className }: SocialCardProps) {
  const Wrapper = followsHref ? Link : "div";

  return (
    <div
      className={`flex items-center rounded-xl bg-card border border-white/[0.04] ${className ?? ""}`}
      style={{ padding: "12px 0" }}
    >
      <Wrapper
        {...(followsHref ? { href: `${followsHref}?tab=followers` } : {})}
        className="flex flex-1 flex-col items-center gap-1 hover:opacity-70 transition-opacity"
      >
        <span className="font-stat text-[16px] font-medium leading-none text-text-1">{followers}</span>
        <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로워</span>
      </Wrapper>

      {/* Vertical divider */}
      <div className="h-6 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <Wrapper
        {...(followsHref ? { href: `${followsHref}?tab=following` } : {})}
        className="flex flex-1 flex-col items-center gap-1 hover:opacity-70 transition-opacity"
      >
        <span className="font-stat text-[16px] font-medium leading-none text-text-1">{following}</span>
        <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>팔로잉</span>
      </Wrapper>

      <div className="h-6 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="flex flex-1 flex-col items-center gap-1">
        <span className="font-stat text-[16px] font-medium leading-none text-text-1">{views}</span>
        <span className="text-[9px] font-medium" style={{ color: "#52525B" }}>조회</span>
      </div>
    </div>
  );
}

const SocialCard = React.memo(SocialCardInner);
export default SocialCard;
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/player/SocialCard.tsx
git commit -m "feat: SocialCard 컴포넌트 — 분리된 소셜 지표 (세로 구분선)"
```

---

### Task 5: ProfileCard 전면 재작성

**Files:**
- Modify: `src/components/player/ProfileCard.tsx`
- Reference: `docs/superpowers/specs/2026-03-19-profile-card-gamification-design.md` (스펙 전문)
- Reference: `.superpowers/brainstorm/68827-1773924399/card-final-v4.html` (목업 HTML)

이것이 핵심 태스크. 기존 수평 레이아웃을 세로 카드 레이아웃으로 전면 재작성한다.

- [ ] **Step 1: ProfileCard의 props 인터페이스 확장**

기존 `ProfileCardProps`에 스탯 관련 props 추가:

```tsx
import type { RadarStatId } from "@/lib/constants";
import type { Stat } from "@/lib/types";

interface ProfileCardProps {
  profile: Profile;
  radarStats?: Record<RadarStatId, number>; // 0~99 정규화 값
  stats?: Stat[];                            // 원본 측정 데이터 (변화량 계산용)
  onEdit?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onAddStat?: () => void;                    // 빈 상태 CTA 클릭
}
```

- [ ] **Step 2: 카드 외부 구조 재작성**

기존 `<div className="animate-fade-up relative overflow-hidden rounded-xl bg-card border ...">` 구조를 다음으로 교체:

```tsx
{/* Gold border glow (conic-gradient pseudo-element via wrapper) */}
<div className="relative" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
  {/* ::before — conic-gradient 골드 보더 */}
  <div
    className="absolute -inset-[2px] rounded-[18px]"
    style={{
      background: `conic-gradient(from 0deg, rgba(245,197,66,0.5) 0deg, rgba(212,168,83,0.08) 60deg, rgba(139,105,20,0.2) 120deg, rgba(212,168,83,0.08) 180deg, rgba(245,215,142,0.45) 240deg, rgba(212,168,83,0.1) 300deg, rgba(245,197,66,0.5) 360deg)`,
    }}
  />
  <div className="relative z-[1] overflow-hidden rounded-2xl bg-[#0A0A0C]"
    style={{ boxShadow: "0 0 50px rgba(212,168,83,0.05), inset 0 1px 0 rgba(245,215,142,0.08)" }}
  >
    {/* Film grain overlay */}
    <div className="pointer-events-none absolute inset-0 z-50 mix-blend-overlay opacity-50"
      style={{ backgroundImage: `url("data:image/svg+xml,...")` }}
    />

    {/* === PHOTO SECTION === */}
    {/* === NAME OVERLAY === */}
    {/* === GOLD DIVIDER === */}
    {/* === STATS SECTION === */}
  </div>
</div>
```

- [ ] **Step 3: 사진 영역 (230px) 구현**

```tsx
<div className="relative h-[230px] overflow-hidden">
  {/* Pitch line pattern */}
  <div className="absolute inset-0 z-[1]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(212,168,83,0.012) 10px, rgba(212,168,83,0.012) 11px)" }} />
  {/* Bottom cinematic fade */}
  <div className="absolute bottom-0 left-0 right-0 z-[2] h-[80%]" style={{ background: "linear-gradient(0deg, #0A0A0C 0%, rgba(10,10,12,0.92) 25%, rgba(10,10,12,0.5) 55%, transparent 100%)" }} />

  {/* Photo / Avatar */}
  <div className="flex h-full items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(245,197,66,0.06) 0%, transparent 50%), linear-gradient(175deg, #16161a 0%, #0c0c10 100%)" }}>
    {profile.avatarUrl ? (
      <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
    ) : (
      <span className="text-[88px] opacity-[0.04]">⚽</span>
    )}
  </div>

  {/* Position badge (top-left) */}
  {/* Level badge (top-right) */}
  {/* MVP badge (below level) */}

  {/* Name overlay (bottom) */}
  <div className="absolute bottom-0 left-0 right-0 z-[3] px-5 pb-3.5">
    <div className="text-[26px] font-black leading-none text-text-1" style={{ letterSpacing: "0.04em", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
      {profile.name}
    </div>
    {/* Meta: @handle · 팀 · 출생 */}
    {/* Physical pills: 키 / 몸무게 / 주발 */}
  </div>
</div>
```

아바타 업로드 기능은 기존 로직 유지 (사진 영역 클릭 시 파일 선택).

- [ ] **Step 4: 골드 디바이더 구현**

```tsx
<div className="relative h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.1) 8%, rgba(245,215,142,0.35) 50%, rgba(212,168,83,0.1) 92%, transparent 100%)" }}>
  {/* Shimmer */}
  <div className="absolute -inset-y-px inset-x-0 z-[1]" style={{ background: "linear-gradient(90deg, transparent 30%, rgba(245,215,142,0.15) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "shimmer 4s ease-in-out infinite" }} />
  {/* Center accent bar */}
  <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 h-1 w-12 rounded-sm" style={{ background: "linear-gradient(90deg, #8B6914, #D4A853, #F5D78E, #FFF8E1, #F5D78E, #D4A853, #8B6914)", boxShadow: "0 0 12px rgba(245,215,142,0.35)" }} />
</div>
```

- [ ] **Step 5: 스탯 섹션 통합 (레이더 + 리스트 또는 빈 상태 CTA)**

```tsx
{hasAnyStats ? (
  <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "radial-gradient(ellipse at 10% 50%, rgba(212,168,83,0.015) 0%, transparent 50%)" }}>
    <ProfileRadar stats={radarStats ?? EMPTY_RADAR_STATS} />
    <ProfileStatList stats={stats ?? []} />
  </div>
) : (
  /* 빈 상태 CTA: "첫 기록을 측정해보세요" */
  <button onClick={onAddStat} className="...accent-bg CTA styling...">
    📊 첫 기록을 측정해보세요
  </button>
)}
```

- [ ] **Step 6: 프로필 완성도 안내 유지**

기존 `missingItems` 로직 그대로 카드 하단에 유지.

- [ ] **Step 7: 빌드 확인**

Run: `npx next build 2>&1 | tail -10`
Expected: 빌드 성공

- [ ] **Step 8: 커밋**

```bash
git add src/components/player/ProfileCard.tsx
git commit -m "feat: ProfileCard 전면 재작성 — 피파/FM 스타일 세로 카드 레이아웃 (사진+이름+레이더+스탯)"
```

---

### Task 6: 프로필 페이지에서 새 카드 연결

**Files:**
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: SocialCard import 및 ProfileCard props 연결**

`profile/page.tsx`에서:
1. `SocialCard` import 추가
2. `ProfileCard`에 `radarStats`, `stats`, `onAddStat` props 전달
3. 기존 ProfileCard 아래에 `<SocialCard>` 배치

```tsx
import SocialCard from "@/components/player/SocialCard";

// ...기존 코드에서 radarStats 계산 부분은 이미 있음 (calcRadarStats)

<ProfileCard
  profile={profile}
  radarStats={radarStats}
  stats={stats}
  onEdit={() => setEditOpen(true)}
  onAvatarUpload={uploadAvatar}
  onAddStat={() => { setStatInputOpen(true); }}
/>
<SocialCard
  followers={profile.followers}
  following={profile.following}
  views={profile.views}
  followsHref="/profile/follows"
  className="mt-2.5"
/>
```

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -10`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: 프로필 페이지에 새 카드 + SocialCard 연결"
```

---

### Task 7: 공개 프로필 페이지 적용

**Files:**
- Modify: `src/app/p/[handle]/page.tsx`

- [ ] **Step 1: 공개 프로필에서도 동일 카드 사용**

공개 프로필 페이지를 읽고, ProfileCard에 `radarStats`와 `stats` props를 전달한다. 공개 프로필은 `onEdit`, `onAvatarUpload`, `onAddStat`이 없으므로 읽기 전용. SocialCard도 동일하게 배치하되 `followsHref`는 전달하지 않음 (공개 프로필에서는 팔로우 리스트 접근 불가).

먼저 `src/app/p/[handle]/page.tsx`를 읽고 현재 구조를 파악한 후, ProfileCard/SocialCard를 적용한다.

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -10`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/app/p/[handle]/page.tsx
git commit -m "feat: 공개 프로필에 게이미피케이션 카드 적용"
```

---

### Task 8: 브라우저 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 시작**

Run: `npm run dev`

- [ ] **Step 2: 프로필 페이지 확인**

브라우저에서 `/profile` 접속. 확인 사항:
- 세로 카드 레이아웃이 정상 렌더링되는지
- 골드 보더 글로우가 보이는지
- 레이더 차트 애니메이션 (scale + rotate)
- 스탯 리스트 순차 진입 애니메이션 (slide-r)
- 디바이더 shimmer 효과
- 키/몸무게/주발 pill이 이름 아래에 있는지
- 소셜 카드가 분리되어 있고 세로 구분선이 보이는지
- 스탯 데이터가 없을 때 빈 상태 CTA가 보이는지

- [ ] **Step 3: 공개 프로필 확인**

`/p/[handle]` 접속. 읽기 전용으로 동일 카드가 표시되는지 확인.

- [ ] **Step 4: 최종 커밋 (필요시)**

검증 중 발견된 UI 버그 수정 후 커밋.
