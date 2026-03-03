# Sprint 05: 프로필 편집

> 예상 소요: 1일
> 선행: Sprint 03 + Sprint 04 완료
> 병렬 가능: ❌ (DB 연동 필요)

## 목표
프로필 데이터를 Supabase에서 가져오고, 인라인 편집으로 저장

## 작업 목록
- [ ] 프로필 데이터 fetch (Supabase → ProfileCard)
- [ ] 각 섹션 인라인 편집 모드 (이름, 포지션, 도시, 팀 등)
- [ ] 프로필 사진 업로드 (Supabase Storage 또는 R2)
- [ ] 핸들 설정/변경 (중복 실시간 체크)
- [ ] 레벨 자동 계산 (ARCHITECTURE.md Section 6 참고)
- [ ] 조회수 카운트 (본인 프로필 방문 시 제외)
- [ ] 낙관적 업데이트 (UI 먼저 반영 → 서버 동기화)

## 완료 기준
- [ ] Supabase에서 프로필 데이터 실시간 로딩
- [ ] 편집 후 저장이 DB에 반영
- [ ] 레벨이 조건 충족 시 자동 변경
- [ ] 로딩 스켈레톤 표시

## 참고
- docs/ARCHITECTURE.md: Section 2.1 (profiles 테이블), Section 6 (레벨 로직)
- docs/SPEC.md: U-01 (인라인 편집)

---
