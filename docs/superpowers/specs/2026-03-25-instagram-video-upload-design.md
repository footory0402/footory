# 인스타그램 스타일 영상 + 업로드 개편

> 날짜: 2026-03-25
> 상태: 확정

## 배경

- `EffectsToggle`, `SkillLabelPicker`가 `_future` 폴더에 방치 — 업로드 플로우에 미연결
- `ProfileRadar`가 V5 리디자인 후 페이지에서 누락
- 영상 플레이어가 바텀 시트 방식 — 인스타그램/틱톡 같은 몰입감 없음
- 꾸미기 효과(색보정 등)를 켜도 실제 영상에 반영 안 됨

## 확정 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 영상 플레이어 | 세로 전체화면, 위아래 스와이프 | 인스타 릴스/틱톡과 동일한 UX |
| 업로드 플로우 | 나찾기 + 꾸미기 + 간단태그 | 스킬라벨 제거, 심플하게 |
| 꾸미기 방식 | CSS 오버레이 (FFmpeg 없음) | 업로드 속도 무영향, 이미 VideoOverlay 있음 |
| 레이더 차트 | 제거 | 하지 않기로 결정 |
| 가로 영상 처리 | 블러 배경 | 인스타그램 방식, 잘림 없음 |

---

## 1. 세로 전체화면 영상 플레이어

### 현재
`ClipPlayerSheet` — 바텀 시트, 좌우 스와이프

### 변경
기존 `ClipPlayerSheet`를 **전체화면 세로 플레이어**로 교체.

```
┌─────────────────────┐
│ ‹                   │  ← 좌상단 닫기
│                     │
│   [블러 배경]        │
│  ┌───────────────┐  │
│  │               │  │
│  │  원본 영상     │  │  ← object-fit: contain
│  │  (비율 유지)   │  │
│  │               │  │
│  └───────────────┘  │
│                  ❤️  │
│  김민준 · MF     💬  │  ← 하단 정보 오버레이
│  드리블 #1v1돌파  ↗️  │
└─────────────────────┘
```

### 인터랙션
- 진입: 피드 카드 탭 → 전체화면 슬라이드업 (300ms ease-out)
- 다음/이전: **위아래 스와이프** (`transform: translateY` 기반)
- 닫기: 좌상단 ← 버튼 또는 아래로 빠르게 스와이프 (velocity > 500px/s)
- 재생/일시정지: 영상 탭

### 가로 영상 처리 (블러 배경)
```css
/* 배경: 영상을 블러로 확대해 채움 */
.video-backdrop {
  position: absolute; inset: 0;
  background-image: url(썸네일);
  background-size: cover;
  filter: blur(20px) brightness(0.4);
  transform: scale(1.1); /* 블러 엣지 숨김 */
}
/* 영상: 원본 비율 유지 */
video {
  position: relative; z-index: 1;
  width: 100%; height: 100%;
  object-fit: contain;
}
```

### VideoOverlay 통합
기존 `VideoOverlay` (스포트라이트 링 + 네임태그) 그대로 합성. `spotlight_x/y` null 시 오버레이 없음.

### 파일 변경
| 파일 | 변경 |
|------|------|
| `src/components/player/ClipPlayerSheet.tsx` | 전체화면 레이아웃으로 교체, 블러 배경 추가, 위아래 스와이프 |
| `src/components/feed/FeedCard.tsx` | 탭 시 전체화면 플레이어 진입 트리거 |

---

## 2. 업로드 플로우 개편

### 확정 구성 (위에서 아래 순서)

```
파일 선택
  ↓ (파일 선택 후 표시)
① 나 찾기 (SpotlightPicker) — 주인공 위치 탭
② 꾸미기 (EffectsToggle) — 4개 토글
③ 간단 태그 — 최대 2개 (득점/드리블/수비 등)
④ 메모 — 한줄 (선택)
⑤ 올리기 버튼
```

### 제거 항목
- `SkillLabelPicker` — 업로드 페이지에서 완전 제거 (오늘 추가된 것 되돌리기)
- upload-store의 `skillLabels`, `customLabels` setter — 사용하지 않음 (store 필드는 유지)

### EffectsToggle — CSS 오버레이 방식
효과는 FFmpeg으로 영상을 굽지 않고 **재생 시 CSS로 합성**한다.

| 효과 | CSS 구현 |
|------|---------|
| 색보정 | `filter: saturate(1.2) contrast(1.05) brightness(1.02)` |
| 시네마틱바 | 위아래 `position: absolute` 검은 바 (height: 10%) |
| EA FC 카드 | 하단 네임태그 카드 스타일 강화 (VideoOverlay 확장) |
| 인트로 | 기존 2초 인트로 애니메이션 유지 |

효과 데이터 저장: `clips` 테이블에 `effects JSONB` 컬럼 추가 (섹션 5 참조).
재생 시 `VideoOverlay`가 `effects` 값을 읽어 CSS 적용.

### 파일 변경
| 파일 | 변경 |
|------|------|
| `src/app/upload/page.tsx` | SkillLabelPicker 제거, 순서 정리 |
| `src/components/video/EffectsToggle.tsx` | 유지 (이미 연결됨) |
| `src/components/video/VideoOverlay.tsx` | effects prop 추가, CSS 필터/시네마틱바 적용 |
| `src/components/player/ClipPlayerSheet.tsx` | effects 데이터 전달 |
| `src/app/api/clips/route.ts` | effects 저장 |
| `src/lib/server/feed.ts` | feed 응답에 effects 포함 |

---

## 3. 레이더 차트 — 제거

오늘 `RecordsTabV5`에 추가된 `ProfileRadar` import 및 렌더 코드 되돌리기.

### 파일 변경
| 파일 | 변경 |
|------|------|
| `src/components/profile/RecordsTabV5.tsx` | ProfileRadar import 및 렌더 제거 |

---

## 4. 변경하지 않는 것

- `VideoOverlay` 기본 구조 (스포트라이트 링 + 네임태그) — 확장만
- `SpotlightPicker` — 유지
- 업로드 인프라 (R2, 압축, presign) — 안 건드림
- `ClipPlayerSheet` 에러 처리/preload 로직 — 유지
- 피드 카드 레이아웃 — 유지 (탭해서 전체화면 진입만 추가)

---

## 5. DB 변경

| 테이블 | 변경 |
|--------|------|
| `clips` | `effects JSONB DEFAULT '{}'` 컬럼 추가 |

마이그레이션: `supabase/migrations/023_clips_effects_column.sql`

---

## 6. 구현 순서

1. **레이더 제거** (RecordsTabV5) — 되돌리기
2. **SkillLabelPicker 제거** (upload/page.tsx) — 되돌리기
3. **DB 마이그레이션** — effects 컬럼 추가
4. **VideoOverlay 확장** — effects CSS 적용
5. **업로드 플로우** — effects → clips API → DB 저장
6. **전체화면 플레이어** — ClipPlayerSheet 교체 (가장 큰 작업)
