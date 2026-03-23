# 프로필 UX 개선 설계 (B안 + 완성도 가이드)

> 작성일: 2026-03-23
> 범위: 인증 시스템 단순화 + 탭 명칭/역할 명확화 + HeroSection 개선 + 빈 상태 개선 + 프로필 완성도 가이드
> 대상 화면: `/profile` (내 프로필), `/p/[handle]` (공개 프로필)

---

## 배경 & 문제 정의

### 사용자 혼란 요인 (3가지 관점)

**UI/UX 전문가:**
- "기록" 탭 이름이 모호 — 사용자는 골/어시스트를 기대하지만 실제론 신체 수치
- VerifyBadge (팀인증/자기기록)가 UI에만 있고 실제 플로우 없음
- HeroSection 편집 버튼이 카드 하단에 묻혀 발견성 낮음
- 프로필 완성도 지표 없어 신규 선수가 무엇을 채워야 할지 모름

**유소년 선수:**
- 스탯 추가 방법 불명확 (어디를 탭해야 시트가 열리는지)
- 대표 영상 설정이 숨겨져 있음
- 플레이스타일 테스트 존재 자체를 모름

**스카우터:**
- 공개 프로필 진입 시 핵심 스탯이 탭 내부에 있어 바로 못 봄
- 팀 인증 없어지면 기록 신뢰 근거 필요

### 결정사항
- 팀 인증 시스템: **현재 단계에서 제거** (코치/팀 관리자 생태계 갖춰지기 전에 도입 시 혼란만 가중)
- DB 필드(`verified`, `verified_by`, `verified_at`, `source`)는 유지 — 향후 재활성화 가능
- 탭 구조 3개는 유지 (하이라이트/기록→스탯/커리어)

---

## 섹션 1: 인증 시스템 단순화

### 제거 대상
| 위치 | 제거 항목 |
|------|---------|
| `src/components/profile/VerifyBadge.tsx` | 컴포넌트 전체 삭제 |
| `RecordsTabV5.tsx` | VerifyBadge import, 범례(legend) div 제거 |
| `CareerTabV5.tsx` | VerifyBadge import, 모든 `<VerifyBadge>` 사용 제거 |
| `TournamentRecord`, `AwardRecord` 타입 | `source`, `verifier` 필드 제거 (또는 사용하지 않음) |

### 유지 항목
- DB 컬럼: `stats.verified`, `stats.verified_by`, `stats.verified_at`
- DB 컬럼: `seasons.source`, `achievements.source`
- 알림 타입: `verify_request`, `verified` (미사용 상태로 유지)
- `VerifyBadge.tsx` 파일: 삭제 또는 주석 처리 후 보존

---

## 섹션 2: 탭 명칭 & 역할 명확화

### 탭 이름 변경
| 현재 표시 | 변경 표시 | 내부 키 | 설명 |
|---------|---------|--------|------|
| 하이라이트 | 하이라이트 | `"highlights"` | 변경 없음 |
| 기록 | 스탯 | `"records"` | **표시 라벨만 변경, 타입/키는 그대로** |
| 커리어 | 커리어 | `"career"` | 변경 없음 |

> ⚠️ `ProfileTabKey` 타입(`"highlights" | "records" | "career"`)은 변경하지 않음.
> `profile/page.tsx`, `p/[handle]/client.tsx`의 `activeTab === "records"` 조건문은 그대로 유지.

### 탭 내 부제/설명 추가
각 탭 상단에 작은 설명 텍스트 추가 (첫 방문 또는 빈 상태일 때만 표시):

```
스탯 탭: "100m, 슈팅파워 등 신체능력 수치를 기록해요"
커리어 탭: "시즌 소속팀, 대회 성적, 수상 기록을 관리해요"
```

### 스탯 항목 힌트
각 스탯 카드에 단위와 설명 텍스트 표시:
- `100m 달리기` → "초 단위 (낮을수록 좋음)"
- `슈팅파워` → "km/h 단위"
- 기타 항목도 `getStatMeta()`의 `unit` + 간단한 설명

