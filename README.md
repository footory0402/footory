# FOOTORY

유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오를 관리하는 모바일 웹앱.

**스택:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase · Cloudflare R2 · Vercel

---

## 개발 환경 시작

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인.

---

## 명령어 목록

### 개발

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Next.js 개발 서버 실행 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과물로 서버 실행 (프로덕션 미리보기) |

### 코드 품질

| 명령어 | 설명 |
|--------|------|
| `npm run typecheck` | TypeScript 타입 에러 검사 (빌드 없이) |
| `npm run lint` | ESLint로 `src/` 코드 정적 분석 |
| `npm run format` | Prettier로 `src/` 코드 자동 포맷 |

### 테스트

| 명령어 | 설명 |
|--------|------|
| `npm run test` | Vitest 단위 테스트 워치 모드 (개발 중 실시간) |
| `npm run test:run` | Vitest 단위 테스트 1회 실행 후 종료 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run test:e2e:ui` | Playwright UI 모드로 E2E 테스트 (브라우저 시각화) |
| `npm run test:e2e:auth:save` | Playwright Codegen으로 로그인 세션 저장 → `.auth/user.json` |
| `npm run test:e2e:auth` | 저장된 인증 세션으로 E2E 테스트 실행 (로그인 불필요) |
| `npm run test:qa` | typecheck + test:run + test:e2e 풀 QA 파이프라인 |

### 권장 워크플로우

```bash
# 1. E2E 테스트 전 최초 1회: 로그인 세션 저장
npm run test:e2e:auth:save

# 2. 이후 E2E 테스트 실행 (세션 재사용)
npm run test:e2e:auth

# 3. 배포 전 최종 검사
npm run test:qa
```

### 테스트 운영 팁

- `npm run test:e2e`:
  - 비로그인 기준 스모크 실행용입니다.
  - 보호 라우트 시나리오는 자동으로 `skip` 될 수 있습니다.
- `npm run test:e2e:auth`:
  - `.auth/user.json` 세션을 사용해 전체 플로우를 로그인 상태로 검증합니다.
  - 로그인 만료 시 `npm run test:e2e:auth:save`를 다시 실행하세요.
- Playwright 결과물:
  - HTML 리포트: `playwright-report/`
  - 실패 스냅샷/비디오: `test-results/`
- CI:
  - GitHub Actions 워크플로우: `.github/workflows/qa.yml`
  - PR/`main` push 시 `npm run test:qa` 실행 + Playwright 아티팩트 업로드

---

## 환경변수 설정

`.env.local` 파일 생성 후 아래 값 입력:

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

---

## 주요 문서

- `docs/DESIGN-SYSTEM.md` — 디자인 토큰, 컬러, 타이포, 컴포넌트 패턴
- `docs/SPEC.md` — 전체 기획서 (화면설계, 기능 명세)
- `docs/ARCHITECTURE.md` — DB 스키마, API 구조, 영상 파이프라인
- `docs/PROGRESS.md` — 현재 진행 상황
