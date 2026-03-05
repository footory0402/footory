# SPRINT-11b-v2: 네비게이션 재설계 (탐색→검색, DM→탭)

> Phase A | 의존: SPRINT-15b 완료
> 예상: 4~5시간

---

## 목표

1. 바텀탭 3번째를 🔍탐색 → 💬DM으로 교체
2. 기존 탐색 콘텐츠를 헤더 🔍 검색 오버레이로 이동
3. 헤더에 🔍 🔔 아이콘 추가
4. 부모 역할일 경우 바텀탭을 3탭으로 표시

---

## 작업

### 1. 바텀탭 수정

파일: `src/components/layout/BottomTab.tsx`

```
선수/코치/스카우터:
  🏠 홈     🏆 MVP    💬 DM    👤 프로필    👥 팀
  /         /mvp      /dm      /profile     /team

부모:
  🏠 홈     💬 DM    ⚙️ 설정
  /         /dm      /settings

분기: usePermissions() 훅으로 role 확인
```

디자인 유지:
- 높이 54px, 블러 배경
- 활성 탭: 골드 #D4A853 + 상단 2px 인디케이터
- 비활성: #71717A

💬 DM 탭에 안 읽은 메시지 뱃지:
- 빨간 원 (min-width 16px), 폰트 10px, 최대 "99+"

### 2. 헤더 수정

파일: `src/components/layout/AppHeader.tsx`

```
v1.1: FOOTORY                    🔔
v1.2: FOOTORY               🔍  🔔

🔍: 탭하면 SearchOverlay 열기
🔔: 탭하면 /notifications로 이동
  - 미읽은 알림 수 빨간 뱃지
```

### 3. 검색+탐색 오버레이

파일: `src/components/search/SearchOverlay.tsx`

```
구현 방식: 풀스크린 모달 (position: fixed, z-index: 50)
애니메이션: 아래에서 위로 슬라이드 (200ms ease-out)

내부 구성 (기존 /explore 페이지에서 이동):
  ├── 검색바 (자동 포커스, 키보드 올라옴)
  ├── 필터 탭 [전체] [선수] [팀] [태그]
  ├── 인기 선수 랭킹 (PlayerRanking 컴포넌트 재사용)
  ├── 떠오르는 선수 캐러셀 (재사용)
  ├── 팀 랭킹 캐러셀 (재사용)
  └── 태그별 인기 클립 (TagGrid 컴포넌트 재사용)

검색 입력 시:
  - 실시간 검색 결과 표시 (SearchOverlay 내에서 전환)
  - 선수/팀/@핸들/태그 검색

닫기:
  - 상단 ← 버튼 또는 뒤로가기
  - 검색바 외부 탭 (결과 없을 때)
```

### 4. /explore 라우트 처리

기존 /explore 페이지를 삭제하거나 SearchOverlay로 리다이렉트.
explore 관련 컴포넌트는 /components/explore/에 유지 (SearchOverlay에서 import).

### 5. DM 라우트 생성

파일: `src/app/dm/page.tsx`

임시 빈 화면 (Sprint 19에서 구현):
```
"메시지가 없어요"
"친구에게 먼저 메시지를 보내보세요!"
```

파일: `src/app/dm/[conversationId]/page.tsx`
임시 빈 화면.

### 6. 알림 라우트 생성

파일: `src/app/notifications/page.tsx`

임시 빈 화면 (Sprint 16에서 구현):
```
"알림이 없어요"
```

### 7. 부모용 바텀탭 분기

`src/components/parent/ParentBottomTab.tsx` 또는 BottomTab 내에서 role === 'parent' 분기.

```
부모 바텀탭:
  🏠 홈(자녀 대시보드) / 💬 DM / ⚙️ 설정
  /                    /dm     /settings
```

---

## 확인 사항

- [ ] 바텀탭이 🏠🏆💬👤👥 5탭으로 변경됨
- [ ] 💬 DM 탭 탭하면 /dm으로 이동
- [ ] 헤더에 🔍 🔔 아이콘이 표시됨
- [ ] 🔍 탭하면 검색+탐색 오버레이가 풀스크린으로 열림
- [ ] 오버레이에서 기존 탐색 콘텐츠(랭킹, 검색, 태그)가 보임
- [ ] 🔔 탭하면 /notifications로 이동
- [ ] /explore 직접 접근 시 적절히 처리됨
- [ ] 부모 role일 때 바텀탭이 3탭으로 표시됨
- [ ] 디자인 토큰 유지
