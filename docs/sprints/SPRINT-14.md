# Sprint 14: 공개 프로필

> 예상 소요: 1일
> 선행: Sprint 04 + Sprint 12 완료
> 병렬 가능: ❌

## 작업 목록
- [ ] `/p/[handle]/page.tsx` — 선수 공개 프로필 (SPEC Section 3.6)
  - 비로그인 열람 가능
  - 프로필 카드 + 팔로우 버튼
  - Featured 자동재생
  - Stats + Medals + Tags + Season
  - 연락처 (공개 설정된 경우만)
  - 공유 버튼
- [ ] `/t/[handle]/page.tsx` — 팀 공개 프로필
  - 비로그인 열람 가능
  - 멤버 + 앨범
  - "가입하기" 버튼 (로그인 유도)
- [ ] OG 이미지 동적 생성 (Next.js `opengraph-image.tsx`)
  - 선수: 프사 + 이름 + 포지션 + Featured 썸네일
  - 팀: 로고 + 팀명 + 멤버수
- [ ] 카카오톡 공유 최적화
  - OG 메타 태그 정확히 설정
  - 공유 시트 UI (카카오/복사/기타)

## 완료 기준
- [ ] /p/minjun07 접속 시 공개 프로필 표시
- [ ] /t/fcseoul-u15 접속 시 팀 공개 프로필 표시
- [ ] 카카오톡 공유 시 OG 이미지 정상 표시
- [ ] 비로그인 상태에서 열람 가능

---
