# Next Remediation Plan (Blocker 3~5)

> 작성일: 2026-04-10  
> 범위: 분석/계획 only (코드 수정 금지)  
> 기준: 실제 구현 + 지정 문서 7종

## 번호 체계 주의
- 본 문서의 blocker 3~5는 이번 작업 요청 기준 번호를 따른다.
- `docs/ship-blockers.md`와 직접 매핑하면:
  - 이번 `Blocker 3` = `ship-blockers Blocker 3` (share/reel/profile single-clip playback contract)
  - 이번 `Blocker 4` = `ship-blockers`에는 독립 blocker로 명시되지 않았고, upload/reset/legacy 상태 오염 리스크와 연결됨
  - 이번 `Blocker 5` = `ship-blockers`에는 독립 blocker로 명시되지 않았고, 업로드 안정성/검증 공백의 근본 원인 축으로 연결됨

## Blocker 3. share/reel/profile 간 single-clip playback contract 불일치

### 실제 영향 범위
- profile 재생은 `ClipPlayerSheet`를 사용하며 intro/HUD(lower third), spotlight/freeze/zoom, overlay를 함께 소비한다.  
  근거: `src/components/player/ClipPlayerSheet.tsx:16`, `src/components/player/ClipPlayerSheet.tsx:675`, `src/components/player/ClipPlayerSheet.tsx:721`, `src/components/player/ClipPlayerSheet.tsx:860`
- reel share는 최종 재생을 `ClipPlayerSheet`로 위임해 profile 계약과 상대적으로 정렬되어 있다.  
  근거: `src/app/reel/[id]/ReelShareClient.tsx:7`, `src/app/reel/[id]/ReelShareClient.tsx:137`
- 단일 clip share(`/p/[handle]/h/[clipId]`)는 별도 `HighlightSharePlayerClient`를 사용하며 intro/HUD(lower third) 계약이 빠져 있다.  
  근거: `src/app/p/[handle]/h/[clipId]/page.tsx:125`, `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx:28`

### 위험도
- `높음`: 같은 clip 저장 결과가 소비 경로(profile vs public share)마다 다르게 보일 수 있어 제품 신뢰도/선수 어필 일관성이 깨진다.

### 수정 난이도
- `중간`: 데이터 모델 변경보다 소비 컴포넌트 정렬 작업이 중심이지만, 모바일 공유 UX/레이아웃 영향 검증이 필요하다.

### 선행되어야 할 조건
- single-clip playback contract의 “필수/선택 필드”를 문서로 잠금 (`intro`, `showLowerThird`, `focusZoom`, `tracking*`, trim window).
- share 단일 경로에서 허용할 UX 차이(예: 액션 버튼, 시트 UI)는 명시하되 playback 계약 자체는 동일하게 정의.

### 안전한 최소 작업 단위
- `단위 B3-1`: `HighlightSharePlayerClient`와 `ClipPlayerSheet`의 기능 갭 표 작성 + 필수 동작 체크리스트 확정(문서/테스트 기준).
- `단위 B3-2`: 단일 share 경로 재생 코어를 `ClipPlayerSheet` 기반으로 일치시키는 얇은 adapter 설계(레이아웃만 별도 유지).
- `단위 B3-3`: profile/share/reel 공통 playback 회귀 시나리오(spotlight, freeze, lower third on/off) 최소 E2E 추가 계획 확정.

## Blocker 4. upload-store 레거시 필드 과다

### 실제 영향 범위
- 현재 store는 `phase/status`의 과거 상태값, render 파이프라인, BGM/캡션/슬로모션, 압축/R2 상태를 한 곳에 혼재한다.  
  근거: `src/stores/upload-store.ts:14`, `src/stores/upload-store.ts:22`, `src/stores/upload-store.ts:84`, `src/stores/upload-store.ts:97`, `src/stores/upload-store.ts:104`
- `/upload` 메인 플로우는 `select -> processing -> review`만 사용하며 레거시 phase를 select로 되돌리는 보정 코드가 존재한다.  
  근거: `src/app/upload/page.tsx:82`, `src/app/upload/page.tsx:89`
- `reset()`이 단일 초기값 전체를 덮어써, 실제 사용하지 않는 필드까지 동작 리스크 면적을 넓힌다.  
  근거: `src/stores/upload-store.ts:167`, `src/stores/upload-store.ts:290`

### 위험도
- `중간~높음`: 당장 장애를 일으키지 않아도 상태 오염/회귀 추적 난이도를 높이고, blocker 1(업로드 중 reset/cancel) 수정을 어렵게 만든다.

### 수정 난이도
- `중간`: store 소비 지점이 넓어 일괄 삭제는 위험하고, 사용/미사용 분리 후 단계적 정리가 필요하다.

### 선행되어야 할 조건
- 필드별 분류표 확정: `현재 사용 중`, `레거시지만 필수`, `삭제 후보`, `보류`.
- `/upload`, `ParentQuickUpload`, `GlobalUploadIndicator`, `useGlobalRenderPolling`, API payload 경로 기준으로 read/write 근거 먼저 고정.

