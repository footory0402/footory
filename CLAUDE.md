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
- **배포**: Vercel (`vercel.json`)
- **상태**: Zustand 5 (업로드), React hooks (나머지)
- **영상처리**: FFmpeg WASM (클라이언트사이드 압축 + 인트로 합성)

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
4. 다크 모드만. 배경 기본값 `#070709`
5. 모바일 퍼스트 (max-width 430px)
6. Supabase: 브라우저 → `src/lib/supabase/client.ts`, 서버 → `src/lib/supabase/server.ts`
7. `database.ts` 각 테이블에 `Relationships: []` 필수 (없으면 Insert 타입 `never`)
8. 업로드 작업 전 `src/lib/upload-service.ts` 최상단 주석 읽을 것 (핵심 상수 변경 금지)

## 디자인 핵심
- 배경: `#070709` → `#1C1C22` → `#24242A`
- 골드 액센트: `#D4A853`
- 텍스트: `#FAFAFA` / `#A1A1AA` / `#71717A`
- `card-elevated` = bg-card + var(--card-shadow) + rounded-12
- `glass-nav` = backdrop-blur + 반투명 (헤더/바텀탭)
- Border: `rgba(255,255,255,0.08)`
- 폰트: 스탯 → Oswald, 브랜드 → Rajdhani, 본문 → Noto Sans KR

## 5탭 네비
| 탭 | 라우트 |
|----|--------|
| 🏠 홈 | `/` |
| 🏆 MVP | `/mvp` |
| 🔍 탐색 | `/discover` |
| 👤 프로필 | `/profile` |
| 👥 팀 | `/team/[id]` |

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

### 로그인 방식
- 카카오 SSO + 이메일/비밀번호
- 역할 3종: `player | parent | scout`

### 파일 위치
- `src/lib/auth.ts` — signInWithKakao, signUpWithEmail, signInWithEmail, resetPassword
- `src/components/auth/` — KakaoLoginButton, EmailLoginForm, EmailSignupForm
- `src/app/login/page.tsx` — 로그인 페이지
- `src/app/signup/page.tsx` — 이메일 가입
- `src/app/auth/confirm/route.ts` — 이메일 인증 콜백
- `src/app/(main)/profile/onboarding/page.tsx` — 역할별 온보딩

---

## 핵심 기능 2: 프로필

### 구현된 기능
- 프로필 카드 (사진/이름/포지션/팀/나이/도시)
- 프로필 레벨 (Lv.1~5)
- 3탭 구조: 하이라이트 / 기록(스탯) / 커리어
- 인라인 편집 (ProfileEditSheet)
- 공개 프로필 `/p/[handle]` SSR
- 팔로우/팔로잉
- 플레이스타일 테스트

### 파일 위치
- `src/app/(main)/profile/page.tsx` — 내 프로필
- `src/app/(main)/profile/edit/page.tsx` — 프로필 편집
- `src/app/p/[handle]/page.tsx` — 공개 프로필 SSR
- `src/app/p/[handle]/h/[clipId]/page.tsx` — 하이라이트 공유 페이지
- `src/app/api/profile/me/route.ts` — GET/PUT 프로필 API
- `src/components/profile/` — PlayerCard, FeaturedHighlights, SeasonHistory 등

---

## 핵심 기능 3: 영상 업로드

### 업로드 플로우
1. 파일 선택 → 유효성 검사 (200MB / 5분 이내)
2. 백그라운드 FFmpeg WASM 압축 (5MB 이상 시)
3. R2 presigned URL로 직접 업로드
4. 스포트라이트 링 위치 선택 (선택)
5. 인트로 카드 토글 (ON 시 ffmpeg.wasm으로 카드 2초 + 원본 concat)
6. 클립 메타데이터 저장 → 프로필 자동 이동

### 업로드 방식 2가지
- **짧은 영상 바로 올리기**: 스킬 영상 직접 업로드 (2분 이내)
- **경기 영상 하이라이트**: `/editor/video`에서 풀영상 구간 선택 → 하이라이트 생성

### 파일 위치
- `src/app/upload/page.tsx` — 업로드 페이지
- `src/lib/upload-service.ts` — 핵심 업로드 로직 (startUpload, startR2BackgroundUpload)
- `src/stores/upload-store.ts` — Zustand 업로드 상태
- `src/components/upload/VideoSelector.tsx` — 파일 선택 + 압축
- `src/components/upload/SpotlightPicker.tsx` — 스포트라이트 위치 선택
- `src/components/upload/GlobalUploadIndicator.tsx` — 진행 상태 표시
- `src/app/api/upload/presign/route.ts` — R2 presigned URL
- `src/app/api/clips/route.ts` — 클립 CRUD

