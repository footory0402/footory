# FOOTORY 디자인 시스템 v2.0 — 피치 블랙 골드 (확정)

> 유스 축구 선수 프로필 플랫폼
> Theme: Pitch Black Gold
> Status: ✅ 확정
> Date: 2026-03-03

---

## 1. 디자인 철학

**"Black Pitch, Gold Stars"**

EA FC의 TOTW 카드처럼 매트 블랙 위에 골드가 빛나는 프리미엄 스포츠 UI.
배민의 위트 있는 터치, 토스의 정돈된 다크 모드, FM의 데이터 밀도감을 조합.

**핵심 원칙:**
- **매트 블랙 베이스**: 거의 순수한 블랙. 콘텐츠가 주인공
- **골드 액센트**: 포인트 컬러는 오직 골드 계열. 절제된 럭셔리
- **카드 중심**: EA FC 스타일의 카드 레이아웃. 정보의 계층 명확
- **게이미피케이션**: 레벨, 메달, 뱃지가 자연스럽게 UI에 녹아듦
- **1~2 스크롤**: 프로필 탭 분리로 각 화면은 최대 2스크롤 이내

---

## 2. 컬러 팔레트

### 2.1 배경 (Background)

| 토큰 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| `bg-primary` | `#0C0C0E` | `zinc-950` 커스텀 | 앱 전체 배경 |
| `bg-card` | `#161618` | - | 카드/섹션 배경 |
| `bg-card-alt` | `#1E1E22` | - | 서브카드, 입력필드 |
| `bg-elevated` | `#252528` | - | 모달, 바텀시트 |

### 2.2 액센트 (Accent)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `accent` | `#D4A853` | **메인 골드** — 버튼, 링크, 활성 상태 |
| `accent-dim` | `#8B6914` | 그라디언트 끝, 비활성 골드 |
| `accent-bg` | `rgba(212,168,83,0.08)` | 골드 배경 틴트 |
| `accent-gradient` | `linear-gradient(135deg, #D4A853, #8B6914)` | CTA 버튼, 레벨바 |
| `accent-shine` | `linear-gradient(135deg, #D4A853 0%, #F5D78E 40%, #D4A853 60%, #8B6914 100%)` | 프리미엄 하이라이트 |

### 2.3 시맨틱 컬러 (Semantic)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `green` | `#4ADE80` | 성공, 기록 향상(↑), Verified |
| `red` | `#F87171` | 에러, FW 포지션 |
| `blue` | `#60A5FA` | DF 포지션, 링크 |
| `gold` | `#D4A853` | 메달, 골드 등급 (= accent) |
| `yellow` | `#FBBF24` | GK 포지션, 경고 |

### 2.4 텍스트 (Text)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `text-1` | `#FAFAFA` | 주요 텍스트 (거의 화이트) |
| `text-2` | `#A1A1AA` | 보조 텍스트 |
| `text-3` | `#71717A` | 비활성, 힌트, 레이블 |

### 2.5 보더 & 구분선

| 토큰 | Hex | 용도 |
|------|-----|------|
| `border` | `#27272A` | 기본 보더 |
| `border-accent` | `rgba(212,168,83,0.2)` | 포커스/선택 보더 |
| `divider` | `rgba(255,255,255,0.05)` | 구분선 |

---

## 3. 타이포그래피

### 3.1 폰트 스택

```css
/* 본문 (한글) */
--font-body: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;

/* 숫자/스탯 (스포츠 느낌) */
--font-stat: 'Oswald', 'Noto Sans KR', sans-serif;

/* 브랜드/로고 */
--font-brand: 'Rajdhani', 'Noto Sans KR', sans-serif;
```

### 3.2 타입 스케일

