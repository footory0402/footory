# Footory Editor — 선수 프로필 카드 에디터 설계

## 개요
학부모가 선수 정보를 입력하면 프로급 선수 프로필 카드(FIFA 스타일)를
자동 생성하고, PNG 이미지 + 애니메이션 MP4 영상으로 내보낼 수 있는 웹 에디터.

## 접근법
**React 템플릿 → html-to-image → ffmpeg.wasm** (Approach A)
- 카드를 React 컴포넌트(Tailwind CSS)로 구현
- `html-to-image`로 PNG 캡처
- `ffmpeg.wasm`으로 브라우저 내 MP4 인코딩 (서버 비용 0)
- 생성물은 R2에 저장, 선수 프로필과 연동

## DB 스키마

```sql
-- 023_editor_outputs.sql
CREATE TABLE editor_outputs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id   uuid REFERENCES players(id),
  user_id     uuid REFERENCES auth.users(id) NOT NULL,
  template    text NOT NULL CHECK (template IN ('fifa', 'broadcast', 'minimal')),
  player_data jsonb NOT NULL,        -- 폼 데이터 스냅샷
  image_key   text,                  -- R2 PNG 키
  video_key   text,                  -- R2 MP4 키 (nullable)
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX idx_editor_outputs_user ON editor_outputs(user_id);
CREATE INDEX idx_editor_outputs_player ON editor_outputs(player_id);
```

## 파일 구조

```
src/
├── app/editor/
│   ├── layout.tsx          # 에디터 전용 레이아웃 (BottomNav 없음, PC 전용)
│   └── page.tsx            # 2단 레이아웃: 좌(폼 360px) / 우(실시간 미리보기)
├── app/api/editor/
│   ├── presign/route.ts    # R2 presigned URL (PNG/MP4)
│   └── save/route.ts       # editor_outputs INSERT
├── components/editor/
│   ├── PlayerForm.tsx       # 입력 폼 (shadcn/ui 기반)
│   ├── TemplateSelector.tsx # 템플릿 탭 (PillTabs 스타일)
│   ├── ExportButtons.tsx    # PNG/MP4 내보내기 버튼
│   ├── MobileGuard.tsx      # "PC에서 이용해주세요" 안내
│   └── templates/
│       ├── FifaCard.tsx     # FIFA 스타일 (340×480, 세로)
│       ├── BroadcastCard.tsx # 방송 스타일 (540×320, 가로)
│       └── MinimalCard.tsx  # 미니멀 (340×440, 세로)
├── lib/
│   └── editor-constants.ts  # CLUBS, POSITIONS, TEMPLATES 상수
├── types/
│   └── editor.ts           # EditorPlayerData, EditorOutput 타입
└── hooks/
    └── useEditorExport.ts  # PNG/MP4 내보내기 로직
```

## R2 키 구조

```
editor/png/{userId}/{outputId}.png
editor/mp4/{userId}/{outputId}.mp4
```

## 디자인 레퍼런스
`docs/footory-editor.jsx` — 3가지 템플릿의 인라인 스타일 구현.
이 파일의 디자인을 Tailwind CSS로 전환하여 사용.

## 주요 의존성 (신규)
- `html-to-image` — DOM → PNG 캡처
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` — 브라우저 MP4 인코딩
- Pretendard 폰트 (self-host, woff2)

## Step별 구현 계획

### Step 1 — 기반 설정
- `next.config.ts`: `/editor` 경로 COOP/COEP 헤더 추가 (SharedArrayBuffer)
- `src/types/editor.ts`: EditorPlayerData, EditorOutput 타입 정의
- `src/lib/editor-constants.ts`: 구단 컬러(FC Seoul=#C0392B 등), 포지션, 템플릿 상수
- Pretendard 폰트: `public/fonts/`에 self-host (woff2)
- `globals.css`: Pretendard @font-face 추가
- **검증**: 빌드 성공 + `/editor` 접근 시 COOP/COEP 헤더 확인

### Step 2 — 에디터 페이지 + 입력 폼
- `src/app/editor/layout.tsx`: BottomNav 없는 독립 레이아웃
- `src/app/editor/page.tsx`: 모바일 감지 → MobileGuard / PC → 2단 레이아웃
- `src/components/editor/PlayerForm.tsx`: footory-editor.jsx 참고, Tailwind 전환, shadcn/ui Input/Select 활용
- `src/components/editor/TemplateSelector.tsx`: PillTabs 스타일 탭
- `src/components/editor/MobileGuard.tsx`: 모바일 접속 시 안내 화면
- **검증**: PC에서 폼 입력 → 상태 변경 확인, 모바일에서 안내 표시

### Step 3 — 카드 템플릿 3종 + 실시간 미리보기
- `templates/FifaCard.tsx`: footory-editor.jsx FIFA 디자인 → Tailwind 전환 (340×480)
- `templates/BroadcastCard.tsx`: 방송 스타일 → Tailwind 전환 (540×320)
- `templates/MinimalCard.tsx`: 미니멀 → Tailwind 전환 (340×440)
- 폼 입력 시 실시간 카드 갱신 (React state 바인딩)
- 경기장 SVG 배경 재사용
- **검증**: 3개 템플릿 전환 + 데이터 바인딩 + 구단 컬러 자동 변경 확인

### Step 4 — PNG 내보내기 + R2 저장
- `html-to-image` 설치 + 카드 DOM → PNG 캡처
- `src/app/api/editor/presign/route.ts`: R2 presigned URL (기존 r2.ts 활용)
- `src/app/api/editor/save/route.ts`: editor_outputs DB INSERT
- `src/hooks/useEditorExport.ts`: 캡처 → 업로드 → 저장 플로우
- `database.ts`: editor_outputs 타입 추가
- **검증**: PNG 다운로드 + R2 업로드 + DB 레코드 생성

### Step 5 — ffmpeg.wasm MP4 내보내기
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` 설치
- 카드 등장 애니메이션 프레임 캡처 (약 3-5초, 30fps)
- CSS 애니메이션: 번호 슬라이드인, 이름 페이드인, 스탯 순차 등장
- PNG 시퀀스 → MP4 인코딩 (브라우저 내)
- R2 업로드 + DB 저장 (video_key 업데이트)
- 인코딩 진행률 표시
- **검증**: MP4 생성 + 재생 + R2 저장 확인

### Step 6 — 프로필 연동
- 프로필 페이지에 "내 카드" 섹션 추가
- `src/app/api/editor/outputs/route.ts`: editor_outputs 조회
- 카드 목록 (썸네일 + 다운로드/공유)
- **검증**: 프로필에서 생성된 카드 확인 + 다운로드 가능

## 기존 코드 영향

| 기존 파일 | 변경 내용 | 영향도 |
|-----------|---------|--------|
| `next.config.ts` | `/editor` COOP/COEP 헤더 추가 | 최소 (다른 경로 무관) |
| `globals.css` | Pretendard @font-face 추가 | 최소 (기존 스타일 무관) |
| `database.ts` | editor_outputs 테이블 타입 추가 | 최소 (기존 타입 무관) |
| 나머지 기존 코드 | **변경 없음** | 없음 |

## 제약 사항
- ffmpeg.wasm은 SharedArrayBuffer 필요 → COOP/COEP 헤더 `/editor` 경로만 적용
- 모바일 미지원 → MobileGuard 컴포넌트로 안내
- 외부 이미지 CORS → Pretendard self-host, 선수 사진은 로컬 파일 업로드
- Phase 2 (경기 영상 HUD 오버레이)는 이 설계 범위 밖