### 안전한 최소 작업 단위
- `단위 B4-1`: `upload-store` 필드 사용 매트릭스 문서화(필드별 reader/writer, reset 영향, API 영향).
- `단위 B4-2`: 기능 영향이 작은 항목부터 분리(예: legacy phase 값 정리)하고 reset 동작 회귀를 먼저 고정.
- `단위 B4-3`: render 전용 필드/편집 전용 필드 분리 여부 결정 전, 실제 호출 없는 setter부터 deprecate 표시.

## Blocker 5. upload-service / ParentQuickUpload 업로드 로직 중복

### 실제 영향 범위
- 일반 업로드는 `upload-service`가 presign, background R2, 압축, fallback, clip 저장, thumbnail background 업로드를 담당한다.  
  근거: `src/lib/upload-service.ts:654`, `src/lib/upload-service.ts:782`, `src/lib/upload-service.ts:841`, `src/lib/upload-service.ts:1028`
- 부모 빠른 업로드는 `ParentQuickUpload`가 별도 presign/PUT/direct fallback/thumbnail/저장을 중복 구현한다.  
  근거: `src/components/parent/ParentQuickUpload.tsx:60`, `src/components/parent/ParentQuickUpload.tsx:66`, `src/components/parent/ParentQuickUpload.tsx:80`, `src/components/parent/ParentQuickUpload.tsx:107`
- parent 진입 경로는 `ChildDashboard` 모달이며 실사용 경로다.  
  근거: `src/components/parent/ChildDashboard.tsx:299`

### 위험도
- `높음`: 업로드 실패/재시도/메타데이터 계약 버그를 두 구현에서 따로 고쳐야 해서 회귀가 반복된다.

### 수정 난이도
- `중간`: API는 이미 공통(`/api/upload/presign`, `/api/parent/upload`)이라 orchestration 통합은 가능하지만, UI 단계 차이를 유지해야 한다.

### 선행되어야 할 조건
- 공통 업로드 책임 범위 정의: presign/업로드/fallback/thumbnail/save를 어디까지 서비스 레이어가 소유할지 결정.
- parent 전용 차이(자녀 선택, 태그 필수, 완료 UI)만 남기는 경계 정의.

### 안전한 최소 작업 단위
- `단위 B5-1`: `ParentQuickUpload`에서 네트워크/업로드 처리 코드를 분리하고 공통 함수 호출 구조로 전환 설계.
- `단위 B5-2`: payload 생성 규칙을 `upload-service` 단일 경로로 수렴(부모 컨텍스트는 파라미터화).
- `단위 B5-3`: parent 업로드 단일 E2E(성공/실패/취소) 기준 시나리오를 release gate에 추가 계획.

## 권장 처리 순서
1. `Blocker 5` (업로드 로직 중복 축소)  
2. `Blocker 4` (upload-store 레거시 필드 축소)  
3. `Blocker 3` (single-clip playback 계약 정렬)

### 순서 근거
- B5를 먼저 줄이면 업로드 변경 지점이 한 곳으로 모여 B4 정리의 blast radius가 줄어든다.
- B4를 먼저 정리하면 B3 대응 시 저장/상태 경로가 단순해져 소비 계약 정렬 검증이 쉬워진다.
- B3는 사용자 체감 영향이 크지만, 업로드/상태 기반이 안정화된 뒤 적용해야 재회귀가 적다.

## 절대 같이 고치면 안 되는 조합
- `B5 + B3` 동시 진행 금지: 업로드 저장 계약과 재생 소비 계약을 동시에 바꾸면 회귀 원인 분리가 불가능해진다.
- `B4 + B5` 대규모 일괄 진행 금지: store 축소와 업로드 오케스트레이션 통합을 한 PR에서 같이 하면 reset/abort 회귀 추적이 어려워진다.
- `B3 + 공개 share UI 리디자인` 동시 진행 금지: 계약 정렬 검증과 UI 변경 검증이 섞여 acceptance 판정이 흐려진다.

## 이번 단계 결론 요약
- 다음 1순위: **Blocker 5 (upload-service / ParentQuickUpload 중복 제거 설계 착수)**
- 가장 안전한 다음 작업 단위: **`단위 B5-1` (ParentQuickUpload의 네트워크 업로드 코드 분리 + 공통 함수 호출 구조 설계 문서/인터페이스 확정)**

## 진행 현황 (2026-04-10)
- `단위 B5-1` 착수 및 1차 구현 완료:
  - 공통 업로드 유틸 파일 추가 (`src/lib/upload-network.ts`)
  - `ParentQuickUpload`의 presign/PUT/direct fallback 중복 로직을 공통 유틸 호출로 전환
  - `upload-service`의 direct API fallback도 동일 유틸을 호출하도록 연결
- `단위 B5-2` 완료:
  - 공통 payload 빌더 추가 (`src/lib/upload-payload.ts`)
  - 일반 업로드(`startUpload`)와 부모 업로드(`ParentQuickUpload`)가 동일 payload 생성 함수를 사용하도록 수렴
