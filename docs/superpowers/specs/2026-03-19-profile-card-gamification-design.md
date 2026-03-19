# 프로필 카드 게이미피케이션 — 디자인 스펙

> 날짜: 2026-03-19
> 상태: 확정 (리뷰 반영 v2)

---

## 1. 목표

프로필 페이지의 ProfileCard에 헥사곤 레이더 차트 + 실측 스탯을 통합하여, 피파/FM 스타일의 "선수 카드" 느낌을 주는 게이미피케이션 요소를 추가한다. 프로필을 열었을 때 첫인상에서 즉각적인 시각적 임팩트를 제공한다.

## 2. 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 스탯 표현 방식 | 헥사곤 레이더 차트 (FM 스타일) |
| 데이터 소스 | 실측 데이터 (`MEASUREMENTS` 기반 — 50m, 1000m, 서전트점프 등) |
| 배치 위치 | ProfileCard 내부에 통합 (하나의 카드 단위) |
| 레이아웃 | 레이더(좌) + 스탯 리스트(우) 사이드 바이 사이드 |
| 카드 스타일 | 골드 글로우 고정 — 레벨별 분기 없음 (v1 범위, 추후 레벨별 카드 진화 고려 가능) |
| 종합 점수 | 없음 (피파와 차별화) |
| 법적 안전 | 독자 디자인 (라운드 직사각형, 자체 색상/약어/구조) |

## 3. 카드 구조

```
┌──────────────────────────────────────┐
│ [골드 conic-gradient 보더 글로우]     │
│ ┌──────────────────────────────────┐ │
│ │ FW          [⭐ Lv.4] [MVP ×3]  │ │  ← 포지션(좌상) + 레벨/MVP(우상)
│ │ 포워드                           │ │
│ │                                  │ │
│ │      (선수 사진 영역 230px)       │ │  ← 배경: radial gradient + pitch 패턴
│ │                                  │ │
│ │ 배준혁                           │ │  ← 이름 (26px, 900, 사진 위 오버레이)
│ │ @junhyuk · 부산IP U-15 · 2011   │ │  ← 핸들 + 팀 + 출생
│ │ [168cm] [52kg] [오른발]          │ │  ← 신체정보 필 뱃지 (반투명 배경)
│ ├──── ═══════ 골드 디바이더 ═══════ ┤ │  ← shimmer 애니메이션
│ │                                  │ │
│ │  ┌────────┐  속도    7.2초 ▲0.3  │ │
│ │  │ 헥사곤  │  지구력   4:30  ▲10  │ │
│ │  │ 레이더  │  폭발력   42cm ▲3   │ │  ← 레이더(130px) + 스탯 리스트(우)
│ │  │ 차트    │  근력    35회  ▲5   │ │
│ │  │ 130px  │  킥력    78km/h ▲3  │ │
│ │  └────────┘  컨트롤  120회  ▲20  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    127     │      84     │    1.2k   │  ← 소셜 카드 (분리, 세로 구분선)
│   팔로워    │    팔로잉    │    조회    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  [🎬 영상]  [📋 기록]                │  ← 기존 탭 바
└──────────────────────────────────────┘
```

## 4. 디자인 상세

### 4.1 카드 보더

- `conic-gradient` 골드 보더 (2px, 각도별 밀도 차이)
- `box-shadow: 0 0 50px rgba(212,168,83,0.05)`
- `inset 0 1px 0 rgba(245,215,142,0.08)` 상단 하이라이트
- 필름 그레인 오버레이 (fractalNoise SVG, mix-blend-mode: overlay)

### 4.2 사진 영역 (230px)

- 배경: `radial-gradient` 골드 하이라이트 + pitch line 패턴 (10px 간격)
- 하단 80% cinematic fade (`bg-primary`로 페이드)
- 이름/메타/신체정보는 사진 위 오버레이 (z-index: 3)
- 사진 미등록 시: 축구공 아이콘 placeholder (opacity 0.04)

### 4.3 포지션/레벨/MVP 뱃지

- 포지션 (좌상): Oswald 32px bold, 골드, text-shadow 글로우
- 레벨 (우상): pill 형태, backdrop-blur, 골드 보더
- MVP (우상 레벨 아래): Rajdhani 8px, 골드, 작은 뱃지 — mvpCount > 0일 때만 표시

### 4.4 이름 영역

