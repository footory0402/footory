# FOOTORY v1.3 기획안 — "영상 엔진 + 안정화"

> 최종 업데이트: 2026-03-15
> 작성: claude.ai 기획방
> 용도: 이 문서를 Claude Code에 업로드하여 바로 구현 시작

---

## 한 줄 요약

영상을 프로처럼 꾸미는 기능. 트리밍, 슬로모션 리플레이, 주인공 하이라이트, 스킬 라벨, EA FC 카드 오버레이, BGM, 하이라이트 릴. 업로드하면 Cloudflare Containers에서 FFmpeg이 알아서 렌더링.

---

## PART 0. 핵심 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 영상 처리 서버 | Cloudflare Containers (FFmpeg Docker) | R2 네이티브 연동, 스케일 투 제로, 서울 리전, wrangler 배포 |
| 저장소 | Cloudflare R2 (기존 유지) | 변경 없음. Containers에서 R2 바인딩으로 직접 접근 |
| 편집 타이밍 | 업로드 시점에만 | 원본 1개만 저장 |
| 릴 소스 | 내 클립만 합본 | 권한 이슈 없음 |
| 릴 최대 길이 | 60초 | 틱톡 기본 |
| 주인공 표시 | EA FC 골드 원형 링, 2초, 사용자 터치 지정 | AI 추적 불필요, CPU FFmpeg으로 충분 |
| 슬로모션 | 사용자가 구간+속도 지정 → 리플레이 자동 생성 | 기획방 FFmpeg 테스트에서 퀄리티 검증 완료 |
| BGM | 프리셋 라이브러리 (분위기별) | 저작권 프리 음원 |
| 색보정 | 피치 블랙 골드 톤 자동 적용 | FFmpeg eq+curves+vignette |
| AI 영상 생성 (LTX 등) | 안 넣음 | 실제 영상의 신뢰성이 Footory 핵심 가치 |
| AI 선수 추적 (YOLO) | 안 넣음 | GPU 필요, 학부모 촬영 영상에서 정확도 미보장 |

---

## PART 1. 인프라 아키텍처

### 전체 구조

```
┌──────────────────────────────────────────────────────┐
│                   Vercel (기존 유지)                    │
│  Next.js 프론트 + API Routes                          │
│  - presigned URL 발급 (R2 직접 업로드용)               │
│  - render_jobs 생성 (Supabase)                        │
│  - 렌더 상태 조회                                      │
│  ⚠️ 영상 파일은 Vercel을 거치지 않음                   │
└─────────────────┬────────────────────────────────────┘
                  │ fetch 호출
                  ▼
┌──────────────────────────────────────────────────────┐
│        Cloudflare Containers (신규)                    │
│  Worker → Container (FFmpeg + Node.js Docker)         │
│  - Worker가 라우팅, Container가 렌더링                │
│  - R2 바인딩으로 직접 읽기/쓰기 (네이티브)            │
│  - 스케일 투 제로 (요청 없으면 비용 0)                │
│  - 렌더 완료 시 Supabase 상태 업데이트                │
│  배포: wrangler deploy                                │
│  비용: ~$6~7/월 (초기), 스케일에 따라 증가            │
└─────────────────┬────────────────────────────────────┘
                  │ R2 바인딩 (네이티브)
                  ▼
┌──────────────────────────────────────────────────────┐
│             Cloudflare R2 (기존 유지)                  │
│  /raw/         원본 영상                               │
│  /clips/       렌더된 클립                             │
│  /thumbs/      썸네일                                  │
│  /highlights/  하이라이트 릴                           │
│  /bgm/         BGM 음원 파일                           │
│  /assets/      링 이미지, 폰트 등                     │
└──────────────────────────────────────────────────────┘
```

### 영상 업로드 흐름

