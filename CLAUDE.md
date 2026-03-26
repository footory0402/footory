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

## 에디터 기능 (신규 추가 예정)

### 목표
학부모가 선수 정보를 입력하면 프로급 선수 프로필 카드(FIFA 스타일)를
자동 생성하고, 애니메이션 MP4 영상으로 내보낼 수 있는 웹 에디터.

### 참고 영상
유소년 축구 하이라이트 영상의 구성:
- 선수 인트로 카드 (이름, 등번호, 포지션, 구단 로고, 경기장 배경)
- Player Review 카드 (이름/번호/나이/생년월일/키/몸무게/주발/포지션/클럽/국적)
- 경기 하이라이트 + HUD 오버레이 (선수 썸네일, 스탯바, 골 카운터)

### 에디터 기술 전략
- Phase 1 (지금): 인트로/프로필 카드 → Canvas + ffmpeg.wasm으로 브라우저에서 MP4 생성 (서버 비용 0)
- Phase 2 (나중): 경기 영상 HUD 오버레이 → 서버사이드 FFmpeg
- 배경 제거: @imgly/background-removal (브라우저 ONNX) 또는 rembg

### 에디터 UI 구성
- 2단 레이아웃: 좌(입력폼 360px) / 우(실시간 카드 미리보기)
- 3가지 템플릿: FIFA 스타일(세로) / 방송 스타일(가로) / 미니멀(세로)
- 구단별 컬러 자동 매핑 (FC Seoul=#C0392B, Jeonbuk=#2E7D32, Ulsan=#1565C0 등)
- 내보내기: PNG 이미지 + MP4 영상(애니메이션)

### 선수 프로필 데이터
firstName, lastName, number, position(GK/CB/LB/RB/CDM/CM/CAM/LW/RW/ST/CF),
club, age, birthDate, height(cm), weight(kg), foot(오른발/왼발/양발),
nationality, photoUrl

### 에디터 파일 위치 규칙
- 페이지: app/editor/
- 컴포넌트: components/editor/
- API: app/api/editor/
- 기존 코드(로그인, 홈, 영상 업로드 등)는 절대 수정하지 않음

### ffmpeg.wasm 주의사항
- SharedArrayBuffer 필요 → next.config.js에 /editor 경로 COOP/COEP 헤더 추가
- 모바일 미지원 → "PC에서 이용해주세요" 안내 필요

### 카드 캡처 주의사항
- html-to-image로 PNG 내보내기
- 외부 이미지 CORS → R2 버킷 CORS 설정에 에디터 도메인 추가
- 폰트 → Pretendard self-host 권장 (외부 폰트는 캡처 시 누락 가능)

### 에디터 UI 레퍼런스
프로젝트 루트의 docs/footory-editor.jsx 파일을 참고할 것.
3가지 카드 템플릿(FIFA/방송/미니멀)의 디자인 토큰,
레이아웃 구조, 구단별 컬러 매핑이 구현되어 있음.
이 파일의 디자인을 Tailwind CSS로 전환하여 사용.
```

아까 만든 `.jsx` 파일을 프로젝트 루트에 넣어두고, Claude Code 킥오프 프롬프트에도 한 마디 추가하면 됩니다:
```
footory-editor.jsx 파일도 확인해.
카드 디자인의 레퍼런스로 활용해줘.