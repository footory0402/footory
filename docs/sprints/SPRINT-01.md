# Sprint 01: 프로젝트 셋업

> 예상 소요: 1일
> 선행 조건: 없음

## 목표
Next.js 프로젝트 생성 + 피치 블랙 골드 디자인 토큰 적용 + AppShell(바텀탭+헤더) 완성

## 작업 목록

### 1. 프로젝트 생성
- [ ] `npx create-next-app@latest footory --typescript --tailwind --app --src-dir`
- [ ] 불필요한 기본 파일 정리

### 2. 디자인 토큰 적용
- [ ] `tailwind.config.ts`에 커스텀 컬러 추가 (DESIGN-SYSTEM.md Section 2 참고)
  ```
  bg: #0C0C0E, card: #161618, card-alt: #1E1E22
  accent: #D4A853, accent-dim: #8B6914
  green: #4ADE80, red: #F87171, blue: #60A5FA
  text-1: #FAFAFA, text-2: #A1A1AA, text-3: #71717A
  ```
- [ ] `tailwind.config.ts`에 커스텀 폰트 추가
  ```
  body: Noto Sans KR
  stat: Oswald
  brand: Rajdhani
  ```
- [ ] `globals.css`에 CSS 변수 정의
- [ ] `globals.css`에 Google Fonts import
- [ ] `globals.css`에 공통 애니메이션 (fadeUp, slideR, popIn)
- [ ] `layout.tsx`에 폰트 적용 + 다크 배경 기본값

### 3. AppShell 컴포넌트
- [ ] `src/components/layout/BottomTab.tsx`
  - 4탭: 홈(🏠) / 탐색(🔍) / 프로필(👤) / 팀(👥)
  - 활성 탭: 골드 컬러 + 상단 인디케이터
  - 블러 배경, 54px 높이
- [ ] `src/components/layout/AppHeader.tsx`
  - FOOTORY 로고 (Rajdhani, 골드)
  - 탭별 우측 아이콘 (홈: 🔔, 프로필: ↗⚙, 팀: ↗)
- [ ] `src/app/layout.tsx`에 AppShell 통합

### 4. 페이지 스켈레톤
- [ ] `src/app/page.tsx` — 홈 (빈 피드 상태)
- [ ] `src/app/discover/page.tsx` — 탐색 (검색바만)
- [ ] `src/app/profile/page.tsx` — 프로필 (빈 카드)
- [ ] `src/app/team/page.tsx` — 팀 (빈 상태)

### 5. 상수 파일
- [ ] `src/lib/constants.ts` — 레벨, 태그, 포지션 상수 정의

### 6. 배포
- [ ] Vercel 연동 + 첫 배포
- [ ] 모바일에서 430px 레이아웃 확인

## 완료 기준
- [ ] 바텀탭 4개 탭 전환이 동작한다
- [ ] FOOTORY 로고가 Rajdhani 골드로 표시된다
- [ ] 배경이 #0C0C0E 매트 블랙이다
- [ ] 모바일에서 중앙 정렬 (max-width: 430px) 된다
- [ ] Vercel Preview URL로 모바일 확인 가능하다

## 참고 문서
- docs/DESIGN-SYSTEM.md: Section 2 (컬러), Section 3 (타이포), Section 4 (레이아웃), Section 7.6 (바텀탭)
