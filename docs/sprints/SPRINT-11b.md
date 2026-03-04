# Sprint 11b: 🔍 탐색 탭

> 예상 소요: 3~4시간
> 선행 조건: Sprint 03 (DB), Sprint 10 (팔로우)
> **v1.1: 신규 스프린트**

## 목표
선수·팀 랭킹 + 검색 + 태그별 그리드 + 팔로우 발견

## 작업 목록

### 1. 탐색 메인 화면
- [ ] `src/app/discover/page.tsx`
  - 상단 검색바 (탭하면 검색 오버레이)
  - 상단 필터 탭: [전체] [선수] [팀] [태그]
  - 전체 탭: 인기 선수 + 떠오르는 선수 + 팀 랭킹 + 태그별 클립

### 2. 검색 오버레이
- [ ] `src/components/explore/SearchOverlay.tsx`
  - 실시간 검색 결과 (디바운스 300ms)
  - 카테고리별: 👤 선수 / 👥 팀 / 🏷 태그
  - 최근 검색 기록

### 3. 선수 랭킹
- [ ] `src/components/explore/PlayerRanking.tsx`
  - player_ranking_cache 기반 리스트
  - 순위 + 아바타 + 이름 + 포지션 + 팀 + MVP뱃지 + 응원수 + [팔로우]
  - 정렬: 인기순(기본) / 팔로워순 / MVP횟수순
  - 필터: 포지션 / 지역 / 연령대

### 4. 떠오르는 선수 캐러셀
- [ ] `src/components/explore/RisingPlayers.tsx`
  - weekly_change 상위 선수 (급상승)
  - 가로 캐러셀: 아바타 + 이름 + 포지션 + [팔로우]

### 5. 팀 랭킹
- [ ] `src/components/explore/TeamRanking.tsx`
  - team_ranking_cache 기반
  - 순위 + 로고 + 팀명 + 멤버수 + 클립수
  - 가로 캐러셀 (전체 탭) 또는 리스트 (팀 탭)

### 6. 태그별 인기 클립 그리드
- [ ] `src/components/explore/TagGrid.tsx`
  - 태그 필터 캐러셀 ([1v1돌파] [슈팅] [패스] ...)
  - 2~3열 썸네일 그리드 (인스타 탐색 스타일)
  - 탭하면 영상 상세

## 완료 기준
- [ ] 탐색 탭에서 선수 랭킹이 표시된다
- [ ] 팀 랭킹이 표시된다
- [ ] 검색이 실시간으로 동작한다
- [ ] 태그별 그리드가 필터링된다
- [ ] 떠오르는 선수에서 팔로우 버튼이 동작한다

## 참고 문서
- docs/SPEC.md: PART 0.4 (탐색 탭)
- docs/ARCHITECTURE.md: Section 2.7 (랭킹 캐시)