```
[사용자 폰]              [Vercel]           [R2]       [CF Container]

1. "업로드" 탭 ─────→ presigned URL 요청
                    ←── URL 응답
2. 원본 직접 업로드 ──────────────────→ /raw/ 저장
3. 편집 메타 전송 ──→ render_jobs INSERT (Supabase)
                       + Container 호출 ──────────→ 잡 수신
4.                                                    /raw/ 에서 원본 로드
                                                      /bgm/ 에서 BGM 로드
                                                      FFmpeg 7-Pass 렌더
                                                      /clips/ 에 결과 저장
                                                      /thumbs/ 에 썸네일
5.                   ←── Realtime 상태 ←───────────── Supabase 업데이트
6. 프로필에 완성본 표시
```

### 비용 추정

```
Workers Paid 플랜:           $5/월 (기본)
Containers (500건/월):       ~$0.30 (CPU+메모리, 사용한 만큼만)
R2 저장소 (50GB):            ~$0.75
총합:                        ~$6~7/월 (초기)

월 5,000건 (유저 1,000명):   ~$8/월
월 50,000건 (유저 10,000명): ~$35/월
```

---

## PART 2. 업로드 플로우 (5 스텝)

### 전체 흐름

```
[+ 버튼] → 갤러리 영상 선택
  → Step 1: 트리밍
  → Step 2: 주인공 표시 (선택)
  → Step 3: 슬로모션 (선택)
  → Step 4: 태그 + BGM + 효과
  → Step 5: 프리뷰 → 업로드
```

### Step 1: 트리밍

```
┌─────────────────────────────────────┐
│  ← 뒤로                    다음 →  │
│  ●○○○○                             │
│  ┌─────────────────────────────┐    │
│  │       영상 프리뷰 (16:9)    │    │
│  └─────────────────────────────┘    │
│  00:03 ─────────────── 00:15        │
│  ├──[===선택구간====]──────────┤    │
│  0:00                    0:45       │
│  선택 구간: 12초 (최소 3초, 최대 60초)│
└─────────────────────────────────────┘

규칙:
  - 양쪽 핸들 드래그
  - 최소 3초, 최대 60초
  - 프리뷰는 선택 구간만 재생
```

### Step 2: 주인공 표시 (선택사항)

```
┌─────────────────────────────────────┐
│  ← 뒤로                  건너뛰기  │
│  ○●○○○                             │
│  🎯 나를 탭해주세요                 │
│  ┌─────────────────────────────┐    │
│  │         ╭── 골드링 ──╮     │    │
│  │         │  👆탭!    │     │    │
│  │         ╰───────────╯     │    │
│  │        김민수 · MF · #10   │    │
│  └─────────────────────────────┘    │
│  탭하면 영상 시작 2초 동안 표시      │
└─────────────────────────────────────┘

효과 상세:
  - 타원형 골드 링 (PNG overlay), #D4A853 + 글로우
  - 네임태그: 검정 배경 + 흰 텍스트 "{이름} · {포지션} · #{등번호}"
  - 0~0.3초 페이드인, 0.3~1.7초 표시, 1.7~2.0초 페이드아웃
  - 좌표: 터치 위치를 프레임 비율(0~1)로 저장
  - 선수 정보는 프로필에서 자동으로 가져옴
  - 건너뛰기 가능
```

### Step 3: 슬로모션 (선택사항)

```
┌─────────────────────────────────────┐
│  ← 뒤로                  건너뛰기  │
│  ○○●○○                             │
│  🎬 슬로모션 구간 선택               │
│  ┌─────────────────────────────┐    │
│  │       영상 프리뷰 (재생 중)  │    │
│  └─────────────────────────────┘    │
│  ┌────[==슬로모 구간==]────────┐    │
│  0:00   0:03 ~~~~~~ 0:07  0:12     │
│  슬로모션: 0:03 ~ 0:07 (4초)        │
│  속도: [● 0.5x  ○ 0.3x  ○ 0.25x]  │
│  결과: 원본 12초 + 리플레이 8초      │
│        = 총 20초                     │
└─────────────────────────────────────┘

규칙:
  - 구간: 최소 2초, 최대 10초
  - 속도: 0.5x (기본), 0.3x, 0.25x
  - 결과: [원본 전체] → [슬로모 구간 리플레이]
  - 리플레이에 ▶ REPLAY 뱃지 자동 표시 (우상단)
  - 건너뛰기 가능 (슬로모션 없이)
```

