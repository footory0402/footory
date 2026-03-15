# SPRINT-28: 영상 플레이어 대개편

> Phase F (영상 UX 개편) | 의존: SPRINT-27 완료
> 예상: 4~5시간
> 우선순위: 1위 (4개 팀 전원 합의, 최고 임팩트)

---

## 목표

FootoryPlayer를 현대적 모바일 영상 플레이어로 업그레이드.
시크바, 더블탭 스킵, 전체화면, 음소거를 추가하여 틱톡/릴스 수준의 조작성 확보.

---

## 현재 문제 (as-is)

- `togglePlay`만 존재, seek 함수 없음
- 시크바/프로그레스바 없음 → 원하는 지점 탐색 불가
- 전체화면 버튼 없음
- 볼륨 조절/음소거 UI 없음
- 재생 상태 피드백 없음 (탭이 인식됐는지 불확실)
- 종료 후 "탭하여 다시 재생" 텍스트가 12px로 작고 pointer-events-none
- onClick이 전체 div에 걸려있어 오버레이 요소 클릭도 재생 토글 발동

---

## 작업 목록

### 1. useFootoryPlayer 훅 확장

**파일**: `src/hooks/useFootoryPlayer.ts`

- [ ] `seek(time: number)` 함수 추가
- [ ] `skipForward(seconds: number)` / `skipBackward(seconds: number)` 추가
- [ ] `currentTime` / `duration` 실시간 상태 노출 (requestAnimationFrame)
- [ ] `isMuted` / `toggleMute` 상태 추가
- [ ] `progress` (0~1) 계산값 노출

### 2. 하단 미니 시크바

**파일**: `src/components/video/FootoryPlayer.tsx`

- [ ] 하단에 슬림 프로그레스 바 (높이 3px, 터치 영역 44px)
- [ ] 터치/드래그로 시크 가능
- [ ] 재생 중 3초 후 자동 숨김, 탭 시 재표시
- [ ] 현재 시간 / 전체 시간 표시 (Oswald 폰트)
- [ ] 트림 구간 하이라이트 (골드 배경)

### 3. 더블탭 5초 스킵

**파일**: `src/components/video/FootoryPlayer.tsx`

- [ ] 좌측 더블탭 → 5초 되감기 + 리플 애니메이션 + "◀◀ 5초" 텍스트
- [ ] 우측 더블탭 → 5초 빨리감기 + 리플 애니메이션 + "5초 ▶▶" 텍스트
- [ ] 싱글탭은 기존 재생/일시정지 유지 (300ms 딜레이로 구분)

### 4. 재생 상태 피드백

**파일**: `src/components/video/FootoryPlayer.tsx`

- [ ] 탭 시 재생/일시정지 아이콘 0.5초 페이드 표시 (중앙)
- [ ] 일시정지 상태에서 반투명 ▶ 오버레이 상시 표시
- [ ] 종료 후 다시보기: 명시적 `<button>` + "다시 재생" 텍스트 16px

### 5. 전체화면 / 음소거 버튼

**파일**: `src/components/video/FootoryPlayer.tsx`

- [ ] 우하단 전체화면 아이콘 버튼 (44x44px)
- [ ] `requestFullscreen()` API + landscape 전환
- [ ] 좌하단 음소거 토글 아이콘 (44x44px)
- [ ] BGM + 원본 소리 독립 볼륨? → 1차에서는 mute/unmute만

### 6. 클릭 영역 분리

**파일**: `src/components/video/FootoryPlayer.tsx`

- [ ] 전체 div의 onClick 제거
- [ ] 투명 `<button>` 오버레이로 재생/일시정지 영역 분리
- [ ] 스킬 라벨, 타임스탬프 등 인터랙티브 요소는 `pointer-events-auto`
- [ ] 시크바, 전체화면, 음소거 버튼도 독립 이벤트

### 7. ClipPlayerSheet와 통합 검토

**파일**: `src/components/player/ClipPlayerSheet.tsx`

- [ ] FootoryPlayer의 새 기능을 ClipPlayerSheet에서도 활용
- [ ] 중복 코드 제거, 공통 컨트롤 컴포넌트 추출
- [ ] 두 플레이어의 UX 일관성 확보

---

## 완료 기준

- [ ] 시크바로 원하는 지점 탐색 가능
- [ ] 더블탭으로 5초 스킵 가능
- [ ] 재생/일시정지 상태가 시각적으로 명확
- [ ] 전체화면/음소거 버튼 동작
- [ ] 터치 타겟 최소 44px 충족
- [ ] ClipPlayerSheet와 기본 조작 일관성 확보