| 레벨 | 크기 | 굵기 | 행간 | 용도 |
|------|------|------|------|------|
| Display | 22px | 700 | 1.2 | 스탯 수치 (Oswald) |
| H1 | 19-20px | 700 | 1.3 | 프로필 이름 |
| H2 | 16px | 600 | 1.3 | 섹션 제목 |
| Body | 13px | 400 | 1.5 | 기본 본문 |
| Caption | 11-12px | 500 | 1.4 | 보조 정보 |
| Overline | 10px | 700 | 1.2 | 섹션 레이블 (letter-spacing: 0.1em, uppercase) |
| Micro | 9px | 700 | 1.2 | 뱃지, 태그 내부 |

---

## 4. 간격 & 레이아웃

### 4.1 간격 스케일
```
4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 32 / 40
```

### 4.2 모바일 레이아웃
- 최대 너비: 430px
- 사이드 패딩: 14~18px
- 카드 패딩: 12~16px
- 섹션 간격: 20~24px
- 바텀탭 높이: 54px + safe area
- 헤더 높이: 42px

### 4.3 Border Radius

| 토큰 | 값 | 용도 |
|------|-----|------|
| `radius-sm` | 4px | 포지션 뱃지 |
| `radius-md` | 8px | 태그, 작은 버튼, 썸네일 |
| `radius-lg` | 10px | 카드, 입력필드 |
| `radius-xl` | 14px | 큰 카드, 피드 카드 |
| `radius-full` | 999px | 원형 아바타, 필 뱃지, 검색바 |

---

## 5. 레벨 시스템 비주얼

| 레벨 | 이름 | 아이콘 | 컬러 | 글로우 | 보더 |
|------|------|--------|------|--------|------|
| Lv.1 | 루키 | 🌱 | `#71717A` | 없음 | 회색 |
| Lv.2 | 스타터 | ⚡ | `#A1A1AA` | 약한 실버 | 실버 |
| Lv.3 | 레귤러 | 🔥 | `#D4A853` | 골드 글로우 | 골드 |
| Lv.4 | 에이스 | ⭐ | `#F5C542` | 강한 골드 | 밝은 골드 |
| Lv.5 | 올스타 | 🏆 | `#F5D78E` | 최강 글로우 | 샤이니 골드 |

- 뱃지: 배경 `{color}18`, 보더 `{color}33`, 텍스트 `{color}`
- 아바타 보더: 레벨 컬러로 2.5px
- Lv.3+: box-shadow 글로우 추가

---

## 6. 포지션 컬러

| 포지션 | 컬러 | Hex |
|--------|------|-----|
| FW | 레드 | `#F87171` |
| MF | 그린 | `#4ADE80` |
| DF | 블루 | `#60A5FA` |
| GK | 옐로우 | `#FBBF24` |

뱃지: 배경 `{color}18`, 보더 `{color}33`, 텍스트 `{color}`

---

## 7. 핵심 컴포넌트 패턴

### 7.1 프로필 카드 (EA FC 스타일)
- 배경: `bg-card` + 상단 3px 골드 그라디언트 라인
- 좌측: 아바타(64px) + 포지션 뱃지(우하단)
- 우측: 이름 + 레벨뱃지 / 핸들 / 포지션·나이·도시 / 팀
- 하단: 팔로워·팔로잉 + 조회수 + 레벨 프로그레스 바
- 우상단: 은은한 골드 radial-gradient 장식

### 7.2 프로필 서브 탭 (3탭)
```
[ 📋 요약 | 🏷 스킬 | 📊 기록 ]
```
- 배경: `bg-card`, border-radius: 10px, 내부 패딩 3px
- 활성 탭: `accent`컬러 + accent-bg 배경
- 비활성: `text-3` 컬러

**요약 탭 구성:**
1. ⭐ 대표 하이라이트 (Featured 1~3, Progressive Disclosure)
2. 📊 핵심 스탯 요약 (가로 스크롤 카드 3개)
3. 🏅 메달 (인라인 뱃지) + 기록 추가 CTA
4. 프로필 공유 버튼