### Step 4: 태그 + BGM + 효과

```
┌─────────────────────────────────────┐
│  ← 뒤로                    다음 →  │
│  ○○○●○                             │
│  스킬 태그 (1개 이상)               │
│  [⚽슛] [🎯패스] [💨드리블]        │
│  [🏃스프린트] [🦶퍼스트터치]       │
│  [🔥골] [🎯어시스트] [💫개인기]    │
│  [🛡태클] [✋인터셉트] ...         │
│  [+ 직접 입력] (2개, 10자)         │
│  ─────────────                      │
│  🎵 배경음악                        │
│  [🔥에너지] [🎬시네마틱] [🏆승리]  │
│  [😎스웩] [🎯집중] [🚫없음]       │
│  ♫ "Energy Rush" ▶ 미리듣기        │
│  ─────────────                      │
│  ☑ 색보정 (시네마틱 톤)             │
│  ☑ 시네마틱 바 (레터박스)           │
│  ☑ EA FC 카드 오버레이              │
│  ☑ 인트로 카드                      │
└─────────────────────────────────────┘
```

#### 스킬 라벨 프리셋

```
공용: ⚽슛(shot), 🎯패스(pass), 💨드리블(dribble), 🏃스프린트(sprint), 🦶퍼스트터치(first_touch)
공격: 🔥골(goal), 🎯어시스트(assist), 💫개인기(skill_move), 🚀프리킥(free_kick)
수비: 🛡태클(tackle), ✋인터셉트(intercept), 🧱블로킹(blocking), 📐빌드업(buildup)
GK:  🧤세이브(save), ✈️다이빙(diving), 🦵킥(gk_kick), 📢지시(command)
커스텀: 최대 2개, 각 10자
노출 순서: 사용자 포지션에 따라 자동 정렬 (FW→공격 먼저, DF→수비 먼저 등)
```

#### BGM 프리셋

```
카테고리 (각 3~5곡):
  🔥 에너지(energy)    — 빠르고 강렬한 비트
  🎬 시네마틱(cinematic)— 웅장하고 드라마틱
  🏆 승리(victory)     — 밝고 축제 분위기
  😎 스웩(swag)        — 힙하고 쿨한
  🎯 집중(focus)       — 긴장감 있는
  🚫 없음              — BGM 미적용

규칙:
  - 미리듣기 5초 재생 가능
  - 영상 길이에 맞춰 자동 트리밍
  - 원본 오디오 50% + BGM 50% 믹싱
  - 저작권 프리 음원, R2 /bgm/ 에 저장
```

#### 효과 토글

```
기본 전부 ON (개별 OFF 가능):
  ☑ 색보정 — contrast 1.15, saturation 1.2, vignette, 골드 톤
  ☑ 시네마틱 바 — 상단 검정 바, 하단 골드 바 (레터박스)
  ☑ EA FC 카드 — 하단 바에 선수명 + 포지션 + 등급 표시
  ☑ 인트로 카드 — FOOTORY 로고 + 선수명 + 포지션 (2초)
```

### Step 5: 프리뷰 + 업로드

```
┌─────────────────────────────────────┐
│  ← 뒤로                  업로드 →  │
│  ○○○○●                             │
│  ┌─────────────────────────────┐    │
│  │ 💨 드리블              0:03│    │
│  │      ╭── 골드링 ──╮        │    │
│  │      │   선수    │         │    │
│  │      ╰──────────╯         │    │
│  │     김민수 · MF · #10      │    │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━ │    │
│  │ 김민수 · MF · ★87  FOOTORY│    │
│  └─────────────────────────────┘    │
│  총 길이: 22초                      │
│  🎵 Energy Rush                     │
│  💨 드리블  🔥 골                   │
│  ☑ 색보정  ☑ 시네마틱  ☑ EA FC     │
│  [──────── 업로드 ────────]         │
│  [─── 하이라이트 릴 만들기 ───]     │
└─────────────────────────────────────┘

프리뷰는 정적 썸네일에 오버레이 레이아웃을 보여주는 형태.
실제 렌더링은 서버에서 처리.
```

