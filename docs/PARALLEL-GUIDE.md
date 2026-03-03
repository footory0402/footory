# FOOTORY 병렬 개발 가이드

## 1. 병렬 실행이란?

Claude Code에서 **터미널 탭을 2개** 열어서 독립적인 작업을 동시에 진행하는 것.
단, **같은 파일을 건드리는 작업은 충돌**하므로 의존성 없는 것끼리만 가능.

## 2. 스프린트 의존성 맵

```
Sprint 01 (프로젝트 셋업)
    │
    ├──▶ Sprint 02 (기본 컴포넌트)
    │        │
    │        ├──▶ Sprint 04 (프로필 UI) ──────────┐
    │        │                                     │
    │        └──▶ Sprint 09 (피드 UI, 목데이터)    │
    │                                              │
    └──▶ Sprint 03 (Supabase 셋업)                │
             │                                     │
             └──▶ Sprint 05 (프로필 편집, DB연동) ◀┘
                      │
          ┌───────────┼──────────────┐
          ▼           ▼              ▼
    Sprint 06     Sprint 08      Sprint 09
    (영상업로드)   (측정/메달)    (피드 DB연동)
          │           │              │
          ▼           │              ▼
    Sprint 07         │         Sprint 10 (소셜)
    (하이라이트)      │              │
          │           │              ▼
          └─────┬─────┘         Sprint 11 (탐색)
                │                    │
                ▼                    │
          Sprint 12 (팀) ◀──────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
Sprint 13   Sprint 14   Sprint 15
(부모계정)  (공개프로필) (온보딩)
    │           │           │
    └─────┬─────┘───────────┘
          ▼
    Sprint 16 (알림)
    Sprint 17 (설정)  ← 이 둘은 병렬 가능
          │
          ▼
    Sprint 18 (통합QA)
```

## 3. 병렬 실행 가능한 조합

### Phase A: 기반 (1~2일)
```
터미널 1: Sprint 01 → Sprint 02
```
(여기는 순차만 가능)

### Phase B: UI + DB 병렬 (2~3일)
```
터미널 1: Sprint 03 (Supabase 셋업)
터미널 2: Sprint 04 (프로필 UI, 목데이터)  ← 동시 진행 가능!
```
**이유**: Sprint 04는 목 데이터로 UI만 만들므로 Supabase가 없어도 됨.
Sprint 03이 끝나면 Sprint 05에서 합치면 됨.

### Phase C: 기능 병렬 (3~4일)
Sprint 05 완료 후:
```
터미널 1: Sprint 06 (영상업로드) → Sprint 07 (하이라이트)
터미널 2: Sprint 08 (측정/메달)  ← 동시 진행 가능!
```
**이유**: 영상과 측정/메달은 서로 다른 테이블, 다른 컴포넌트를 건드림.

### Phase D: 소셜 + 팀 병렬 (2~3일)
```
터미널 1: Sprint 09 (피드) → Sprint 10 (소셜)
터미널 2: Sprint 12 (팀)  ← 동시 진행 가능!
터미널 1: Sprint 11 (탐색)  ← Sprint 10 끝나면
```

### Phase E: 마무리 병렬 (2~3일)
```
터미널 1: Sprint 13 (부모계정) → Sprint 15 (온보딩)
터미널 2: Sprint 14 (공개프로필) ← 동시 진행 가능!
이후:
터미널 1: Sprint 16 (알림)
터미널 2: Sprint 17 (설정)  ← 동시 진행 가능!
```

### Phase F: 통합 (2일)
```
Sprint 18 (QA) — 순차만
```

## 4. 병렬 시 Claude Code 프롬프트

### 터미널 1에서:
```
Sprint 06 (영상 업로드)을 진행해줘.
docs/sprints/SPRINT-06.md 읽고 작업해.
⚠️ 현재 터미널 2에서 Sprint 08 (측정/메달)이 병렬 진행 중이야.
src/components/player/StatRow.tsx, MedalBadge.tsx는 건드리지 마.
```

### 터미널 2에서:
```
Sprint 08 (측정/메달)을 진행해줘.
docs/sprints/SPRINT-08.md 읽고 작업해.
⚠️ 현재 터미널 1에서 Sprint 06 (영상 업로드)이 병렬 진행 중이야.
src/lib/r2.ts, src/components/player/VideoThumb.tsx는 건드리지 마.
```

## 5. 병렬 시 주의사항

1. **공유 파일 절대 동시 수정 금지**
   - `globals.css`, `layout.tsx`, `constants.ts`, `types.ts`는 한쪽만
   - 이런 파일 수정이 필요하면 한쪽에서 먼저 하고, 다른 쪽에서 이어서

2. **PROGRESS.md는 각 스프린트 끝날 때만 업데이트**
   - 두 터미널에서 동시에 수정하면 충돌

3. **git은 각 스프린트 끝날 때 커밋**
   - 커밋 순서: 먼저 끝난 쪽 → 나중 쪽
   - 충돌 시 수동 머지

## 6. 예상 일정 (병렬 적용 시)

| 일차 | 터미널 1 | 터미널 2 | 비고 |
|------|----------|----------|------|
| Day 1 | Sprint 01 + 02 | - | 순차 |
| Day 2 | Sprint 03 | Sprint 04 | **병렬** |
| Day 3 | Sprint 05 | - | DB 연동 |
| Day 4 | Sprint 06 | Sprint 08 | **병렬** |
| Day 5 | Sprint 07 | Sprint 09 (UI) | **병렬** |
| Day 6 | Sprint 09 (DB) | Sprint 12 (Day1) | **병렬** |
| Day 7 | Sprint 10 | Sprint 12 (Day2) | **병렬** |
| Day 8 | Sprint 11 | Sprint 13 | **병렬** |
| Day 9 | Sprint 14 | Sprint 15 | **병렬** |
| Day 10 | Sprint 16 | Sprint 17 | **병렬** |
| Day 11~12 | Sprint 18 | - | 통합QA |

**순차: ~25일 → 병렬: ~12일** (약 2배 빠름)