**스킬 탭 구성:**
1. 태그 필터 바 (가로 스크롤, 클립 있는 태그만)
2. 태그별 아코디언 (7개, 접기/펼치기)
3. 각 태그: TOP 클립 표시, 영상 가로 스크롤, + 추가 버튼
4. 빈 태그: 골드 배경 CTA ("첫 영상 올리기")

**기록 탭 구성:**
1. 📊 측정 기록 (리스트형, 값+변화량)
2. 🏅 메달 전체 (3열 그리드)
3. 📅 시즌 기록 (타임라인)

### 7.3 피드 카드
- 배경: `bg-card`, radius: 14px
- 헤더: 아바타(36px) + 이름 + "›" + 레벨뱃지 + 팀·시간 / 포지션뱃지
- 본문: 타입별 (하이라이트 영상 / 메달 축하 / 스탯 기록)
- 푸터: 👏 응원 / 💬 댓글 / ↗ 공유

### 7.4 영상 썸네일
- 배경: subtle gradient (#1a1a1e → #121214)
- 잔디 패턴: 수평선 반복, 골드, opacity 0.04
- 좌하단: 재생시간 뱃지 (Oswald, 반투명 블랙)
- 우상단: 태그 뱃지 (골드)
- 중앙: 재생 버튼 (원형, 반투명 블랙 + 블러)

### 7.5 빈 상태 CTA
- **기존(약함)**: dashed border + 텍스트만
- **개선(강함)**: `accent-bg` 배경 + 골드 그라디언트 CTA 버튼
- 빈 슬롯/태그에는 강한 CTA 적용

### 7.6 바텀 탭
- 배경: `bg-primary` + 90% opacity + blur(16px)
- 활성: 골드 컬러 + 골드 글로우 + 상단 2px 골드 인디케이터
- 비활성: `text-3`

---

## 8. 화면별 구조 요약

### 8.1 네비게이션 (4탭)
```
🏠 홈 (피드) | 🔍 탐색 | 👤 프로필 | 👥 팀
```
설정: 프로필 헤더 ⚙ 아이콘
공유: 프로필/팀 헤더에 ↗ 아이콘

### 8.2 프로필 화면
```
헤더 (FOOTORY | ↗ ⚙)
├── 프로필 카드 (아바타+정보+팔로우+레벨바)
├── 서브 탭 [요약 | 스킬 | 기록]
└── 탭 콘텐츠
```

### 8.3 홈 피드
```
헤더 (FOOTORY | 🔔)
└── 피드 카드 리스트 (세로 스크롤)
```

### 8.4 탐색
```
헤더 (FOOTORY)
├── 검색바
├── 🔥 최근 업로드 (2열 그리드)
├── 🏅 최근 메달 달성 (가로 스크롤)
└── ⭐ 추천 선수 (가로 스크롤)
```

### 8.5 팀
```
헤더 (FOOTORY | ↗)
├── 내 팀 카드 (로고+팀명+멤버아바타)
│   ├── [↗ 팀 프로필 공유] [🔗 초대 링크]  ← 공유 버튼 강조
└── + 팀 만들기 / 가입
```

---

## 9. 애니메이션

### 9.1 이징
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

### 9.2 주요 애니메이션

| 이름 | 동작 | 시간 | 용도 |
|------|------|------|------|
| fadeUp | opacity 0→1 + Y 12→0 | 0.4s | 카드 진입, 탭 전환 |
| slideR | opacity 0→1 + X -8→0 | 0.35s | 스탯 행 진입 |
| popIn | scale 0.8→1 + opacity | 0.3s | 메달 뱃지 |
| growW | width 0→target | 0.8s | 프로그레스 바 |
| stagger | fadeUp + delay 0.05s×n | - | 리스트 아이템 순차 진입 |

---

## 10. 피드백 반영 사항

| # | 피드백 | 반영 내용 |
|---|--------|----------|
| F-01 | 프로필 공유 버튼 접근성 | 헤더에 ↗ 아이콘 추가 + 요약 탭 하단 CTA 유지 |
| F-02 | 팀 공유 버튼 GTM | 팀 카드에 "팀 프로필 공유" + "초대 링크" 버튼 2개 눈에 띄게 |
| F-03 | 피드→프로필 이동 | 이름 옆 "›" 화살표 추가 (탭 시 프로필 이동) |
| F-04 | 빈 태그 CTA 약함 | accent-bg 배경 + 골드 그라디언트 버튼으로 강화 |
| F-05 | 레벨 가이드 가독성 | 다음 미션 텍스트에 골드 bold 처리 |
| F-06 | 프로필 너무 김 | 3탭 분리 (요약/스킬/기록) → 각 1~2스크롤 |

---

## 11. Claude Code 개발 가이드

### 11.1 기술 스택
```
Next.js 14+ (App Router)
TypeScript
Tailwind CSS (커스텀 토큰 확장)
Supabase (백엔드)
Vercel (배포)
```

### 11.2 Tailwind 설정 예시
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0C0C0E', card: '#161618', 'card-alt': '#1E1E22', elevated: '#252528' },
        accent: { DEFAULT: '#D4A853', dim: '#8B6914' },
        success: '#4ADE80',
        pos: { fw: '#F87171', mf: '#4ADE80', df: '#60A5FA', gk: '#FBBF24' },
      },
      fontFamily: {
        body: ['Noto Sans KR', 'sans-serif'],
        stat: ['Oswald', 'sans-serif'],
        brand: ['Rajdhani', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        'card-lg': '14px',
      },
    },
  },
}
```

### 11.3 프로젝트 구조
```
src/
├── app/
│   ├── layout.tsx              # 앱 셸 (바텀탭, 헤더)
│   ├── page.tsx                # 홈 (피드)
│   ├── discover/page.tsx       # 탐색
│   ├── profile/
│   │   ├── page.tsx            # 내 프로필 (3탭)
│   │   └── [handle]/page.tsx   # 공개 프로필
│   └── team/
│       ├── page.tsx            # 팀 허브
│       └── [handle]/page.tsx   # 팀 상세
├── components/
│   ├── ui/                     # 기본 컴포넌트
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx           # LevelBadge, PositionBadge
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ProgressBar.tsx
│   ├── player/                 # 선수 관련
│   │   ├── ProfileCard.tsx     # EA FC 스타일 프로필 카드
│   │   ├── StatCard.tsx        # 가로 스탯 카드
│   │   ├── MedalBadge.tsx
│   │   ├── FeaturedSlot.tsx
│   │   ├── TagAccordion.tsx
│   │   └── SeasonTimeline.tsx
│   ├── feed/
│   │   ├── FeedCard.tsx
│   │   └── FeedList.tsx
│   ├── team/
│   │   └── TeamCard.tsx
│   └── layout/
│       ├── BottomTab.tsx
│       ├── AppHeader.tsx
│       └── AppShell.tsx
├── lib/
│   ├── constants.ts            # 레벨, 태그, 포지션 상수
│   └── types.ts                # TypeScript 타입
└── styles/
    └── globals.css             # 폰트 import, CSS 변수