---

## PART 3. 하이라이트 릴

```
프로필 → "하이라이트 만들기" (골드 CTA)
  → 내 클립 선택 (2~10개, 드래그 순서, ≤60초)
  → 트랜지션: 컷(기본) / 페이드(0.5초)
  → 인트로 ON/OFF (기본 ON, FOOTORY로고+선수명, 3초)
  → BGM 선택 (릴 전용, 클립별 BGM 대체)
  → "생성" → 렌더 대기 → 완료 → Featured 후보 자동 추가

규칙:
  - 프로필당 최대 3개
  - 각 클립은 이미 렌더된 버전 사용 (오버레이 포함)
  - 아웃트로: FOOTORY 워터마크 (우하단, 항상)
  - 재편집 불가 (삭제 후 재생성, v1.5에서 재편집 추가)
```

---

## PART 4. 오버레이 디자인 명세

### 완성된 클립 레이아웃

```
시간  0초          2초                              끝
      ├──주인공 링──┤
      ├──────── 스킬 라벨 (좌상단) ──────────────────┤
      ├──────── 타임스탬프 (우상단) ──────────────────┤
      ├──────── EA FC 카드 바 (하단) ────────────────┤

┌─────────────────────────────────┐
│█████ 상단 검정 바 (68px) ██████│
│ 🏷 드리블                 0:03 │  스킬 라벨 + 타임스탬프
│                                 │
│        ╭── 골드 링 ──╮         │  0~2초만
│        │   선수     │          │
│        ╰───────────╯          │
│       김민수 · MF · #10       │  0~2초만
│                                 │
│█████ 하단 골드 바 (68px) ██████│
│ 김민수 · MF · ★87     FOOTORY │  EA FC 카드
└─────────────────────────────────┘
```

### 슬로모션 리플레이 구간

```
┌─────────────────────────────────┐
│█████ 상단 검정 바 ██████████████│
│ 🏷 드리블           ▶ REPLAY  │  REPLAY 뱃지 추가
│                                 │
│         (0.5배속 재생)          │
│                                 │
│█████ 하단 골드 바 ██████████████│
│ 김민수 · MF · ★87     FOOTORY │
└─────────────────────────────────┘
```

### 디자인 토큰

```
스킬 라벨 배경:    #1A1A1C (불투명), border-radius 없음 (drawbox)
스킬 라벨 텍스트:  #FAFAFA, 18px, NotoSansCJK-Bold
타임스탬프:        #9A9AAA, 14px, NotoSansCJK-Bold
상단 바:           #0C0C0E (불투명, 68px)
하단 바:           #8B6914 (불투명 골드, 68px)
하단 텍스트:       #FAFAFA, 22px (이름), #D4A853 (등급)
FOOTORY 워터마크:  #FAFAFA, 13px, 우하단, 반투명
원형 링:           #D4A853, PNG overlay, 140x84px
네임태그:          #0C0C0E 배경, #FAFAFA 텍스트, 15px
REPLAY 뱃지:      #D4A853 텍스트, 우상단

인트로 카드 (2초):
  배경 #0C0C0E
  "⚽ FOOTORY" — #D4A853, 48px, 중앙
  "{선수명} HIGHLIGHTS" — #FAFAFA, 36px
  "{스킬라벨} · {포지션} · #{등번호}" — #A1A1AA, 22px

⚠️ FFmpeg drawbox alpha(@)와 drawtext 혼용 시 픽셀포맷 충돌 발생.
   해결: 불투명 색상만 사용 (0xD4A853@0.7 → 0x8B6914).
   모든 텍스트: NotoSansCJK-Bold.ttc 통일 (영어+한국어 모두 렌더 가능).
```

