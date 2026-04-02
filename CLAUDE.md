# FOOTORY — 유스 축구 선수 프로필 플랫폼

## 응답 언어
**항상 한글로 응답할 것.** 코드 주석/변수명은 영어, 대화와 설명은 한글.

## 프로젝트 개요
유소년 축구 선수 영상 하이라이트·스킬 포트폴리오 모바일 웹앱.
사용자: player · parent · scout. 다크 테마 전용 (피치 블랙 + 골드).

## 기술 스택
- **프레임워크**: Next.js 16.1.6 (App Router, TypeScript 5, React 19)
- **스타일**: Tailwind CSS v4 — `globals.css`의 `@theme inline` 블록 (tailwind.config.ts 없음)
- **컴포넌트**: shadcn/ui (base-nova, CSS variables)
- **DB/Auth**: Supabase (PostgreSQL, Auth, Realtime)
- **미디어**: Cloudflare R2 + CDN (`@aws-sdk/client-s3`)
- **배포**: Vercel (`vercel.json`, region: icn1)
- **상태**: Zustand 5 (업로드), React hooks (나머지)
- **영상처리**: FFmpeg WASM (클라이언트사이드 압축)

## 테스트 필수 규칙
**기능 수정/추가 후 반드시 브라우저에서 실제 테스트할 것.**
- Playwright 또는 agent-browser로 해당 기능의 전체 플로우 확인
- 스크린샷 캡처하여 UI 정상 렌더링 확인
- API 응답 확인 (evaluate로 fetch 테스트)
- 테스트 미완료 시 배포 금지

## 코딩 규칙
1. 모든 컴포넌트 `.tsx` — TypeScript 필수
2. 스타일은 Tailwind + CSS 변수 (`globals.css`) — 인라인 style 금지
3. 라우트 보호: `src/proxy.ts` (middleware.ts 아님 — Next.js 16 명칭 변경)
4. 다크 모드만. 배경색은 `globals.css` CSS 변수 참조 (`--color-bg`, `--color-card` 등)
5. 모바일 퍼스트 (max-width 430px)
6. Supabase: 브라우저 → `src/lib/supabase/client.ts`, 서버 → `src/lib/supabase/server.ts`
7. `database.ts` 각 테이블에 `Relationships: []` 필수 (없으면 Insert 타입 `never`)
8. 업로드 작업 전 `src/lib/upload-service.ts` 최상단 주석 읽을 것 (핵심 상수 변경 금지)
9. **영상 꾸미기(freeze frame, spotlight, 이펙트)는 런타임 방식** — FFmpeg로 영상 파일에 굽지 않음. 클립 DB에 메타데이터만 저장, `ClipPlayerSheet`에서 React 오버레이로 렌더링
10. 컴포넌트가 크거나 조건부 로딩이 필요한 경우 `next/dynamic`으로 lazy load — 프로젝트 전반에 걸쳐 사용 중 (static import 대신 dynamic import가 기본 패턴)