---

## 섹션 3: HeroSection 편집 접근성 개선

### 레이아웃 변경
| 현재 | 변경 |
|------|------|
| 카드 하단 텍스트 버튼 3개 (공유/PDF/편집) | 제거 |
| 없음 | 오른쪽 상단 아이콘 버튼: 편집(연필), 공유(업로드) |
| PDF 버튼 노출 | ProfileEditSheet 내부 하단으로 이동 |

### 구현 세부사항
- HeroSection props: `onEdit`, `onShare` 유지 / `onPdf` prop 제거 (ProfileEditSheet 내부로 이동)
- 편집 아이콘: 프로필 카드 우상단 `position: absolute, top: 10, right: 10`
- 공유 아이콘: 편집 아이콘 왼쪽 (간격 8px)
- 스카우터 뷰도 동일 적용

### onPdf 처리 (선수 & 스카우터 공통)
- `profile/page.tsx`의 선수 뷰와 스카우터 뷰 모두 HeroSection에서 `onPdf` prop 제거
- `ProfileEditSheet` 하단에 "PDF 내보내기" 버튼 추가
- `setPdfExportOpen(true)` 호출은 ProfileEditSheet 내부에서 처리
- HeroSection의 `onPdf` prop 자체를 타입에서 제거

---

## 섹션 4: 빈 상태 & 발견성 개선

### 하이라이트 탭 빈 상태
```
[영상 아이콘]
첫 하이라이트를 올려보세요
스킬을 태그하면 포지션별로 정리돼요
[영상 업로드 →] 버튼
```

### 스탯 탭 빈 상태
기존 빈 상태 메시지 대신, 측정 가능한 스탯 항목을 카드 형태로 나열:
```
[100m 달리기]  [슈팅파워]  [드리블 스피드]  ...
각 카드: 항목명 + 단위 + "측정 기록하기" → 탭하면 StatInputSheet 열림
```

### 커리어 탭 빈 상태
```
[트로피 아이콘]
이번 시즌을 추가해보세요
소속팀과 포지션을 기록하면 커리어가 쌓여요
[시즌 추가 +] 버튼 (골드 강조)
```

### 플레이스타일 카드 개선
- 미완성: "플레이스타일 테스트하기" 카드를 스탯 탭 최상단에 항상 노출 (현재 완성된 경우만 표시)
- 완성: 현재와 동일 (스타일 아이콘 + 이름)

---

## 섹션 5: 프로필 완성도 가이드

### 위치
HeroSection 하단 (카드 외부, 본인 프로필에만 노출)

### 완성 항목 정의

**선수 (player):**
| 항목 | 조건 |
|------|------|
| 프로필 사진 | `avatarUrl` 존재 |
| 포지션 | `position` 존재 |
| 신체 정보 | `heightCm` 또는 `weightKg` 존재 |
| 대표 영상 | featured clips 1개 이상 |
| 스탯 | stats 1개 이상 |
| 시즌 | seasons 1개 이상 |
| 플레이스타일 | playStyle 존재 |

**스카우터 (scout):**
| 항목 | 조건 |
|------|------|
| 프로필 사진 | `avatarUrl` 존재 |
| 자기소개 | `bio` 존재 |
| 소속 기관 | `teamName` 존재 |
| 지역 | `city` 존재 |

### UI 구성
```
[━━━━━━━━━━━━━░░░░░░] 60%
다음: 대표 영상을 추가해보세요 →
```

- 진행 바: accent 색상, 얇은 바 (4px)
- 퍼센트 텍스트: `font-stat` (Oswald)
- 다음 추천 액션 1개 (미완성 항목 중 첫 번째)
- 탭하면 해당 탭으로 이동 또는 해당 시트 오픈
- 100% 완성 시: 가이드 숨김 (영구적으로 localStorage에 저장)
  - localStorage 키: `footory_profile_complete_{userId}_{role}` (역할별 분리)
  - 선수가 스카우터로 역할 변경 시 별도 키로 초기화됨