---

## PART 5. 렌더 파이프라인 (FFmpeg 7-Pass)

기획방에서 실제 영상으로 테스트 완료. 아래 파이프라인이 검증됨.

### Pass 1: 색보정 + 레터박스

```
scale=1920:1080 → eq(contrast=1.15, saturation=1.2) → vignette
→ drawbox(상단 #0C0C0E 68px, 하단 #8B6914 68px, 스킬라벨 배경 #1A1A1C)
→ 출력: pass1.mp4
```

### Pass 2: 텍스트 오버레이

```
drawtext(스킬 라벨, 타임스탬프, 선수명, 포지션, 등급, FOOTORY)
drawtext(주인공 네임태그, enable 0~2초)
drawbox(네임태그 배경, enable 0~2초)
→ 출력: pass2.mp4

⚠️ 좌표는 ih/iw 변수 대신 명시적 픽셀값 사용 (1920x1080 기준)
⚠️ enable 이스케이프: enable='between(t\,0.3\,1.9)'
```

### Pass 3: 골드 링 합성

```
overlay(ring_gold.png, 터치 좌표, enable 0~2초)
→ 출력: pass3.mp4
```

### Pass 4: 슬로모션 리플레이 (선택)

```
trim(구간) → setpts=2*PTS (0.5x) → REPLAY 뱃지 drawtext
atempo=0.5 (오디오)
→ 출력: slowmo.mp4
```

### Pass 5: 인트로/아웃트로 생성

```
color 소스(#0C0C0E) + drawtext(FOOTORY 로고, 선수명)
→ 출력: intro.mp4 (2초), outro.mp4 (1.5초)
```

### Pass 6: 합본

```
concat(intro + main + slowmo + outro)
→ 출력: concat.mp4
```

### Pass 7: BGM 믹싱 (선택)

```
원본 오디오 volume=0.5 + BGM volume=0.5 → amix
→ 출력: final.mp4
```

---

## PART 6. 안정화

### [P0] 성능/UX 폴리시

```
- 페이지 전환 < 300ms, 스켈레톤 UI
- 이미지/영상 lazy load + blur 플레이스홀더
- 바텀탭 전환 애니메이션
- 스크롤 가상화 (피드 20개+)
- 골드 테마 일관성
- 에러/빈 상태 fallback UI
```

### [P1] v1.2 구현 상태 검증

```
footory.vercel.app 전수 검사 (브리핑 SECTION 6 체크리스트)
→ CURRENT-STATUS.md (되는것/안되는것/빠진것)
→ 크리티컬 이슈 수정
```

### [P2] 핵심 플로우 안정화

```
플로우 1: 카카오 로그인 → 역할 선택 → 온보딩 → 홈
플로우 2: 업로드 → 5스텝 편집 → 렌더 → 프로필 표시
플로우 3: 프로필 → 공유 → OG 이미지 정상
```

### [P3] 14세 미만 부모 동의

```
생년 판별 → 부모 이메일 동의 → 미동의 시 제한 모드
```

---

## PART 7. DB 스키마

### 신규 테이블

