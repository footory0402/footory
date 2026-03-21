# FOOTORY

유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오를 관리하는 모바일 웹앱.

**스택:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase · Cloudflare R2 · Vercel

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **프로필** | V5 3탭 (하이라이트/기록/커리어), 플레이스타일 테스트, PDF 내보내기 |
| **영상 업로드** | R2 presigned URL, 2단계 위저드 (트림 → 꾸미기), 이펙트/스킬 라벨 |
| **MVP 투표** | 주간 MVP 투표 (자동70%+투표30%), 아카이브, 명예의 전당 |
| **탐색** | 선수/팀 랭킹, 태그 그리드, 검색 오버레이 |
| **소셜** | 팔로우, 응원(Kudos), 댓글, DM, 공유 |
| **팀** | 생성/가입, 앨범, 공지, 현재/이전 소속 분리 |
| **부모** | 자녀 대시보드, 빠른 업로드, 주간 리캡 |
| **스카우트** | 관심목록, 선수 비교 |
| **인증** | 카카오 SSO + 이메일 로그인, 역할 3분기 (player/parent/scout) |

## 라우트 구조

```
/ .................. 홈 (역할별 피드)
/login ............. 로그인
/signup ............ 이메일 가입
/onboarding ........ 역할별 온보딩
/profile ........... 내 프로필 (3탭)
/profile/settings .. 설정
/profile/follows ... 팔로잉/팔로워
/profile/watchlist . 스카우트 관심목록
/profile/children .. 부모: 자녀 관리
/discover .......... 탐색 (랭킹 + 검색)
/mvp ............... MVP 투표
/team .............. 팀 허브
/team/[id] ......... 팀 상세
/upload ............ 영상 업로드
/dm ................ DM 목록
/p/[handle] ........ 공개 프로필 (SSR)
/t/[handle] ........ 공개 팀 프로필 (SSR)
/admin/video-lab ... 영상 가공 랩 (관리자)
```

---

## 개발 환경

```bash
npm install
npm run dev        # localhost:3000
```

## 환경변수

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=footory-videos
R2_PUBLIC_URL=
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 검사 |
| `npm run lint` | ESLint |
| `npm run test` | Vitest 워치 모드 |
| `npm run test:run` | Vitest 1회 실행 |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:qa` | typecheck + test + e2e |

## 문서

- `docs/SPEC.md` — 기획서 (v1.1 화면설계)
- `docs/ARCHITECTURE.md` — DB 스키마, API, 영상 파이프라인
- `docs/DESIGN-SYSTEM.md` — 디자인 토큰, 컴포넌트 패턴
- `docs/PROGRESS.md` — 구현 진행 상황
- `docs/FOOTORY-프로필-리디자인-핸드오프.md` — 프로필 V5 설계
- `docs/FOOTORY-v1.3-기획안.md` — v1.3 로드맵 (영상 엔진)
