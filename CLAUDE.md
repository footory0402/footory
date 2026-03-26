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
- **배포**: Vercel (`vercel.json`) / OpenNext Cloudflare 옵션 (`open-next.config.ts`)
- **상태**: Zustand 5 (업로드), React hooks (나머지)
- **영상처리**: FFmpeg 클라이언트사이드 압축

## 코딩 규칙
1. 모든 컴포넌트 `.tsx` — TypeScript 필수
2. 스타일은 Tailwind + CSS 변수 (`globals.css`) — 인라인 style 금지
3. 라우트 보호: `src/proxy.ts` (middleware.ts 아님 — Next.js 16 명칭 변경)
4. 다크 모드만. 배경 기본값 `#070709`
5. 모바일 퍼스트 (max-width 430px)
6. Supabase: 브라우저 → `src/lib/supabase/client.ts`, 서버 → `src/lib/supabase/server.ts`
7. `database.ts` 각 테이블에 `Relationships: []` 필수 (없으면 Insert 타입 `never`)
8. 업로드 작업 전 `src/lib/upload-service.ts` 최상단 주석 읽을 것 (핵심 상수 변경 금지)

## 도메인별 필수 가이드
> 해당 작업 시 반드시 먼저 읽을 것.

- **새 외부 API 연동** → `docs/agent-guides/async-api-patterns.md`
- **Kafka 설정 변경** → `docs/agent-guides/kafka-config.md`

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