```sql
CREATE TABLE render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('clip', 'highlight')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'FAILED')),
  input_meta JSONB NOT NULL,
  output_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- input_meta (clip):
-- {
--   "raw_key": "raw/{userId}/{clipId}.mp4",
--   "trim_start": 3.0, "trim_end": 15.0,
--   "skill_labels": ["dribble", "goal"],
--   "custom_labels": ["발리슛"],
--   "spotlight": { "x": 0.48, "y": 0.42 },
--   "slowmo": { "start": 3.0, "end": 7.0, "speed": 0.5 },
--   "bgm_id": "energy_rush_01",
--   "effects": { "color_grade": true, "letterbox": true, "ea_fc_card": true, "intro_card": true }
-- }

-- input_meta (highlight):
-- {
--   "clips": [{ "clip_id": "uuid", "start": 0, "end": 12, "order": 1 }, ...],
--   "transition": "fade",
--   "include_intro": true,
--   "bgm_id": "cinematic_epic_02"
-- }

CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec INT NOT NULL,
  clip_ids UUID[] NOT NULL,
  transition TEXT DEFAULT 'cut',
  include_intro BOOLEAN DEFAULT true,
  bgm_id TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skill_labels (
  id TEXT PRIMARY KEY,
  label_ko TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('common','attack','defense','gk')),
  sort_order INT NOT NULL
);

CREATE TABLE bgm_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('energy','cinematic','victory','swag','focus')),
  file_key TEXT NOT NULL,
  duration_sec INT NOT NULL,
  sort_order INT NOT NULL
);
```

### 기존 테이블 변경

```sql
ALTER TABLE clips ADD COLUMN raw_key TEXT;
ALTER TABLE clips ADD COLUMN rendered_url TEXT;
ALTER TABLE clips ADD COLUMN render_job_id UUID REFERENCES render_jobs(id);
ALTER TABLE clips ADD COLUMN skill_labels TEXT[];
ALTER TABLE clips ADD COLUMN custom_labels TEXT[];
ALTER TABLE clips ADD COLUMN trim_start FLOAT;
ALTER TABLE clips ADD COLUMN trim_end FLOAT;
ALTER TABLE clips ADD COLUMN duration_sec INT;
ALTER TABLE clips ADD COLUMN spotlight_x FLOAT;
ALTER TABLE clips ADD COLUMN spotlight_y FLOAT;
ALTER TABLE clips ADD COLUMN slowmo_start FLOAT;
ALTER TABLE clips ADD COLUMN slowmo_end FLOAT;
ALTER TABLE clips ADD COLUMN slowmo_speed FLOAT DEFAULT 0.5;
ALTER TABLE clips ADD COLUMN bgm_id TEXT;
ALTER TABLE clips ADD COLUMN effects JSONB DEFAULT '{"color_grade":true,"letterbox":true,"ea_fc_card":true,"intro_card":true}';
```

---

## PART 8. 프로젝트 구조

### Next.js (Vercel) 신규 파일

```
src/
├── app/upload/page.tsx                # 업로드 풀스크린 (5 스텝)
├── components/video/
│   ├── VideoTrimmer.tsx               # Step 1: 트리밍
│   ├── SpotlightPicker.tsx            # Step 2: 주인공 터치
│   ├── SlowmoPicker.tsx               # Step 3: 슬로모션 구간
│   ├── SkillLabelPicker.tsx           # Step 4: 스킬 라벨
│   ├── BgmPicker.tsx                  # Step 4: BGM 선택
│   ├── EffectsToggle.tsx              # Step 4: 효과 토글
│   ├── UploadPreview.tsx              # Step 5: 프리뷰
│   ├── HighlightBuilder.tsx           # 하이라이트 릴 편집기
│   ├── ClipSelector.tsx               # 클립 선택 그리드
│   ├── ReelTimeline.tsx               # 릴 타임라인
│   └── RenderProgress.tsx             # 렌더링 대기 UI
├── lib/
│   ├── render-api.ts                  # Container 호출
│   ├── r2-upload.ts                   # presigned URL + 직접 업로드
│   ├── skill-labels.ts                # 스킬 라벨 데이터
│   └── bgm-tracks.ts                 # BGM 트랙 데이터
└── hooks/
    ├── useRenderJob.ts                # Realtime 구독
    ├── useVideoTrimmer.ts             # 트리밍 상태
    └── useAudioPreview.ts             # BGM 미리듣기
```

### Cloudflare Container (신규 — 같은 모노레포 또는 별도)

