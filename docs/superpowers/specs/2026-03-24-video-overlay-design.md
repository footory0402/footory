# Video Overlay — Spotlight Ring + EA FC Nametag

> 영상 업로드 시 주인공 선수를 지정하면, 재생 시작 1초 동안 스포트라이트 링과 네임태그를 CSS 오버레이로 표시하는 기능.

## 배경

유소년 축구 영상에서 "이 영상의 주인공이 누구인지" 즉시 전달하는 시각적 장치가 필요하다.
서버 사이드 영상 가공(FFmpeg) 없이, HTML/CSS 오버레이로 구현하여 업로드 속도에 영향을 주지 않는다.

## 확정 요구사항

| 항목 | 결정 |
|------|------|
| 실행 환경 | HTML/CSS 오버레이 (원본 영상 무변환) |
| 꾸미기 요소 | 스포트라이트 링 + EA FC 네임태그 |
| 스타일 | 볼드 (글로우 링 + ▼ 화살표 + 팀배지 풀카드) |
| 표시 시간 | 영상 시작 1초 → 페이드아웃 |
| 네임태그 정보 | 이름(한글) + 포지션 + 연령대 + 팀명 + 팀배지(이니셜) |
| 등번호 | 제외 |
| 업로드 UX | 기존 2단계 태그/메모 화면에 통합, optional |
| 데이터 저장 | 기존 clips.spotlight_x / spotlight_y 컬럼 활용 |

## 1. 데이터 모델

### 기존 스키마 활용 — DB 변경 없음

clips 테이블에 `spotlight_x` (number, nullable)과 `spotlight_y` (number, nullable) 컬럼이 이미 존재한다.
upload-store.ts에도 `spotlightX`, `spotlightY`, `setSpotlight()` 이미 구현됨.
upload-service.ts에서 API로 전달하는 로직도 이미 있음.

**따라서 DB 마이그레이션 불필요. 기존 필드를 그대로 사용한다.**

```typescript
// 기존 clips 테이블 필드
spotlight_x: number | null;  // 0~1 비율 (탭 위치 / 영상 너비)
spotlight_y: number | null;  // 0~1 비율 (탭 위치 / 영상 높이)
```

네임태그에 표시되는 이름/포지션/연령대/팀명은 clips에 저장하지 않는다.
재생 시 선수 프로필에서 실시간 조회하여 프로필 수정 시 과거 영상에도 자동 반영.

### 네임태그 데이터 소스

- **이름(name)**: FeedItemEnriched.playerName (이미 포함)
- **포지션(position)**: FeedItemEnriched.playerPosition (이미 포함)
- **팀명(teamName)**: FeedItemEnriched.teamName (이미 포함, nullable)
- **연령대(ageGroup)**: players.birth_year에서 계산 → feed API 응답에 `birth_year` 추가 필요
- **팀 이니셜(teamInitial)**: teamName에서 파생 (컴포넌트에서 계산, 예: "서울 FC" → "서울")

## 2. 업로드 UX 플로우

기존 2단계 태그/메모 화면에 통합. 별도 단계 추가 없음.

