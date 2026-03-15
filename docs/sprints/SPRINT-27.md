# SPRINT-27: 영상 UX 개선 — Quick Win

> Phase F (영상 UX 개편) | 의존: 없음 (기존 코드 수정만)
> 예상: 2~3시간
> 근거: 기획팀/UI·UX팀/유소년·학부모 사용자 4개 관점 UX 검토 (2026-03-15)

---

## 목표

난이도 '하'인 즉시 수정 가능한 항목들을 일괄 처리.
코드 변경량 최소, 사용자 체감 개선 최대인 항목 우선.

---

## 작업 목록

### 1. 용어 순화 (UI 문자열 변경)

**파일**: `src/app/upload/page.tsx`, 각 컴포넌트 내 텍스트

| 현재 | 변경 | 위치 |
|------|------|------|
| 트리밍 | 구간 자르기 | 스텝 인디케이터, 안내 텍스트 |
| 슬로모 | 느린 재생 | 스텝 인디케이터, SlowmoPicker 제목 |
| 0.5x / 0.3x / 0.25x | 느리게 / 더 느리게 / 초슬로 | SlowmoPicker.tsx 속도 버튼 |
| 주인공 표시 | 나 찾기 | 스텝 인디케이터 |
| 렌더링 중 | 영상 처리 중 | RenderProgress.tsx |
| 썸네일 생성 중 | 대표 이미지 만드는 중 | upload-service.ts 상태 텍스트 |
| 시네마틱 바 | 영화 느낌 바 | EffectsToggle.tsx |
| EA FC 카드 | 선수 카드 효과 | EffectsToggle.tsx |

- [ ] 스텝 바 라벨 변경
- [ ] 각 컴포넌트 안내 텍스트 변경
- [ ] 속도 버튼 보조 텍스트 추가

### 2. 부모 모드 문구 분기

**파일**: `src/components/video/SpotlightPicker.tsx`

- [ ] 부모 역할일 때 "영상에서 아이를 터치해주세요"로 변경
- [ ] `useUploadStore`의 `childInfo` 존재 여부로 분기

### 3. 효과 기본값 OFF로 변경

**파일**: `src/stores/upload-store.ts`

- [ ] `effects` 초기값: `{ color: false, cinematic: false, eafc: false, intro: false }`
- [ ] 각 효과에 한줄 설명 추가 (EffectsToggle.tsx)

### 4. 트리머/슬로모 핸들 터치 영역 확대

**파일**: `src/components/video/VideoTrimmer.tsx`, `SlowmoPicker.tsx`

- [ ] 드래그 핸들 터치 영역: `w-5`(20px) → `w-11`(44px)
- [ ] 시각적 핸들에 원형 노브(w-6 h-6, rounded-full) 추가
- [ ] 드래그 중 시각 피드백: `scale-110` + 밝은 골드 색상
- [ ] 양쪽 ±1초 미세 조정 버튼 추가

### 5. 렌더링 실패 시 재시도 버튼

**파일**: `src/components/video/RenderProgress.tsx`

- [ ] 실패 상태에 "다시 시도" 버튼 추가
- [ ] "편집으로 돌아가기" 버튼 추가
- [ ] 에러 메시지 구체화 (네트워크/용량/형식 분기)

### 6. 삭제 확인 다이얼로그

**파일**: `src/hooks/useClips.ts` 또는 삭제 호출부

- [ ] `deleteClip` 호출 전 confirm 다이얼로그 추가
- [ ] "이 영상을 삭제하면 복구할 수 없습니다" 경고 텍스트

---

## 완료 기준

- [ ] 모든 용어가 한글 친화적으로 변경됨
- [ ] 부모 모드에서 문구가 올바르게 분기됨
- [ ] 핸들 터치 영역이 44px 이상
- [ ] 렌더 실패 시 사용자가 취할 수 있는 액션이 있음
- [ ] 삭제 시 확인 과정이 있음