```
render-worker/
├── wrangler.jsonc                     # Container 설정 (이미지, 포트, 슬립 타임아웃)
├── src/
│   ├── index.ts                       # Worker (라우팅, R2 바인딩)
│   └── container/
│       ├── Dockerfile                 # FFmpeg + Node.js + NotoSansCJK-Bold
│       ├── server.ts                  # Express (잡 수신)
│       ├── pipeline/
│       │   ├── clip.ts                # 클립 렌더 (7 Pass 오케스트레이션)
│       │   ├── highlight.ts           # 하이라이트 릴 렌더
│       │   ├── color.ts               # Pass 1: 색보정 + 레터박스
│       │   ├── text.ts                # Pass 2: 텍스트 오버레이
│       │   ├── ring.ts                # Pass 3: 골드 링
│       │   ├── slowmo.ts              # Pass 4: 슬로모션
│       │   ├── intro.ts               # Pass 5: 인트로/아웃트로
│       │   ├── concat.ts              # Pass 6: 합본
│       │   └── bgm.ts                # Pass 7: BGM 믹싱
│       ├── r2.ts                      # R2 읽기/쓰기
│       ├── supabase.ts                # 상태 업데이트 + Realtime
│       └── assets/
│           ├── ring_gold.png          # 골드 링 (투명 배경)
│           └── fonts/
│               └── NotoSansCJK-Bold.ttc
└── package.json
```

---

## PART 9. 스프린트 계획

### Phase A: 안정화 (Sprint 27~30)

```
Sprint 27: v1.2 검증 + CURRENT-STATUS.md
Sprint 28: 크리티컬 버그 수정 + 핵심 플로우 안정화
Sprint 29: UX 폴리시 (스켈레톤, fallback, 애니메이션)
Sprint 30: 14세 미만 부모 동의
```

### Phase B: 영상 엔진 기반 (Sprint 31~33)

```
Sprint 31: Cloudflare Container 구축
  - Dockerfile (FFmpeg + Node.js + 폰트)
  - wrangler.jsonc (Container 설정)
  - Worker → Container 라우팅
  - R2 바인딩 (읽기/쓰기)
  - render_jobs 테이블 + API
  - presigned URL 업로드 플로우

Sprint 32: 트리밍 + 주인공 표시 + 기본 오버레이
  - VideoTrimmer, SpotlightPicker 컴포넌트
  - Pipeline Pass 1~3 (색보정 → 텍스트 → 링)
  - 업로드 플로우 (갤러리 → 트리밍 → 주인공 → 태그)
  - RenderProgress (Realtime + FCM 푸시)

Sprint 33: 스킬 라벨 + EA FC + 효과 토글
  - SkillLabelPicker, EffectsToggle 컴포넌트
  - skill_labels 마스터 데이터 시딩
  - 효과 ON/OFF에 따른 파이프라인 분기
```

### Phase C: 슬로모션 + BGM (Sprint 34~35)

```
Sprint 34: 슬로모션 리플레이
  - SlowmoPicker 컴포넌트 (구간 + 속도)
  - Pipeline Pass 4~6 (슬로모션 → 인트로/아웃트로 → 합본)
  - REPLAY 뱃지

Sprint 35: BGM
  - BgmPicker 컴포넌트 (카테고리 + 미리듣기)
  - bgm_tracks 테이블, R2 /bgm/ 업로드
  - Pipeline Pass 7 (BGM 믹싱)
  - 저작권 프리 음원 소싱
```

### Phase D: 하이라이트 릴 + QA (Sprint 36~37)

```
Sprint 36: 하이라이트 릴 + 통합
  - HighlightBuilder, ClipSelector, ReelTimeline
  - 릴 합본 파이프라인
  - Featured 연동, 공유, 3개 제한

Sprint 37: 전체 QA
  - E2E (업로드 → 전체 편집 → 프로필)
  - 하이라이트 릴 E2E
  - 안정화 재검증
  - 렌더 성능 테스트
  - Ralph Loop v1.3 업데이트
```

