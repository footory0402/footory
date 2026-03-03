# Sprint 02: 기본 컴포넌트

> 예상 소요: 1일
> 선행 조건: Sprint 01 완료

## 목표
재사용 가능한 기본 UI 컴포넌트 세트 완성

## 작업 목록

### 1. UI 컴포넌트
- [ ] `src/components/ui/Avatar.tsx`
  - props: name, size, level, imageUrl
  - 레벨별 보더 컬러 + 글로우
  - 이미지 없으면 이름 첫 글자 표시

- [ ] `src/components/ui/Badge.tsx`
  - LevelBadge: 레벨 아이콘 + 이름 + 컬러
  - PositionBadge: FW(레드)/MF(그린)/DF(블루)/GK(옐로우)
  - 사이즈: sm / md

- [ ] `src/components/ui/Button.tsx`
  - variant: primary(골드 그라디언트) / secondary(카드+골드보더) / ghost / dashed
  - size: sm / md / lg / full

- [ ] `src/components/ui/Card.tsx`
  - 기본 카드 (bg-card, radius-lg, border)
  - SectionCard (오버라인 제목 + 편집 아이콘)

- [ ] `src/components/ui/ProgressBar.tsx`
  - 골드 그라디언트, 글로우 효과
  - 마운트 시 width 애니메이션

### 2. Player 컴포넌트
- [ ] `src/components/player/VideoThumb.tsx`
  - 비디오 썸네일 (재생 아이콘 + 시간 + 태그)
  - 잔디 패턴 배경
  - aspect ratio: 4/3, 1/1, 16/10

- [ ] `src/components/player/StatRow.tsx`
  - 아이콘 + 라벨 + 수치(Oswald) + 변화량(↑↓)

- [ ] `src/components/player/MedalBadge.tsx`
  - 원형 또는 필 뱃지
  - Verified 체크 표시

### 3. 타입 정의
- [ ] `src/lib/types.ts`
  - Profile, Clip, Stat, Medal, Team, FeedItem 등 인터페이스

## 완료 기준
- [ ] 모든 컴포넌트가 TypeScript props로 타입 안전하다
- [ ] DESIGN-SYSTEM.md의 컬러/폰트/radius 값이 정확히 적용됐다
- [ ] /profile 페이지에서 컴포넌트들을 조합해서 미리보기 가능하다

## 참고 문서
- docs/DESIGN-SYSTEM.md: Section 5 (레벨 비주얼), Section 6 (포지션), Section 7 (컴포넌트 패턴)
