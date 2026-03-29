# RecordsTab 퍼센타일 통합 설계

**날짜**: 2026-03-29
**상태**: 승인됨

---

## 배경

`RecordsTabV5`의 `PhysicalTestCard`는 수치·델타만 표시하고 맥락 정보(동나이 대비 내 위치)가 없다. 반면 `GrowthCard`(공개 프로필 전용)에는 퍼센타일 바·등급 뱃지·동나이 평균 비교가 이미 구현되어 있다. 내 프로필 스탯 탭에도 동일한 정보를 노출해 "기록 → 맥락 → 동기부여 → 재기록" 루프를 완성한다.

---

## 목표

- `PhysicalTestCard`에 퍼센타일 바 + 등급 뱃지 + 동나이 평균 비교 텍스트 추가 (Option C)
- 데이터 소스: 기존 `/api/stats/percentile` API (변경 없음)
- 코드 추가는 최소화 — 기존 `getPercentileTier()`, `PERCENTILE_TIERS` 재사용

---

## 비기능 요구사항

- 퍼센타일 API는 스탯 탭 **첫 활성화 시 1회만** fetch (이후 캐시)
- peerCount < 3: "데이터 수집 중" 표시 (실제 퍼센타일 미표시)
- 로딩 중: 바 영역 shimmer 스켈레톤
- 퍼센타일 데이터 없음(API 실패 등): 기존 카드 그대로 표시 (graceful degradation)

---

## 데이터 흐름

```
app/profile/page.tsx
  ├─ useState: percentileData (null | PercentileResponse), percentileLoading (bool)
  ├─ useEffect: activeTab === "records" && !percentileData
  │    → fetch /api/stats/percentile
  │    → setPercentileData(result)
  └─ RecordsTabV5에 props로 전달

RecordsTabV5
  └─ PhysicalTestCard (stat별 percentile, ageAvg, peerCount 전달)
```

### PercentileResponse 타입 (기존 API 응답 그대로)

```ts
{
  percentiles: Record<string, number>   // statType → 0~100
  ageAvgs: Record<string, number>       // statType → 동나이 평균값
  peerCounts: Record<string, number>    // statType → 비교 선수 수
  ageGroup: string                      // "u10" | "u12" | "u15" | "u18" | "adult"
}
```

---

## UI 변경: PhysicalTestCard

### 추가되는 UI 블록 (기존 카드 하단)

```
[퍼센타일 바 ─────────|─────] [💎 최상위]    ← 바 + 뱃지 행
동나이 평균 6.8초 · 상위 22%                ← 텍스트 행 (9px, --color-text-3)
```

### 상태별 렌더링

| 상태 | 표시 |
|------|------|
| `percentileLoading === true` | 바 영역 shimmer (w-full h-[7px] animate-pulse) |
| `peerCount < 3` | "데이터 수집 중" (9px, --color-text-3) |
| `percentile >= 50` (tier 있음) | 바 + 뱃지 + 동나이 평균 텍스트 |
| `percentile < 50` (tier null) | 바 + "성장 중" 텍스트 + 동나이 평균 텍스트 |
| 퍼센타일 없음 (no data) | 아무것도 추가 안 함 |

### 뱃지 색상 (기존 PERCENTILE_TIERS 그대로)

| 등급 | 조건 | 색 |
|------|------|----|
| 💎 최상위 | ≥ 90 | gold (#D4A853) |
| 🥇 뛰어남 | ≥ 75 | gold |
| 🥈 우수 | ≥ 50 | silver (#A1A1AA) |
| (없음) | < 50 | — "성장 중" 텍스트 |

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/components/profile/RecordsTabV5.tsx` | 수정 | props 추가, PhysicalTestCard에 퍼센타일 UI 통합 |
| `src/app/profile/page.tsx` | 수정 | 퍼센타일 fetch 로직 + RecordsTabV5에 props 전달 |

---

## 범위 밖

- 공개 프로필(`/p/[handle]`)의 `GrowthCard` 변경 없음
- `/api/stats/percentile` API 변경 없음
- `InfoTab` 변경 없음
