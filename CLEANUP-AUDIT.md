# FOOTORY — Cleanup Audit Report

> 생성일: 2026-03-21
> 정리 완료: 2026-03-21
> 분석 범위: src/, supabase/, docs/, package.json

---

## 1. Dead Code 리포트

### 1-1. 미사용 컴포넌트 파일

| 파일 | 경로 | 비고 |
|------|------|------|
| `ChallengeRanking.tsx` | `src/components/challenge/ChallengeRanking.tsx` | 어디서도 import되지 않음 |
| `TeamBanner.tsx` | `src/components/player/TeamBanner.tsx` | 어디서도 import되지 않음 |

> **참고**: `HighlightsTab.tsx` 등 구버전 컴포넌트는 공개 프로필(`/p/[handle]`)에서 사용 중이므로 데드 코드 아님. V5 컴포넌트는 내 프로필(`/profile`)용으로 분리됨.

### 1-2. 미사용 함수/유틸

| 파일 | 내용 | 상태 |
|------|------|------|
| `src/lib/bgm-tracks.ts` | `BgmTrack` 인터페이스, `BgmCategory` 타입, `BGM_CATEGORIES` 상수 | slowmo/bgm 파이프라인 제거 후 잔존. 테스트 파일에서만 참조. 런타임 미사용 |

### 1-3. 미사용 Supabase 테이블/RPC

| 테이블 | 마이그레이션 파일 | TS 참조 | 상태 |
|--------|-----------------|---------|------|
| `physical_tests` | `20260321010000_physical_tests.sql` | ❌ 없음 | DB만 존재, API/훅/타입 미구현 |
| `tournament_records` | `20260321020000_tournament_records_awards.sql` | ❌ 없음 | DB만 존재, API/훅/타입 미구현 |
| `awards` | `20260321020000_tournament_records_awards.sql` | ❌ 없음 | DB만 존재, API/훅/타입 미구현 |

> `CareerTabV5.tsx`에서 로컬 인터페이스(`TournamentRecord`, `AwardRecord`)를 정의하고 있으나, 실제 데이터 로딩은 미구현. `tournaments`/`awards` props는 항상 빈 배열.

### 1-4. 미사용 npm 패키지

| 패키지 | 버전 | 상태 |
|--------|------|------|
| `cmdk` | 1.1.1 | **어디서도 import되지 않음** |
| `@base-ui/react` | 1.2.0 | **어디서도 import되지 않음** |

> `html2canvas`, `jspdf`는 `src/lib/pdf-generator.ts`에서 동적 import로 사용 중 (미사용 아님).

### 1-5. 주석 처리된 코드 블록

3줄 이상의 주석 처리된 코드 블록은 발견되지 않음. 인라인 한글 주석(설명용)만 존재.

---

## 2. 라우트 맵

### 2-1. 페이지 라우트

