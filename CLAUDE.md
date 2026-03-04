# FOOTORY — 유스 축구 선수 프로필 플랫폼

## 프로젝트 개요
유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오를 관리하는 모바일 웹앱.
프로필이 앱의 심장이며, 선수·부모·스카우터가 주요 사용자.
다크 테마 전용 (피치 블랙 골드).

> **v1.1 개편**: 5탭 네비(홈/MVP/탐색/프로필/팀), 주간 MVP 투표, 선수·팀 랭킹, 추천 피드

## 기술 스택
- **프론트**: Next.js 14+ (App Router, TypeScript)
- **스타일**: Tailwind CSS (커스텀 토큰 확장) — 다크 모드 전용
- **백엔드**: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
- **영상**: Cloudflare R2 (저장) + CDN (서빙) — 이그레스 무료
- **배포**: Vercel
- **인증**: 카카오 SSO (Supabase Auth OAuth)

## 필수 참고 문서 (반드시 읽을 것)
1. `docs/DESIGN-SYSTEM.md` — 디자인 토큰, 컬러, 타이포, 컴포넌트 패턴
2. `docs/SPEC.md` — 전체 기획서 (화면설계, 기능 명세, 에러 처리)
3. `docs/ARCHITECTURE.md` — DB 스키마, API 구조, 영상 파이프라인
4. `docs/PROGRESS.md` — 현재 진행 상황 (완료/진행중/미착수)
5. `docs/sprints/SPRINT-XX.md` — 현재 스프린트 작업 명세

## 코딩 규칙
1. 모든 컴포넌트는 TypeScript (.tsx)
2. 스타일은 Tailwind 유틸리티 + globals.css의 CSS 변수
3. 다크 모드만 (라이트 모드 없음, bg 기본값 = #0C0C0E)
4. 모바일 퍼스트 (max-width: 430px, 중앙 정렬)
5. UI 텍스트는 한글, 변수명/주석은 영어
6. 숫자/스탯은 Oswald 폰트, 본문은 Noto Sans KR
7. 커밋: `[Sprint-XX] 기능명: 상세`

## 디자인 핵심 규칙
- 배경: `#0C0C0E` (매트 블랙)
- 카드: `#161618` (약간 밝은 블랙)
- 액센트: `#D4A853` (골드) — 버튼, 활성 상태, CTA
- 텍스트: `#FAFAFA`(주요) / `#A1A1AA`(보조) / `#71717A`(비활성)
- 카드 radius: 10~14px
- 프로필 서브탭: 요약 | 스킬 | 기록 (3탭 분리)
- **바텀 네비: 🏠홈 | 🏆MVP | 🔍탐색 | 👤프로필 | 👥팀 (5탭)**

## 5탭 네비게이션 (v1.1)
| 탭 | 라우트 | 역할 |
|----|--------|------|
| 🏠 홈 | `/` | 추천 피드 + 이번 주 베스트 캐러셀 |
| 🏆 MVP | `/mvp` | 주간 MVP 투표 + 순위 + 아카이브 + 보상 |
| 🔍 탐색 | `/explore` | 선수·팀 랭킹 + 검색 + 태그 그리드 + 팔로우 |
| 👤 프로필 | `/profile` | 내 프로필 관리 + 영상 업로드 (앱의 심장) |
| 👥 팀 | `/team` | 팀 허브 + 현재/이전 소속 분리 |

## 현재 작업
`docs/sprints/` 폴더의 최신 스프린트 파일을 확인할 것.
작업 완료 시 `docs/PROGRESS.md` 체크리스트 업데이트할 것.

## 프로젝트 구조
```
src/
├── app/
│   ├── layout.tsx           # AppShell (바텀탭 5개, 헤더)
│   ├── page.tsx             # 홈 (추천 피드)
│   ├── mvp/page.tsx         # MVP (주간 투표 + 순위)
│   ├── explore/page.tsx     # 탐색 (랭킹 + 검색)
│   ├── profile/
│   │   ├── page.tsx         # 내 프로필 (3탭)
│   │   └── [handle]/page.tsx # 공개 프로필
│   └── team/
│       ├── page.tsx         # 팀 허브
│       └── [handle]/page.tsx # 팀 상세
├── components/
│   ├── ui/                  # Avatar, Badge, Button, Card, ProgressBar
│   ├── player/              # ProfileCard, StatCard, MedalBadge, FeaturedSlot, TagAccordion
│   ├── feed/                # FeedCard, FeedList, BestCarousel
│   ├── mvp/                 # VoteCard, MvpRanking, MvpArchive, MvpBadge
│   ├── explore/             # PlayerRanking, TeamRanking, SearchOverlay, TagGrid
│   ├── social/              # FollowButton, FollowList, KudosButton
│   ├── team/                # TeamCard, AlumniLabel
│   └── layout/              # BottomTab, AppHeader, AppShell
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트
│   ├── r2.ts                # R2 업로드 유틸
│   ├── constants.ts         # 레벨, 태그, 포지션, MVP 등급 상수
│   ├── feed-algorithm.ts    # 추천 피드 알고리즘
│   ├── mvp-scoring.ts       # MVP 자동점수 + 투표 합산 로직
│   └── types.ts             # TypeScript 타입
└── styles/
    └── globals.css          # CSS 변수, 폰트 import, 애니메이션
```
