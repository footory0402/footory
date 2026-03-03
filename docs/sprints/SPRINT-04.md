# Sprint 04: 프로필 화면

> 예상 소요: 1~2일
> 선행: Sprint 02 완료
> 병렬 가능: Sprint 03과 병렬 가능 (목 데이터로 먼저 만들기)

## 목표
프로필 화면 전체 UI 완성 (목 데이터 기반, DB 연동은 Sprint 05에서)

## 작업 목록

### 1. ProfileCard 컴포넌트
- [ ] `src/components/player/ProfileCard.tsx`
  - EA FC 스타일: 상단 골드 라인 + 우상단 골드 radial
  - 좌측 아바타(64px) + 우측 정보 (이름+레벨+핸들+포지션+팀)
  - 하단: 팔로워/팔로잉 + 조회수 + 레벨 프로그레스 바
  - 레벨 가이드 문구 (다음 레벨 미션)

### 2. 서브탭 컴포넌트
- [ ] `src/components/player/ProfileTabs.tsx`
  - 3탭: 📋 요약 | 🏷 스킬 | 📊 기록
  - 필 배경, 활성 탭 골드 하이라이트

### 3. 요약 탭
- [ ] `src/components/player/SummaryTab.tsx`
  - ⭐ Featured 하이라이트 (2열 그리드 + 빈 슬롯)
  - 📊 핵심 스탯 (가로 스크롤 카드 3개)
  - 🏅 메달 (인라인 뱃지 + 기록추가 CTA)
  - 프로필 공유 버튼

### 4. 스킬 탭
- [ ] `src/components/player/SkillsTab.tsx`
  - 태그 필터 바 (가로 스크롤)
  - 태그별 아코디언 7개 (접기/펼치기)
  - TOP 클립 표시, 영상 가로 스크롤
  - 빈 태그: 골드 배경 CTA ("첫 영상 올리기")

### 5. 기록 탭
- [ ] `src/components/player/RecordsTab.tsx`
  - 📊 측정 기록 (리스트형)
  - 🏅 메달 전체 (3열 그리드)
  - 📅 시즌 기록 (타임라인 UI)

### 6. 프로필 페이지 조합
- [ ] `src/app/profile/page.tsx`
  - ProfileCard + ProfileTabs + 각 탭 콘텐츠
  - 헤더: FOOTORY + ↗ + ⚙

## 완료 기준
- [ ] 프로필 3탭 전환이 부드럽게 동작
- [ ] 각 탭이 1~2스크롤 이내
- [ ] fadeUp 스태거 애니메이션 적용
- [ ] DESIGN-SYSTEM.md 컬러/폰트 정확히 일치
- [ ] 목 데이터로 모든 상태 (빈/채움/Verified) 확인 가능

## 참고
- docs/DESIGN-SYSTEM.md: Section 7.1 (프로필 카드), 7.2 (서브탭)
- docs/SPEC.md: Section 3.1 (내 프로필), Section 4 (레벨 시스템)