| 라우트 | 파일 | 설명 |
|--------|------|------|
| `/` | `page.tsx` | 홈 — 역할별 뷰 (Player: 피드+MVP, Parent: 자녀 대시보드, Scout: 스카우트 홈) |
| `/login` | `login/page.tsx` | 카카오 + 이메일 로그인 |
| `/signup` | `signup/page.tsx` | 이메일 회원가입 |
| `/onboarding` | `onboarding/page.tsx` | 역할별 온보딩 (player/parent/scout) |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` | 비밀번호 찾기 |
| `/auth/reset-password` | `auth/reset-password/page.tsx` | 비밀번호 재설정 |
| `/profile` | `profile/page.tsx` | 내 프로필 — 3탭 (하이라이트/기록/커리어) |
| `/profile/settings` | `profile/settings/page.tsx` | 프로필 설정 |
| `/profile/follows` | `profile/follows/page.tsx` | 팔로잉/팔로워 목록 |
| `/profile/watchlist` | `profile/watchlist/page.tsx` | 스카우트 관심 목록 |
| `/profile/children` | `profile/children/page.tsx` | 부모: 연결된 자녀 대시보드 |
| `/discover` | `discover/page.tsx` | 탐색 — 선수/팀 랭킹 + 태그 그리드 + 검색 |
| `/mvp` | `mvp/page.tsx` | MVP 투표 + 아카이브 + 명예의 전당 |
| `/team` | `team/page.tsx` | 팀 허브 — 내 팀 목록 + 생성/가입 |
| `/team/[id]` | `team/[id]/page.tsx` | 팀 상세 — 피드 + 멤버 + 앨범 + 공지 |
| `/team/[id]/settings` | `team/[id]/settings/page.tsx` | 팀 설정 (관리자 전용) |
| `/upload` | `upload/page.tsx` | 2단계 업로드 (Step 1: 트림, Step 2: 꾸미기) |
| `/p/[handle]` | `p/[handle]/page.tsx` | 공개 프로필 (SSR, 읽기 전용) |
| `/t/[handle]` | `t/[handle]/page.tsx` | 공개 팀 프로필 (SSR) |
| `/(main)/notifications` | `(main)/notifications/page.tsx` | 알림 피드 |
| `/admin/video-lab` | `admin/video-lab/page.tsx` | 영상 가공 랩 (관리자) |
| `/dm` | `dm/page.tsx` | DM 대화 목록 |
| `/dm/[conversationId]` | `dm/[conversationId]/page.tsx` | DM 대화 스레드 |

**총 23개 페이지 라우트**

### 2-2. API 라우트

| 도메인 | 엔드포인트 |
|--------|-----------|
| **Profile** | `/api/profile` (GET/PUT), `/api/profile/me`, `/api/profile/handle-check`, `/api/profile/avatar`, `/api/profile/search`, `/api/profile/linked-parents` |
| **Clips** | `/api/clips` (GET/POST), `/api/clips/[id]` (DELETE) |
| **Highlights** | `/api/highlights` (GET/POST), `/api/featured` (GET/POST) |
| **Feed** | `/api/feed`, `/api/feed/[id]/kudos`, `/api/feed/[id]/comments` |
| **Discover** | `/api/discover`, `/api/discover/players`, `/api/discover/teams`, `/api/discover/teams/ranking`, `/api/discover/highlights`, `/api/discover/tags`, `/api/discover/search`, `/api/discover/ranking`, `/api/discover/rising` |
| **Follows** | `/api/follows` (GET/POST), `/api/follows/recommend` |
| **MVP** | `/api/mvp/candidates`, `/api/mvp/vote`, `/api/mvp/archive`, `/api/mvp/hall-of-fame`, `/api/mvp/finalize`, `/api/mvp/notify` |
| **Notifications** | `/api/notifications`, `/api/notifications/[id]/read`, `/api/notifications/read`, `/api/notifications/unread-count`, `/api/notifications/preferences` |
| **Teams** | `/api/teams` (GET/POST), `/api/teams/handle-check`, `/api/teams/[id]`, `/api/teams/[id]/members`, `/api/teams/[id]/albums`, `/api/teams/[id]/feed`, `/api/teams/[id]/records`, `/api/teams/join` |
| **Stats** | `/api/stats` (GET/POST), `/api/stats/[id]`, `/api/stats/team-rank`, `/api/stats/percentile` |
| **Play Style** | `/api/play-style` (GET/POST) |
| **Achievements** | `/api/achievements` (GET/POST), `/api/achievements/[id]` (PUT/DELETE) |
| **Seasons** | `/api/seasons` (GET/POST) |
| **Timeline** | `/api/timeline` |
| **Watchlist** | `/api/watchlist` (GET/POST), `/api/watchlist/[playerId]` (DELETE) |
| **Coach Reviews** | `/api/coach-reviews` (GET/POST), `/api/coach-reviews/[id]` (PUT/DELETE) |
| **Social** | `/api/social/mention-candidates` |
| **Parent** | `/api/parent/link`, `/api/parent/dashboard`, `/api/parent/upload`, `/api/parent/recap` |
| **Upload** | `/api/upload/presign`, `/api/upload/direct`, `/api/upload/multipart` |
| **Render** | `/api/render` (POST), `/api/render/[id]` (GET) |
| **BGM** | `/api/bgm` |
| **Push** | `/api/push/token` |
| **Reports** | `/api/reports/stat` |
| **Onboarding** | `/api/onboarding` (GET/POST) |
| **Auth** | `/api/auth/confirm`, `/api/auth/callback` |
| **Admin** | `/api/admin/video-lab/short-form`, `/api/admin/video-lab/match-highlight` |

**총 77개 API 엔드포인트**

### 2-3. 레이아웃 & 미들웨어

| 파일 | 역할 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃 — 폰트, AppShell (바텀탭 5개), Toaster |
| `src/proxy.ts` | Auth 미들웨어 — JWT 디코드 + 라우트 보호, 공개 라우트 화이트리스트 |

---

## 3. Docs 현황

### 3-1. 핵심 문서

| 파일 | 마지막 수정 | 코드 일치 |
|------|-----------|----------|
| `docs/ARCHITECTURE.md` | 2026-03-19 | ✅ 최신 |
| `docs/SPEC.md` | 2026-03-19 | ✅ 최신 |
| `docs/DESIGN-SYSTEM.md` | 2026-03-12 | ✅ 최신 |
| `docs/PROGRESS.md` | 2026-03-15 | ⚠️ 약간 뒤처짐 — render pipeline, V5 프로필 작업 미반영 |
| `docs/FOOTORY-프로필-리디자인-핸드오프.md` | 2026-03-21 | ✅ 최신 |
| `docs/GAP-ANALYSIS.md` | 2026-03-21 | ✅ 최신 |
| `docs/PROJECT-SCAN.md` | 2026-03-21 | ✅ 최신 |
| `CLAUDE.md` | - | ✅ 최신 |
| `README.md` | 2026-03-04 | ⚠️ 오래됨 — v1.0 기준 |

### 3-2. 아카이브 문서 (버전별 과거 기록)

| 파일 | 마지막 수정 | 상태 |
|------|-----------|------|
| `docs/DESIGN-SYSTEM-v1.2.md` | 2026-03-05 | 🔴 아카이브 (현행 버전으로 대체됨) |
| `docs/ARCHITECTURE-v1.2.md` | 2026-03-05 | 🔴 아카이브 |
| `docs/SPEC-v1.2.md` | 2026-03-05 | 🔴 아카이브 |
| `docs/PROGRESS-v1.2.md` | 2026-03-05 | 🔴 아카이브 |
| `docs/FOOTORY-v1.2-최종-기획안.md` | 2026-03-05 | 🔴 아카이브 |
| `docs/FOOTORY-v1.2-실행가이드.md` | 2026-03-05 | 🔴 아카이브 |

### 3-3. 기획/가이드 문서

| 파일 | 마지막 수정 | 상태 |
|------|-----------|------|
| `docs/FOOTORY-v1.3-기획안.md` | 2026-03-15 | ✅ v1.3 로드맵 |
| `docs/CLAUDE-CODE-PROMPT.md` | 2026-03-15 | ✅ 최신 |
| `docs/MODEL-AND-TOOLS-GUIDE.md` | 2026-03-03 | ⚠️ 오래됨 |
| `docs/PARALLEL-GUIDE.md` | 2026-03-03 | ⚠️ 오래됨 |
| `docs/QA-LOOP.md` | 2026-03-04 | ⚠️ 오래됨 |

### 3-4. 스프린트 문서

`docs/sprints/` 에 SPRINT-01 ~ SPRINT-26 존재. 최신: `SPRINT-26.md`.
변형 파일: `SPRINT-11b.md`, `SPRINT-11b-v2.md`, `SPRINT-11c.md`, `SPRINT-15b.md`, `SPRINT-16b.md`

---

## 요약 — 정리 추천 항목

### 즉시 삭제 가능 (확정 데드 코드)

| # | 대상 | 유형 |
|---|------|------|
| 1 | `src/components/challenge/ChallengeRanking.tsx` | 미사용 컴포넌트 |
| 2 | `src/components/player/TeamBanner.tsx` | 미사용 컴포넌트 |
| 3 | `cmdk` (package.json) | 미사용 패키지 |
| 4 | `@base-ui/react` (package.json) | 미사용 패키지 |

### 검토 후 판단

| # | 대상 | 사유 |
|---|------|------|
| 5 | `src/lib/bgm-tracks.ts` | BGM 파이프라인 제거 후 잔존, 향후 계획에 따라 삭제 여부 결정 |
| 6 | `docs/*-v1.2*` 파일 6개 | 아카이브 문서, 히스토리 보존 vs 정리 |
| 7 | 스프린트 변형 파일 (`*b`, `*b-v2`, `*c`) | 완료된 스프린트의 반복 버전 |

### 미구현 상태 (데드 코드는 아니나 미완성)

| # | 대상 | 현황 |
|---|------|------|
| 8 | `physical_tests` 테이블 | 마이그레이션만 존재, API/훅/타입 미구현 |
| 9 | `tournament_records` 테이블 | 마이그레이션만 존재, API/훅/타입 미구현 |
| 10 | `awards` 테이블 | 마이그레이션만 존재, API/훅/타입 미구현 |