### 스카우터 뷰 완성도 가이드
- 스카우터는 현재 `/profile/page.tsx`에서 별도 뷰(`isScoutProfile`)로 렌더링
- 해당 뷰에 이미 "프로필 완성 CTA 카드"(빈 상태 시 `bio/city/teamName` 없을 때)가 있음
- **중복 방지**: 기존 빈 상태 카드를 `ProfileCompletionGuide`로 교체 (별도 스카우터 항목으로)

### 데이터 흐름
- `profile`, `stats`, `seasons`, `playStyle`, `featured` 데이터를 이미 profile/page.tsx가 보유
- `ProfileCompletionGuide` 컴포넌트로 분리, props로 주입
- 서버 요청 없이 클라이언트 계산

---

## 섹션 6: 공개 프로필 스카우터 뷰 개선 (`/p/[handle]`)

### 현재 상태 (기존 구현 파악 필요)
`/p/[handle]/client.tsx`에 이미 `ScoutSummarySection` 컴포넌트가 구현되어 있음:
- `isScoutViewer` 조건 시 신체 정보(나이/키/몸무게/발), 스탯 TOP 3, 대회/MVP 요약 표시
- HeroSection 하단에 이미 렌더링 중

### 이번 작업 범위
**신규 구현 없음** — 기존 `ScoutSummarySection`이 이미 요구사항을 충족.

단, 아래 두 가지 확인 후 필요 시 개선:
1. 스카우터가 아닌 일반 방문자도 핵심 신체 정보를 볼 수 있는지 확인 (`isScoutViewer` 조건 검토)
2. 모든 방문자에게 기본 신체 요약(키/몸무게/포지션)을 HeroSection에 표시하는 것이 더 나은지 검토

**결론**: 코드를 읽고 `isScoutViewer` 조건이 과도하게 제한적이면 조건 완화. 기존 컴포넌트 재작성 없음.

---

## 영향 범위

| 파일 | 변경 유형 |
|------|---------|
| `src/components/profile/VerifyBadge.tsx` | 삭제 |
| `src/components/profile/RecordsTabV5.tsx` | VerifyBadge 제거, 탭 설명 추가, 빈 상태 개선, 탭 이름 변경 |
| `src/components/profile/CareerTabV5.tsx` | VerifyBadge 제거, 빈 상태 개선 |
| `src/components/profile/HighlightsTabV5.tsx` | 빈 상태 개선 |
| `src/components/profile/HeroSection.tsx` | 액션 바 제거, 아이콘 버튼 추가 |
| `src/components/profile/ProfileTabBar.tsx` | 탭 이름 "기록" → "스탯" |
| `src/components/profile/ProfileCompletionGuide.tsx` | 신규 생성 |
| `src/app/profile/page.tsx` | ProfileCompletionGuide 통합, onPdf → editSheet로 이동 |
| `src/app/p/[handle]/client.tsx` | `isScoutViewer` 조건 검토 및 완화 (필요 시) |

---

## 비-범위 (이번에 하지 않는 것)

- 탭 구조 변경 (3탭 유지)
- 팀 인증 플로우 구현 (향후)
- 코치 역할 추가 (향후)
- 온보딩 플로우 전면 재설계 (향후 C안)
- DM, 알림, 팔로우 관련 변경

---

## 성공 기준

1. 신규 선수가 프로필 진입 시 "무엇을 먼저 채워야 하는지" 즉시 파악 가능
2. 스탯/커리어 탭에서 추가 버튼 발견성 향상 (빈 상태에서 명확한 CTA)
3. 편집 버튼 탭률 증가 (우상단 노출)
4. 팀 인증/자기기록 뱃지 관련 혼란 0
5. 스카우터가 공개 프로필에서 핵심 수치 한눈에 확인 가능