### ffmpeg.wasm 주의사항
- SharedArrayBuffer 필요 → /editor, /upload 경로에 COOP/COEP 헤더 추가됨
- 모바일에서도 동작

---

## 핵심 기능 4: 영상 플레이어

### ClipPlayerSheet (전체화면 플레이어)
- 세로 스와이프 (위/아래)로 클립 전환
- 인트로 카드: 재생 전 3초간 선수 정보 카드 표시 (player_cards 테이블 연동)
- HUD 오버레이: 방송 스타일 (상단 브랜드바 + 하단 선수 정보 2단 바)
- 스포트라이트 링: 선수 위치 강조 (2.5초 표시 후 페이드아웃)
- seekbar + 일시정지 + 공유/편집/삭제 액션

### HUD 오버레이 구조
- 상단: "FOOTORY HIGHLIGHT" 브랜드 바
- 하단 1행: 선수 사진(44px) + 이름/등번호 + 포지션 뱃지
- 하단 2행: CLUB | BORN | SIZE | FOOT (4열 스탯 그리드)

### 파일 위치
- `src/components/player/ClipPlayerSheet.tsx` — 전체화면 플레이어 (인트로 카드 + HUD 통합)
- `src/components/video/hud/HudOverlay.tsx` — 방송 스타일 HUD 오버레이 (자체 포함)
- `src/components/video/hud/IntroCard.tsx` — 인트로 선수 카드
- `src/components/video/hud/types.ts` — HudPlayerData, HudConfig 타입
- `src/components/video/VideoOverlay.tsx` — 스포트라이트 링 + 네임태그 (HUD 없을 때 폴백)

---

## 핵심 기능 5: 프로필 카드 에디터

### 개요
선수 프로필 카드를 생성/저장하고, 영상 인트로에 자동 합성.
로그인 없이도 에디터 접근 가능 (/editor는 public 경로).

### 구현된 기능
- 3가지 템플릿: FIFA 스타일(세로) / 방송 스타일(가로) / 미니멀(세로)
- 프로필 자동 채움
- 카드 저장/불러오기: player_cards 테이블 (프로필당 1장, upsert)
- 사진 R2 업로드 + 배경 제거 (@imgly/background-removal)
- 컬러 자유 선택: 프로구단 프리셋 + 커스텀 컬러피커
- 내보내기: PNG 이미지 + MP4 영상(애니메이션)

### 파일 위치
- `src/app/editor/page.tsx` — 에디터 페이지
- `src/components/editor/` — 에디터 컴포넌트
- `src/app/api/player-card/route.ts` — 카드 CRUD API
- `src/lib/card-renderer.ts` — Canvas 카드 렌더링
- `src/lib/intro-composer.ts` — ffmpeg.wasm 인트로 합성

### DB 테이블
- player_cards: id, profile_id(UNIQUE), template, club_name, main_color, accent_color, card_data(JSONB)

---

## 핵심 기능 6: 부모용 자녀 관리

### 구현된 기능
- 자녀 프로필 편집 (포지션/등번호/키/몸무게)
- 시즌 기록 CRUD
- 부모 대시보드 + 활동 리캡
- 자녀 대신 영상 업로드

### 파일 위치
- `src/app/upload/child/[id]/page.tsx` — 자녀 편집 페이지
- `src/app/api/parent/` — 부모 관련 API (child, dashboard, link, recap, upload)
- `src/app/profile/children/page.tsx` — 자녀 목록

---

## 핵심 기능 7: 홈 피드 & 소셜

### 구현된 기능
- 추천 기반 피드 (역할별 뷰)
- 응원 (Kudos) 👏 + 댓글
- 팔로우/팔로잉 (8개 진입점)
- 알림 시스템

### 파일 위치
- `src/app/(main)/page.tsx` — 홈 피드
- `src/app/api/feed/route.ts` — 피드 API
- `src/app/api/follows/route.ts` — 팔로우 API
- `src/app/(main)/notifications/page.tsx` — 알림

---

## 핵심 기능 8: MVP 투표 & 탐색

### MVP
- 주간 MVP 투표 + 자동 점수 (조회·응원·댓글 가중합)
- 순위표 + 아카이브 + 명예의 전당

### 탐색
- 선수/팀 랭킹 + 검색 + 태그 그리드

### 파일 위치
- `src/app/mvp/page.tsx` — MVP 탭
- `src/app/discover/page.tsx` — 탐색 탭
- `src/app/api/mvp/` — MVP API
- `src/app/api/discover/` — 탐색 API

---

## 핵심 기능 9: 팀 허브

### 구현된 기능
- 팀 생성/가입 (초대코드)
- 공지/일정/미디어/멤버 관리
- 현재/이전 소속 분리

### 파일 위치
- `src/app/team/[id]/page.tsx` — 팀 페이지
- `src/app/api/teams/` — 팀 API
