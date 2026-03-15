# SPRINT-31: 접근성 + 개인정보 + 에러 UX

> Phase F (영상 UX 개편) | 의존: SPRINT-28, 29 완료
> 예상: 3~4시간
> 우선순위: 4위

---

## 목표

ARIA 접근성 기반 확보, 색상 대비 개선, 공개 범위 설정 추가,
에러 메시지 구체화로 모든 사용자가 안심하고 쓸 수 있는 UX 구축.

---

## 작업 목록

### 1. ARIA 접근성 전반 추가

**대상 파일**: FootoryPlayer, VideoTrimmer, SpotlightPicker, SlowmoPicker, EffectsToggle

- [ ] **FootoryPlayer**
  - `role="region"`, `aria-label="영상 재생기"`
  - 재생/일시정지 버튼: `role="button"`, `aria-label="재생"/"일시정지"`, `aria-pressed`
  - 시크바: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- [ ] **VideoTrimmer**
  - 시작 핸들: `role="slider"`, `aria-label="구간 시작 지점"`, `aria-valuemin/max/now`
  - 끝 핸들: `role="slider"`, `aria-label="구간 종료 지점"`
  - `tabIndex={0}` + `onKeyDown` (ArrowLeft/Right로 1초씩 조정)
- [ ] **SpotlightPicker**
  - `role="application"`, `aria-label="영상에서 선수 위치 선택"`
  - 초기화 버튼: `aria-label="선수 위치 초기화"`
- [ ] **SlowmoPicker**
  - 핸들에 동일한 slider role
  - 속도 버튼: `aria-pressed` 상태
- [ ] **EffectsToggle**
  - 각 토글: `role="switch"`, `aria-checked={isOn}`, `aria-label={효과명}`

### 2. 색상 대비 개선 (WCAG AA)

**파일**: `src/app/globals.css`

- [ ] `--color-text-3`: `#71717A` → `#8A8A94` (대비율 4.5:1 이상)
- [ ] 가이드 텍스트, 시간 표시, 보조 설명 등 전반 영향
- [ ] FootoryPlayer 내 12px 텍스트 → 최소 14px
- [ ] 검증: contrast-ratio.com으로 `#0C0C0E` 배경 대비 확인

### 3. 키보드 내비게이션

**파일**: VideoTrimmer, SlowmoPicker, FootoryPlayer

- [ ] 트리머 핸들: `tabIndex={0}`, ArrowLeft/Right = ±1초
- [ ] 슬로모 핸들: 동일
- [ ] 플레이어: Space = 재생/일시정지, ArrowLeft/Right = ±5초
- [ ] 전체화면: F 키
- [ ] 음소거: M 키

### 4. 공개 범위 설정

**파일**: `src/stores/upload-store.ts`, `src/app/upload/page.tsx`, `src/app/api/clips/route.ts`

- [ ] `visibility` 필드 추가: `'public' | 'followers' | 'team' | 'private'`
- [ ] 업로드 Step 3(확인)에 공개 범위 선택 UI
  - 🌍 전체 공개
  - 👥 팔로워만
  - ⚽ 팀원만
  - 🔒 나만 보기
- [ ] 기본값: `'followers'` (학부모 안심 고려)
- [ ] DB: clips 테이블에 `visibility` 컬럼 추가 (migration)
- [ ] API: 조회 시 visibility 기반 필터링

### 5. 에러 메시지 구체화

**파일**: `src/app/upload/page.tsx`, `src/lib/upload-service.ts`, `src/components/video/RenderProgress.tsx`

- [ ] 에러 유형별 메시지 분기:

| 에러 유형 | 현재 | 개선 |
|-----------|------|------|
| 네트워크 | "업로드에 실패했습니다" | "인터넷 연결이 불안정해요. Wi-Fi를 확인해주세요" |
| 파일 크기 | "업로드에 실패했습니다" | "영상이 너무 커요 (최대 50MB). 갤러리에서 해상도를 낮춰보세요" |
| 형식 미지원 | "업로드에 실패했습니다" | "이 형식은 지원하지 않아요. MP4, MOV 파일을 선택해주세요" |
| 서버 오류 | "업로드에 실패했습니다" | "서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요" |
| 렌더 실패 | "렌더링 실패" | "영상 처리에 실패했어요" + 재시도/편집/원본저장 3개 버튼 |

- [ ] fetch 에러 응답 파싱하여 유형 판별
- [ ] 렌더 실패 시 3개 선택지: "다시 처리" / "편집으로 돌아가기" / "원본 그대로 저장"

### 6. ChildSelector 연동 안내 개선

**파일**: `src/components/upload/ChildSelector.tsx` (또는 해당 컴포넌트)

- [ ] 연동된 자녀 없을 때: "아이 연동하기" 버튼 추가 → 설정 페이지로 이동
- [ ] 연동 방법 한줄 설명: "설정 → 자녀 관리에서 아이의 계정을 연동할 수 있어요"

---

## 완료 기준

- [ ] 모든 인터랙티브 요소에 ARIA 속성 적용
- [ ] 보조 텍스트 색상 대비 WCAG AA(4.5:1) 충족
- [ ] 키보드만으로 트리머/플레이어 조작 가능
- [ ] 업로드 시 공개 범위 선택 가능
- [ ] 에러 발생 시 원인과 대처법이 명확히 안내됨
- [ ] 자녀 미연동 상태에서 연동 경로 안내됨