- 이름: Noto Sans KR 26px 900 weight
- 메타: 11px, handle(#A1A1AA) · 팀 · 출생 (dot 구분)
- 신체정보: 반투명 pill 뱃지 (`rgba(255,255,255,0.06)`, backdrop-blur)
  - 168cm / 52kg / 오른발
  - 값이 없는 항목은 해당 pill 숨김

### 4.5 골드 디바이더

- 1px 골드 gradient 라인
- 중앙 48px 두꺼운 accent bar (7색 골드 gradient + box-shadow)
- shimmer 애니메이션 (4초 주기)

### 4.6 스탯 섹션

**레이더 차트 (좌, 130px)**
- 6각형 3단 그리드 + 축선
- 데이터 폴리곤: radialGradient 채움 + 골드 stroke 1.3px
- 꼭짓점: 3px 골드 도트 + 6px 링 글로우
- 라벨: 한국어 (`RADAR_STATS`의 `shortLabel` 사용)
- 진입 애니메이션: scale 0.75 → 1 + rotate -8° → 0° (0.9s)
- SVG에 `role="img"` + `aria-label="선수 능력치 레이더 차트"` 추가

**스탯 리스트 (우)**
- 6행, padding 3.5px (컴팩트)
- 라벨: Rajdhani 10px, #52525B (`RADAR_STATS`의 `label` 사용)
- 수치: Oswald 16px, #FAFAFA (가장 최근 측정값)
- 단위: Rajdhani 8px, #3F3F46 (`MEASUREMENTS`의 `unit` 사용)
- 변화량: 직전 측정값(`previousValue`)과의 차이
  - `lowerIsBetter`인 항목(속도, 지구력): 값 감소 = 향상(▲ 초록), 값 증가 = 하락(▼ 빨강)
  - 그 외: 값 증가 = 향상(▲ 초록)
  - 직전 측정값 없으면 변화량 숨김 (— 표시하지 않음)
- 진입 애니메이션: slideR (0.35s, 순차 delay 0.05s)

### 4.7 소셜 카드 (분리)

- 카드 밖 독립 영역 (margin-top: 10px)
- `background: bg-card`, `border: 1px solid rgba(255,255,255,0.04)`, `border-radius: 12px`
- 3열: 팔로워 | 팔로잉 | 조회
- 항목 간 세로 구분선 (`1px solid rgba(255,255,255,0.06)`)
- 숫자: Oswald 16px, 라벨: 9px #52525B

### 4.8 레이더 차트 데이터 매핑

기존 `RADAR_STATS` (constants.ts)를 **그대로 사용**한다.

| 축 id | 한국어 라벨 | statType (MEASUREMENTS) | 단위 | lowerIsBetter |
|--------|-----------|------------------------|------|---------------|
| speed | 속도 | sprint_50m | 초 | ✅ |
| endurance | 지구력 | run_1000m | 분:초 | ✅ |
| agility | 폭발력 | sargent_jump | cm | ❌ |
| power | 근력 | push_ups | 회 | ❌ |
| flexibility | 킥력 | kick_power | km/h | ❌ |
| control | 볼컨트롤 | juggling | 회 | ❌ |

- 레이더 값 정규화: 기존 `radar-calc.ts`의 `calcRadarStats()` 로직 그대로 사용 (STAT_BOUNDS 기반 0~100)
- 측정 데이터가 없는 축은 중앙(0)으로 표시

### 4.9 빈 데이터 처리

| 상황 | 동작 |
|------|------|
| 측정 데이터 0개 (신규 가입) | 스탯 섹션 전체를 빈 상태 CTA로 대체: "첫 기록을 측정해보세요" (accent-bg 배경 + 골드 버튼) |
| 1~2축만 데이터 있음 | 레이더 표시 (찌그러진 형태 허용), 미측정 축은 0으로 |
| 3축 이상 데이터 있음 | 정상 표시 |
| 사진 없음 | 축구공 placeholder 아이콘 |
| 팀 없음 | 메타에서 팀 항목 숨김 |
| 키/몸무게/주발 미입력 | 해당 pill 숨김 |

## 5. 변경 범위

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/player/ProfileCard.tsx` | **전면 재작성** — 수평 레이아웃 → 수직 카드 레이아웃 (사진→이름→디바이더→스탯), conic-gradient 보더, 필름 그레인, 신체정보 pill 이동, 소셜 바 제거 |
| `src/components/player/ProfileRadar.tsx` | **신규** — 프로필 전용 SVG 헥사곤 레이더 (골드 테마, 글로우 도트, 애니메이션) |
| `src/components/player/ProfileStatList.tsx` | **신규** — 스탯 리스트 6행 (변화량 포함, lowerIsBetter 방향 처리) |
| `src/components/player/SocialCard.tsx` | **신규** — 분리된 소셜 지표 카드 (세로 구분선 포함) |
| `src/styles/globals.css` | shimmer, radarIn, slideR 애니메이션 키프레임 추가 |
| `src/app/(main)/profile/page.tsx` | ProfileCard 아래 SocialCard 배치, useStats 데이터 전달 |
| `src/app/p/[handle]/page.tsx` | 공개 프로필에서도 동일한 카드 사용 (읽기 전용) |

### 재활용

- `src/lib/radar-calc.ts` — `calcRadarStats()` 정규화 로직 그대로 사용 (변경 없음)
- `src/lib/constants.ts` — `RADAR_STATS`, `MEASUREMENTS`, `STAT_BOUNDS` 그대로 사용
- `src/hooks/useStats.ts` — 측정 데이터 fetch 로직
- `src/components/player/RadarChart.tsx` — hexPoint 계산 유틸 참조 가능

## 6. 기존 기능과의 관계

- InfoTab의 RadarChart는 유지 (기록 탭에서 상세 보기용)
- ProfileCard 내 레이더는 "요약 미리보기" 역할 (탭 전환 없이 첫인상)
- 기존 ProfileCard는 **전면 재작성** — 기존 아바타+우측 수평 레이아웃에서 세로 카드 레이아웃으로 변경
- 신체정보(키/몸무게/주발)는 이름 아래 pill 형태로 이동
- 소셜(팔로워/팔로잉/조회)은 카드 밖 독립 SocialCard로 분리
- 공개 프로필(`/p/[handle]`)에서도 동일 카드 사용

### 성능 고려

- 필름 그레인 SVG는 CSS `background-image`로 인라인하여 추가 네트워크 요청 없음
- conic-gradient + shimmer는 CSS-only, JS 부담 없음
- 레이더 SVG는 경량 (path 6개 + circle 12개)
- 모바일 저사양 기기: 필름 그레인을 `@media (prefers-reduced-motion)`에서 제거 가능

## 7. 목업 참조

`/.superpowers/brainstorm/68827-1773924399/card-final-v4.html`
