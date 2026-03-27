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

## 테스트 필수 규칙
**기능 수정/추가 후 반드시 브라우저에서 실제 테스트할 것.**
- Playwright 또는 agent-browser로 해당 기능의 전체 플로우 확인
- 스크린샷 캡처하여 UI 정상 렌더링 확인
- API 응답 확인 (evaluate로 fetch 테스트)
- 테스트 미완료 시 배포 금지
- 특히 영상 업로드/합성 같은 복잡한 플로우는 단계별로 검증

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

## 에디터 기능 (Phase 1 — 구현 완료)

### 개요
선수 프로필 카드를 생성/저장하고, 영상 업로드 시 인트로로 자동 합성.
로그인 없이도 에디터 접근 가능 (/editor는 public 경로).

### 구현된 기능
- 3가지 템플릿: FIFA 스타일(세로) / 방송 스타일(가로) / 미니멀(세로)
- 프로필 자동 채움: 에디터 진입 시 로그인된 사용자의 프로필 데이터 자동 로드
- 카드 저장/불러오기: player_cards 테이블 (프로필당 1장, upsert)
- 사진 R2 업로드: card-photos/{userId}/photo.jpg로 저장
- 배경 제거: @imgly/background-removal (브라우저 ONNX)
- 컬러 자유 선택: 프로구단 프리셋 + 커스텀 컬러피커 항상 노출
- 내보내기: PNG 이미지 + MP4 영상(애니메이션)
- 모바일 반응형 레이아웃 (세로 스택 + 카드 자동 축소)

### 영상 업로드 연동 (클라이언트사이드 합성)
- 업로드 시 "인트로 카드" 토글 ON → 저장된 카드 자동 합성
- card-renderer.ts: Canvas로 카드 PNG 렌더링
- intro-composer.ts: ffmpeg.wasm으로 카드 2초 + 원본 영상 concat
- GlobalUploadIndicator에서 "인트로 카드 합성 중" 단계 표시
- SharedArrayBuffer 미지원 시 합성 건너뛰고 원본 업로드

### 부모용 자녀 프로필 관리
- /upload/child/[id]: 자녀 기본정보(포지션/등번호/키/몸무게) 편집 + 시즌 기록 CRUD
- /api/parent/child/[id]: 부모-자녀 링크 검증 후 프로필 GET/PUT
- /api/parent/child/[id]/seasons: 시즌 기록 GET/POST/DELETE
- ChildSelector: 자녀별 "편집" 버튼 + 프로필 미완성 뱃지

### 파일 위치
- 에디터 페이지: app/editor/
- 에디터 컴포넌트: components/editor/
- 카드 API: app/api/player-card/
- 카드 렌더러: lib/card-renderer.ts
- 인트로 합성: lib/intro-composer.ts
- 자녀 관리 API: app/api/parent/child/[id]/
- 자녀 편집 페이지: app/upload/child/[id]/

### ffmpeg.wasm 주의사항
- SharedArrayBuffer 필요 → /editor, /upload 경로에 COOP/COEP 헤더 추가됨
- 모바일에서도 동작 (COOP/COEP 헤더 적용 완료)

### DB 테이블
- player_cards: id, profile_id(UNIQUE), template, club_name, main_color, accent_color, card_data(JSONB)
- RLS: 본인 + 연동 부모만 접근 가능

## 영상 편집 기능 (Phase 2)

### 목표
학부모가 경기 영상을 업로드하면, 프로필 카드 인트로 + HUD 오버레이 + 아웃트로를
자동 합성한 하이라이트 영상을 생성.

### 완성 영상 구조 (참고: test_test_player.mp4)
1. 인트로 (5초) — Phase 1에서 만든 선수 카드 애니메이션
2. Player Review (5초) — 상세 프로필 카드 애니메이션
3. 경기 하이라이트 (사용자 영상) + HUD 오버레이:
   - 좌하단: 선수 미니카드 (사진 + 이름 + 등번호)
   - 하단바: CLUB | POSITION | BIRTH DATE | HEIGHT/WEIGHT | FOOT
   - 우하단: GOAL 카운터 + 포메이션 다이어그램
   - 상단: "YOUTHLIGHT FOOTBALL HIGHLIGHT" 타이틀바
4. 아웃트로 (3초) — Footory 로고 + SNS 공유 CTA

### 기술 방식
- 인트로/아웃트로: Phase 1의 브라우저 렌더링 결과물 사용
- HUD 오버레이 합성: 서버사이드 FFmpeg
  - 방법: FFmpeg drawtext + overlay 필터로 원본 영상 위에 HUD 합성
  - 또는: Puppeteer로 HUD를 투명 PNG 시퀀스로 렌더 → FFmpeg overlay
- 인트로 + 경기영상 + 아웃트로 concat: FFmpeg concat demuxer
- 렌더 서버: Railway 또는 Fly.io ($5~15/월)
- 결과물 저장: Cloudflare R2

### 영상 편집 에디터 UI
- 타임라인 바: [인트로|경기영상|아웃트로] 구간 시각화
- 경기 영상 트리머: 시작점/끝점 드래그로 구간 선택
- HUD 편집: 골 수 입력, 표시할 정보 on/off 토글
- 미리보기: 영상 플레이어 + HUD 오버레이 실시간 프리뷰

### Phase 2 파일 위치 규칙
- 렌더 서버: 별도 레포 또는 /render-server/ 디렉토리
- HUD 컴포넌트: components/video/hud/
- 영상 편집 에디터: app/edit/[clipId]/
- 렌더 API: app/api/render/