```

### 11.4 개발 순서 (권장)
```
Phase 1: 기반
  1. 프로젝트 셋업 (Next.js + Tailwind + 폰트)
  2. 디자인 토큰 적용 (globals.css + tailwind.config)
  3. 기본 컴포넌트 (Avatar, Badge, Button, Card)
  4. AppShell (BottomTab + Header)

Phase 2: 프로필 (앱의 심장)
  5. ProfileCard 컴포넌트
  6. 요약 탭 (Featured + StatCard + Medal)
  7. 스킬 탭 (TagAccordion)
  8. 기록 탭 (Stats + Medals + SeasonTimeline)
  9. 프로필 편집 (인라인 편집)

Phase 3: 피드 & 소셜
  10. FeedCard (6종 타입)
  11. 홈 피드 페이지
  12. 응원(Kudos) + 댓글

Phase 4: 탐색 & 팀
  13. 탐색 페이지 (검색 + 인기 + 추천)
  14. 팀 허브 + 팀 상세
  15. 팀 공개 프로필

Phase 5: 플로우
  16. 온보딩 (카카오 SSO)
  17. 영상 업로드 플로우
  18. 측정 기록 + 메달 부여
  19. 알림 시스템
  20. 공유 (OG 이미지 + 카카오톡)
```

### 11.5 Claude Code 프롬프트 팁
이 디자인 시스템 파일을 프로젝트 루트에 `DESIGN-SYSTEM.md`로 저장하고,
Claude Code에서 작업 시 다음과 같이 참조:

```
"DESIGN-SYSTEM.md를 참고해서 ProfileCard 컴포넌트를 만들어줘.
피치 블랙 골드 테마의 컬러와 타이포그래피를 정확히 따라야 해."
```

---

## 12. 기획서 기능 체크리스트 (v1 범위)

Claude Code 개발 시 아래 기능들이 모두 포함되었는지 확인:

### 인증 & 온보딩
- [ ] 카카오 SSO 로그인
- [ ] 역할 분기 온보딩 (선수/부모/기타)
- [ ] 핸들 설정 (중복 체크)

### 프로필
- [ ] 프로필 카드 (사진/이름/포지션/팀/나이/도시)
- [ ] 프로필 레벨 시스템 (Lv.1~5)
- [ ] 프로필 조회수 (본인용)
- [ ] 인라인 편집 (섹션별)
- [ ] 연락처 선택 공개 (설정)
- [ ] 공개 프로필 (/p/{handle})

### 영상 & 하이라이트
- [ ] 영상 업로드 (최대 5분, 720p)
- [ ] 태그 지정 (7개 태그)
- [ ] 스마트 트리밍 하이라이트 (30초)
- [ ] Featured 하이라이트 (1~3, Progressive Disclosure)
- [ ] 태그별 Top Clip (첫 클립 자동)
- [ ] 업로드 대기 중 크로스 액션 유도

### 측정 & 메달
- [ ] 측정 기록 입력
- [ ] 메달 자동 부여
- [ ] 증거 영상 첨부
- [ ] 팀 검증 (Verified)
- [ ] 메달 카카오톡 공유

### 피드
- [ ] 피드 카드 6종 자동 생성
- [ ] 응원 (Kudos) 👏
- [ ] 댓글
- [ ] 팔로우

### 탐색
- [ ] 검색 (선수/핸들/팀)
- [ ] 최근 업로드 → 인기 하이라이트
- [ ] 최근 메달 달성
- [ ] 추천 선수

### 팀
- [ ] 팀 생성 (누구나)
- [ ] 초대코드 가입
- [ ] 팀 프로필 (로고/소개/멤버)
- [ ] 팀 앨범 (사진/영상)
- [ ] 앨범→내 프로필 가져오기
- [ ] 팀 공개 프로필 (/t/{handle})

### 부모 계정
- [ ] 부모 역할 (열람+업로드)
- [ ] 자녀 바로가기 카드
- [ ] 빠른 업로드 (3스텝)

### 공유
- [ ] 프로필 공유 링크
- [ ] 하이라이트 개별 공유
- [ ] 팀 프로필 공유
- [ ] 메달 공유
- [ ] 카카오톡 OG 이미지 최적화

### 알림
- [ ] 푸시 알림 (FCM)
- [ ] 인앱 알림
- [ ] 알림 센터

### 설정
- [ ] 계정 설정
- [ ] 부모/자녀 연동
- [ ] 알림 설정
- [ ] 차단/신고
- [ ] 연락처 공개 설정

---

## 8. v1.1 신규 컴포넌트 패턴

### 8.1 MVP 투표 카드 (VoteCard)

```
┌───────────────────────────┐
│ 📹 영상 썸네일 (자동재생)   │
│                           │
│         🏆 현재 1위        │    ← 순위 오버레이 (골드)
│                           │
│ 배준혁 · 부산IP U-15      │    ← text-1, font-body, 14px
│ 1v1 돌파                  │    ← text-2, 12px
│                           │
│ ⚡ 847점                   │    ← Oswald, text-1, 16px bold
│ 👁 312 · 👏 89 · 🗳 47    │    ← text-3, 12px
│              [투표하기]    │    ← 골드 CTA (primary button)
└───────────────────────────┘
bg: card (#161618)
border: 1px solid rgba(212,168,83,0.2) — 은은한 골드 보더
radius: 12px
1위: border 2px solid accent, 골드 그라데이션 상단 바
```

### 8.2 MVP 카드 (MvpCard — EA FC In-Form 스타일)

```
┌─────────────────────┐
│ 🏆 WEEKLY MVP       │    ← Rajdhani, 골드, 12px uppercase
│                     │
│     ┌─────────┐     │
│     │  📹     │     │    ← 대표 영상 썸네일 (1:1)
│     │         │     │       border: 2px solid accent
│     └─────────┘     │
│                     │
│  배준혁              │    ← font-body, text-1, 16px bold
│  FW · 부산IP U-15   │    ← text-2, 12px
│  ⚡ 847점            │    ← Oswald, accent, 14px
│                     │
│  🏆×3  Lv.4 에이스  │    ← text-3, 11px
│                     │
│  3.03 ~ 3.09 주차    │    ← text-3, 10px
└─────────────────────┘
bg: linear-gradient(135deg, #1a1510 0%, #161618 50%, #1a1510 100%)
border: 1px solid rgba(212,168,83,0.3)
radius: 14px
box-shadow: 0 0 20px rgba(212,168,83,0.1)
```

### 8.3 선수 랭킹 카드 (PlayerRankingRow)

```
┌───────────────────────────────────────────┐
│ 1  (아바타) 김민준                         │    ← 순위(Oswald)+아바타+이름(bold)
│    FW · 수원FC U-15                       │    ← text-2, 12px
│    🏆MVP 5회 · 👑 올스타                   │    ← accent, 11px (있을 때만)
│    👏 342 · 👁 1.2k           [팔로우]    │    ← text-3 + 골드 ghost 버튼
└───────────────────────────────────────────┘
bg: card
border-bottom: 1px solid card-alt
padding: 12px 16px
```

### 8.4 팔로우 버튼 (FollowButton)

```
미팔로우: [팔로우]   ← ghost 버튼, border: accent, text: accent
팔로잉:  [팔로잉 ✓] ← filled, bg: card-alt, text: text-2

크기: 56px × 28px, radius: 14px, font-size: 12px
```

### 8.5 이번 주 베스트 캐러셀 (BestCarousel)

```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 📹 │ │ 📹 │ │ 📹 │ │ 📹 │→
│    │ │    │ │    │ │    │
│민준│ │현우│ │지호│ │시우│      ← text-1, 12px bold
│슈팅│ │돌파│ │패스│ │수비│      ← text-3, 10px
└────┘ └────┘ └────┘ └────┘
카드 크기: 120px × 160px (3:4)
간격: 8px
bg: card, radius: 10px
하단 그라데이션 오버레이 (black → transparent)
```

### 8.6 MVP 뱃지 (프로필용)

```
MVP 등급별 디자인:
  ⭐ 루키 (1회)    — text-2 컬러, 작은 뱃지
  🌟 에이스 (3회)   — accent 컬러, 중간 뱃지
  👑 올스타 (5회)   — accent + 글로우, 큰 뱃지
  💎 레전드 (10회)  — accent + 강한 글로우 + 특별 보더

프로필 카드 내 위치: 이름 오른쪽 또는 이름 아래
형태: 인라인 뱃지, height: 20px, radius: 10px, font-size: 11px
```