---

## PART 10. 미결 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| Container 인스턴스 타입 | ⏳ | dev/basic/standard 중 선택, 부하 테스트 후 |
| FFmpeg CRF값 | ⏳ | 18~23 사이 테스트 |
| 영상 출력 해상도 | ⏳ | 720p 고정 vs 원본 유지 |
| R2 원본 보관 기간 | ⏳ | /raw/ 30일 삭제? 영구? |
| BGM 음원 소싱 | ⏳ | 저작권 프리 라이브러리 선정 |
| 원형 링 해상도별 사이즈 | ⏳ | 다양한 입력 영상으로 테스트 |
| 릴 재편집 | → v1.5 | 삭제 후 재생성 |
| AI 하이라이트 추출 | → v2.0 | GPU 필요 |

---

## PART 11. UI 프로토타입

함께 첨부된 `footory-v13-prototype.html`을 브라우저에서 열면 인터랙티브 프로토타입을 확인할 수 있음.
이 프로토타입은 기획방에서 만들어서 UX 플로우를 검증한 것.

### 프로토타입에 포함된 화면

```
Step 1 — 트리밍: 양쪽 핸들 드래그, 구간 표시, 최소3초/최대60초
Step 2 — 주인공 표시: 필드 터치 → 골드 원형 링 + 네임태그 미리보기, 건너뛰기
Step 3 — 슬로모션: 구간 선택 바, 속도 선택 (0.5x/0.3x/0.25x), 결과 길이 계산
Step 4 — 태그+BGM+효과: 스킬 라벨 칩, BGM 카테고리 선택, 효과 토글 4개
Step 5 — 프리뷰: 오버레이 합성 상태, 총 길이, 업로드 버튼
하이라이트 — 클립 선택 그리드, 인트로 프리뷰, 60초 제한
렌더링 — 스피너 → 완료 체크 애니메이션
```

### 디자인 토큰 (프로토타입 기준)

```
배경:        #0C0C0E
카드:        #161618
골드 액센트:  #D4A853
텍스트:      #FAFAFA (주), #A1A1AA (보조), #71717A (비활성)
칩 기본:     #161618 border #2a2a2e
칩 선택:     #D4A853 (골드 배경, 검정 텍스트)
슬로모 액센트: #7F77DD (퍼플)
스텝 바:     #1E1E22 (비활성), #D4A853 (활성), #5A4A2A (완료)
버튼 골드:   #D4A853 배경, #0C0C0E 텍스트
버튼 아웃라인: transparent 배경, #D4A853 테두리+텍스트
토글 ON:     #D4A853
border-radius: 칩 20px, 카드 10px, 버튼 10px, 비디오 10px
```

### 컴포넌트 구현 시 참고사항

```
- 프로토타입은 430px 모바일 뷰포트 기준
- 실제 구현은 React (Next.js) + Tailwind CSS
- 프로토타입의 CSS 클래스명과 구조를 참고하되, Tailwind으로 변환
- 영상 프리뷰 영역은 프로토타입에서 Canvas로 축구장을 그렸지만,
  실제로는 <video> 태그로 원본 영상 프리뷰
- 드래그 핸들 (트리밍, 슬로모션)은 touch 이벤트 필수 (모바일 PWA)
```

---

## PART 12. 로드맵

```
v1.0 (완료): 4탭, 프로필, 피드, 팀
v1.1 (완료): 5탭, MVP 투표, 탐색, 팔로우
v1.2 (구현됨, 검증 필요): 소셜 엔진 (알림+DM+포트폴리오+챌린지)
v1.3 (현재): 영상 엔진 (트리밍+슬로모+주인공+오버레이+BGM+하이라이트릴) + 안정화
v1.5: 그룹 DM, Before&After, 릴 재편집, AI 음악 생성
v2.0: AI 하이라이트 추출, 풋메이트, 팀 인증
v2.5: 팀 배틀, 대회 연동
v3.0: 수익화
```