## 디자인 핵심
색상 source of truth는 `src/app/globals.css`의 CSS 변수:
- `--color-bg`: 최하단 배경 (#070709)
- `--color-card`: 카드 배경 (#1C1C22)
- `--color-card-alt`: 카드 대비 (#24242A)
- `--color-accent`: 골드 (#D4A853)
- `--color-text-1/2/3`: 텍스트 계층

컴포넌트 패턴:
- `card-elevated` = bg-card + var(--card-shadow) + rounded-12
- `glass-nav` = backdrop-blur + 반투명 (헤더/바텀탭)
- Border: `rgba(255,255,255,0.08)`
- 폰트: 스탯 → Oswald, 브랜드 → Rajdhani, 본문 → Noto Sans KR

## 네비게이션 구조 (역할별)

`src/components/layout/BottomTab.tsx` 참조.

| 역할 | 탭 1 | 탭 2 | 탭 3 (가운데 액션) | 탭 4 | 탭 5 |
|------|------|------|-----------------|------|------|
| player | 🏠 홈 `/` | 🏆 MVP `/mvp` | ➕ 업로드 `/upload` | 🔍 탐색 `/discover` | 👤 프로필 `/profile` |
| parent | 🏠 홈 `/` | 🏆 MVP `/mvp` | ➕ 업로드 `/upload` | 🔍 탐색 `/discover` | ⚙️ 설정 `/profile/settings` |
| scout  | 🏠 홈 `/` | 🏆 MVP `/mvp` | 📋 관심목록 `/profile/watchlist` | 🔍 탐색 `/discover` | 👤 프로필 `/profile` |

## 전체 라우트 맵

```
/                    홈 (역할별 피드)
/login               로그인 (카카오 + 이메일)
/signup              이메일 회원가입
/onboarding          역할별 온보딩
/auth/forgot-password
/auth/reset-password
/profile             내 프로필 → /p/[handle]로 redirect
/profile/settings    계정 설정
/profile/follows     팔로잉/팔로워
/profile/watchlist   스카우트 관심목록
/profile/children    부모: 자녀 관리
/discover            탐색 (랭킹 + 태그 + 검색)
/mvp                 MVP 투표 + 아카이브 + 명예의 전당
/upload              영상 업로드
/upload/child/[id]   부모: 자녀용 업로드
/editor              프로필 카드 에디터 (public 경로)
/editor/video        경기 영상 하이라이트 에디터
/edit/[clipId]       클립 편집
/p/[handle]          공개 프로필 (SSR)
/p/[handle]/h/[id]   하이라이트 공유 페이지
/t/[handle]          공개 팀 프로필 (SSR)
/team                팀 허브 (내 팀 목록)
/team/[id]           팀 상세
/team/[id]/settings  팀 설정
/dm                  DM 목록
/dm/[conversationId] DM 대화
/(main)/notifications 알림
/admin/video-lab     영상 가공 랩 (관리자)
```

## 환경 변수 (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=footory-videos
R2_PUBLIC_URL=
```

---

## 핵심 기능 1: 인증 & 온보딩

- 카카오 SSO + 이메일/비밀번호
- 역할 3종: `player | parent | scout`
- 진입점: `src/app/login/page.tsx`, `src/app/onboarding/page.tsx`
- 인증 로직: `src/lib/auth.ts`
- 콜백: `src/app/auth/confirm/route.ts`, `src/app/auth/callback/route.ts`

---

## 핵심 기능 2: 프로필 (V5)

3탭 구조: **하이라이트 / 기록(스탯) / 커리어**

- 공개 프로필 SSR: `src/app/p/[handle]/page.tsx` (server) + `client.tsx` (client interactions)
- 내 프로필: `/profile` → `/p/[handle]`로 redirect
- V5 컴포넌트: `src/components/profile/` (HeroSection, HighlightsTabV5, RecordsTabV5, CareerTabV5)
- 인라인 편집: ProfileEditSheet, SeasonAddSheet, StatInputSheet (모두 dynamic import)
- 공개 프로필에서 사용하는 시트류는 **모두 dynamic import** (`p/[handle]/client.tsx` 참조)
- 프로필 API: `src/app/api/profile/`

---

## 핵심 기능 3: 영상 업로드

### 플로우 (2단계 위저드)
1. **Select**: 파일 선택 → 트림 → 유효성 검사 (200MB / 5분)
2. **Decorate**: 이펙트(slo-mo/freeze/captions) + 스포트라이트 좌표 + 스킬 태그
3. R2 presigned URL로 직접 업로드 (FFmpeg WASM 압축 5MB 이상 시)
4. 클립 메타데이터 DB 저장 → 업로드 완료

### 핵심 파일
- `src/app/upload/page.tsx` — 업로드 페이지
- `src/lib/upload-service.ts` — **최상단 주석 반드시 읽을 것** (Vercel 10초 하드캡, 상수 변경 금지)
- `src/stores/upload-store.ts` — Zustand 업로드 상태
- `src/app/api/upload/presign/route.ts` — R2 presigned URL

### ffmpeg.wasm 주의사항
- SharedArrayBuffer 필요 → `/editor`, `/upload` 경로에 COOP/COEP 헤더 (next.config.ts)
- 인트로 카드 합성: `src/lib/intro-composer.ts` → `src/lib/card-renderer.ts` (dynamic import chain)

---

## 핵심 기능 4: 영상 플레이어

### ClipPlayerSheet (`src/components/player/ClipPlayerSheet.tsx`)
- 전체화면 세로 스와이프로 클립 전환
- **영상 꾸미기 모두 런타임**: freeze frame, spotlight ring, HUD 오버레이 — 영상 파일 무수정
- 인트로 카드: 재생 전 3초 선수 정보 (`player_cards` 테이블)
- HUD 오버레이: `src/components/video/hud/HudOverlay.tsx` (dynamic import)
- 스포트라이트 링: `spotlight_x/y` DB 컬럼 → CSS 오버레이

---

## 핵심 기능 5: 프로필 카드 에디터

- 진입점: `src/app/editor/page.tsx` (public — 로그인 불필요)
- 템플릿: FIFA 스타일 / 방송 스타일 (BroadcastCard)
- 저장: `player_cards` 테이블 (프로필당 1장 upsert)
- 카드 렌더링: `src/lib/card-renderer.ts` (Canvas)
- 내보내기: PNG + MP4 (`src/components/editor/useExport.ts`)
- 배경 제거: `@imgly/background-removal`

---

## 핵심 기능 6: 부모용 자녀 관리

- 홈에서 자녀 대시보드 (`src/components/parent/ChildDashboard.tsx`)
- 자녀 목록: `src/app/profile/children/page.tsx`
- API: `src/app/api/parent/` (child, dashboard, link, recap, upload)

---

## 핵심 기능 7: 홈 피드 & 소셜

- 역할별 홈: player → FeedListClient, parent → ChildDashboard, scout → ScoutHome
- 응원(Kudos) + 댓글 + 공유 (FeedCard → CommentSheet, dynamic import)
- 팔로우: `src/app/api/follows/route.ts`
- 알림: `src/app/(main)/notifications/page.tsx`
- DM: `src/app/dm/` (Supabase Realtime)

---

## 핵심 기능 8: MVP 투표 & 탐색

- MVP: `src/app/mvp/page.tsx` → MvpPageClient (투표 + 아카이브 + 명예의 전당, dynamic import)
- 탐색: `src/app/discover/page.tsx` (PlayerRanking, TeamRanking, TagGrid, SearchOverlay — 모두 dynamic)
- MVP API: `src/app/api/mvp/`
- 탐색 API: `src/app/api/discover/`

---

## 핵심 기능 9: 팀 허브

- 팀 목록: `src/app/team/page.tsx`
- 팀 상세: `src/app/team/[id]/page.tsx` (피드 + 멤버 + 앨범)
- 공개 팀: `src/app/t/[handle]/page.tsx`
- API: `src/app/api/teams/`