```
┌─────────────────────────────┐
│  ◀ 영상 업로드              │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [영상 프리뷰]         │ │
│ │    썸네일 위 탭 가능     │ │
│ │    "주인공 위치를 탭하세요"│ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  태그 선택 (최대 2개)        │
│  [드리블] [슈팅] [패스] ...  │
│                             │
│  메모                       │
│  [________________________] │
│                             │
│  ┌─────────────────────┐    │
│  │      올리기          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### SpotlightPicker — 기존 _future/ 코드 활용

`src/components/video/_future/SpotlightPicker.tsx`에 153줄짜리 구현이 이미 존재한다.
(프레임 캡처 + 포인터 이벤트 + 네임태그 미리보기 + 초기화 버튼)
이 파일을 `src/components/upload/SpotlightPicker.tsx`로 이동 후 볼드 스타일에 맞게 보강한다.

**인터랙션:**

1. 영상 프리뷰(썸네일)를 표시 — VideoSelector에서 이미 생성한 썸네일 재활용
2. 프리뷰 위 힌트 텍스트: "주인공 위치를 탭하세요" (반투명, 탭 시 사라짐)
3. 탭 → 탭한 위치에 골든 링 미리보기 표시 (볼드 스타일)
4. 다시 탭 → 위치 변경 (마지막 탭 위치만 유지)
5. 링 옆 X 버튼으로 제거 가능 (오버레이 취소)
6. 안 탭하면 spotlight_x/y = null → 기존대로 업로드
7. 좌표는 upload-store의 `setSpotlight(x, y)`로 저장 (이미 구현됨)

좌표 계산: `x = offsetX / element.clientWidth`, `y = offsetY / element.clientHeight` (0~1 비율)

## 3. 재생 오버레이 컴포넌트

### VideoOverlay

```typescript
interface VideoOverlayProps {
  spotlight: { x: number; y: number };
  player: {
    name: string;
    position?: string;    // nullable — 없으면 생략
    ageGroup?: string;    // birth_year에서 계산, 없으면 생략
    teamName?: string;    // nullable — 없으면 팀배지/팀명 숨김
  };
}
```

### 시각적 구성 — 볼드 스타일

**스포트라이트 링:**
- 3.5px 골드(#D4A853) 원형 border, 지름 64px
- radial-gradient 내부 글로우
- box-shadow 외부 글로우 (pulse 애니메이션)
- ▼ 화살표 (골드, drop-shadow, bounce 애니메이션)

**네임태그 카드:**
- 하단 중앙, 너비 82%, max-width 320px (가로 영상 대응)
- 배경: rgba(15,15,18,0.92) + backdrop-filter blur(12px)
- border: 1.5px solid rgba(212,168,83,0.35)
- 둥근 모서리 12px
- 내부 구성:
  - 좌측: 팀배지 (36px 원형, 골드 그라디언트, 이니셜 텍스트) — 팀 없으면 숨김
  - 우측 상단: 이름 (Noto Sans KR 15px bold)
  - 우측 하단: 포지션 · 연령대 · 팀명 (11px, #A1A1AA) — 없는 항목은 생략, 구분자(·) 자동 조정

### 애니메이션 타임라인 (총 1초)

```
0ms     200ms    600ms    800ms   1000ms
│        │        │        │        │
├─ 링 등장 (scale 0→1, 200ms ease-out)
│        │        │        │        │
│        ├─ 화살표 바운스 시작 (600ms 동안)
│        │        │        │        │
│        ├─ 네임태그 슬라이드업 (200ms ease-out)
│        │        │        │        │
│        │        │        ├─ 전체 페이드아웃 (200ms)
│        │        │        │  opacity 1→0
│        │        │        │        │
│        │        │        │        ├─ visibility:hidden
```

### CSS 구현 핵심

- `pointer-events: none` — 오버레이가 영상 컨트롤 방해 안 함
- `will-change: opacity, transform` — GPU 가속
- `animation-fill-mode: forwards` — 페이드아웃 후 상태 유지
- `position: absolute` + `inset: 0` — 영상 크기에 자동 맞춤
- 좌표는 percentage 기반 → 어떤 해상도에서도 동일 위치

### 애니메이션 리트리거

React `key` prop 패턴을 사용:
- 영상 `play` 이벤트에서 `playCount` state를 증가
- `<VideoOverlay key={playCount} ... />` → key 변경 시 컴포넌트 재마운트 → 애니메이션 자동 리트리거
- autoplay + muted 자동재생 시에도 동일하게 동작

### 렌더링 조건

- `spotlight_x === null` → 오버레이 없음 (기존 영상 그대로)
- `spotlight_x !== null` → 재생 시작 시 1초 인트로 표시

### 엣지 케이스 처리

| 케이스 | 처리 |
|--------|------|
| 팀 없는 선수 | 팀배지 숨김, 네임태그에 이름 + 포지션만 표시 |
| 포지션 없는 선수 | 하단 텍스트에서 포지션 생략, 나머지만 표시 |
| 가로 영상 (landscape) | 네임태그 max-width: 320px로 과도한 확장 방지 |
| 스포트라이트가 가장자리 (x>0.9, y<0.1 등) | 링은 overflow:visible로 표시, 잘리지 않음 |
| 부모 업로드 시 | 선택된 자녀의 프로필 정보를 네임태그에 표시 |

## 4. 파일 구조

### 새로 만드는 파일 (1개)

| 파일 | 역할 |
|------|------|
| `src/components/video/VideoOverlay.tsx` | 재생 오버레이 (링+네임태그+애니메이션) |

### 이동하는 파일 (1개)

| 원본 | 이동 후 | 변경 |
|------|---------|------|
| `src/components/video/_future/SpotlightPicker.tsx` | `src/components/upload/SpotlightPicker.tsx` | 볼드 스타일 적용, 힌트 텍스트 추가 |

### 수정하는 파일 (3개)

| 파일 | 변경 내용 |
|------|----------|
| `src/app/upload/page.tsx` | SpotlightPicker를 태그/메모 화면에 통합 |
| `src/components/player/ClipPlayerSheet.tsx` | 영상 재생 부분에 VideoOverlay 합성 (실제 `<video>` 재생 컴포넌트) |
| `src/lib/server/feed.ts` | feed API 응답에 `birth_year` 추가 (연령대 계산용) |

### 수정하지 않는 파일

- `src/lib/upload-service.ts` — spotlight_x/y 전달 이미 구현됨
- `src/stores/upload-store.ts` — spotlightX/Y, setSpotlight() 이미 구현됨
- `src/app/api/clips/route.ts` — spotlight_x/y insert 이미 구현됨
- `src/lib/supabase/database.ts` — spotlight_x/y 타입 이미 존재
- 기존 압축/프리사인 플로우 전혀 안 건드림

**DB 마이그레이션 불필요** — spotlight_x/y 컬럼 이미 존재.

## 5. 점진적 확장

VideoOverlay가 공통 컴포넌트이므로, ClipPlayerSheet 외에 다른 영상 재생 위치에 점진적으로 적용 가능:

- 프로필 하이라이트 탭
- MVP 투표 카드
- 공개 프로필 (p/[handle])
- 팀 피드

각 위치에서 `spotlight_x/y`와 선수 정보를 VideoOverlay에 전달하기만 하면 됨.

## 6. 성능 영향

| 항목 | 영향 |
|------|------|
| 업로드 속도 | 제로 (원본 영상 무변환, 기존 필드 활용) |
| 번들 사이즈 | ~2KB (CSS 애니메이션 + 작은 React 컴포넌트) |
| 재생 성능 | CSS GPU 가속, pointer-events:none, 1초 후 visibility:hidden |
| DB | 변경 없음 (기존 컬럼 활용) |
| API | feed 응답에 birth_year 1개 추가 |
