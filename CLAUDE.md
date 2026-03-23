# FOOTORY — 유스 축구 선수 프로필 플랫폼

## 응답 언어
- **항상 한글로 응답할 것.** 코드 주석/변수명은 영어, 대화와 설명은 한글.

## 프로젝트 개요
유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오를 관리하는 모바일 웹앱.
프로필이 앱의 심장이며, 선수·부모·스카우터가 주요 사용자.
다크 테마 전용 (피치 블랙 골드).

> **v1.2 현재**: 5탭 네비(홈/MVP/탐색/프로필/팀), 주간 MVP 투표, 선수·팀 랭킹, 추천 피드,
> 부모 대시보드, DM, 알림, 스카우트 관심목록, 영상 렌더 파이프라인

## 기술 스택
- **프론트**: Next.js (App Router, TypeScript)
- **스타일**: Tailwind CSS v4 (`globals.css`의 `@theme inline` 블록 — `tailwind.config.ts` 없음)
- **백엔드**: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
- **영상**: Cloudflare R2 (저장) + CDN (서빙) — 이그레스 무료
- **배포**: Vercel
- **인증**: 카카오 SSO + 이메일/비밀번호 (Supabase Auth)
- **상태관리**: Zustand (업로드 상태), React hooks (나머지)
- **알림**: FCM (Web Push)

## 필수 참고 문서 (반드시 읽을 것)
1. `docs/DESIGN-SYSTEM.md` — 디자인 토큰, 컬러, 타이포, 컴포넌트 패턴
2. `docs/SPEC.md` — 전체 기획서 (화면설계, 기능 명세, 에러 처리)
3. `docs/ARCHITECTURE.md` — DB 스키마, API 구조, 영상 파이프라인
4. `docs/PROGRESS.md` — 현재 진행 상황 (완료/진행중/미착수)
5. `docs/sprints/` — 현재 스프린트 작업 명세

## 도메인별 필수 문서
> 아래 파일을 수정하거나 관련 기능을 작업할 때 반드시 해당 문서를 먼저 읽을 것.

- **영상 업로드** (`src/lib/upload-service.ts`, `src/components/upload/`, `src/app/upload/`, `src/app/api/upload/`):
  → `docs/UPLOAD-ARCHITECTURE.md` **반드시 읽을 것** — 핵심 상수(MULTIPART_THRESHOLD, CHUNK_SIZE 등) 변경 금지 이유, 과거 실수 목록 포함

## 코딩 규칙
1. 모든 컴포넌트는 TypeScript (.tsx)
2. 스타일은 Tailwind 유틸리티 + `src/app/globals.css`의 CSS 변수
3. **Tailwind v4**: `tailwind.config.ts` 없음, `@theme inline` 블록으로 토큰 관리
4. **라우트 보호**: `src/proxy.ts` (Next.js의 `middleware.ts` 대신 사용)
5. 다크 모드만 (라이트 모드 없음, bg 기본값 = `#0A0A0C`)
6. 모바일 퍼스트 (max-width: 430px, 중앙 정렬)
7. UI 텍스트는 한글, 변수명/주석은 영어
8. 숫자/스탯은 Oswald 폰트, 브랜드/헤드라인은 Rajdhani, 본문은 Noto Sans KR
9. 커밋: `[Sprint-XX] 기능명: 상세`
10. Supabase 클라이언트: 브라우저 → `src/lib/supabase/client.ts`, 서버 → `src/lib/supabase/server.ts`

## 디자인 핵심 규칙 (v2.1)
- 배경 레이어: `#0A0A0C` → `#1A1A1E` → `#222226` → `#2A2A2E` (대비 강화)
- 카드: `card-elevated` 클래스 = `bg-card` + `box-shadow: var(--card-shadow)` + `rounded-12`
- 헤더/바텀탭: `glass-nav` 클래스 (backdrop-blur + 반투명)
- Border: `rgba(255,255,255,0.08)` (하드 컬러 대신 투명도 기반)
- 액센트: `#D4A853` (골드) — 버튼, 활성 상태, CTA
- 텍스트: `#FAFAFA`(주요) / `#A1A1AA`(보조) / `#71717A`(비활성)
- Radius: `--radius-sm: 6px` / `--radius-lg: 12px`
- **바텀 네비: 🏠홈 | 🏆MVP | 🔍탐색 | 👤프로필 | 👥팀 (5탭)**

## 5탭 네비게이션
| 탭 | 라우트 | 역할 |
|----|--------|------|
| 🏠 홈 | `/` | 추천 피드 + 역할별 뷰 (player/parent/scout) |
| 🏆 MVP | `/mvp` | 주간 MVP 투표 + 순위 + 아카이브 + 명예의 전당 |
| 🔍 탐색 | `/discover` | 선수·팀 랭킹 + 검색 + 태그 그리드 + 떠오르는 선수 |
| 👤 프로필 | `/profile` | 내 프로필 관리 V5 (하이라이트/기록/커리어 3탭) |
| 👥 팀 | `/team` | 팀 허브 + 현재/이전 소속 분리 |

## 현재 작업
`docs/sprints/` 폴더의 최신 스프린트 파일을 확인할 것.
작업 완료 시 `docs/PROGRESS.md` 체크리스트 업데이트할 것.

진행 중:
- 프로필 V5 리디자인 (3탭: 하이라이트/기록/커리어) — `src/components/profile/`
- 렌더 파이프라인 (이펙트, 스킬 라벨) — `src/components/video/`

## 프로젝트 구조
```
src/
├── proxy.ts                     # Auth + 라우트 보호 (middleware.ts 대신)
├── app/
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 홈 (추천 피드)
│   ├── globals.css              # CSS 변수, Tailwind v4 @theme, 폰트, 애니메이션
│   ├── manifest.ts              # PWA manifest
│   ├── (main)/
│   │   └── notifications/page.tsx
│   ├── mvp/page.tsx             # MVP 투표 + 순위
│   ├── discover/page.tsx        # 탐색 (랭킹 + 검색)
│   ├── profile/
│   │   ├── page.tsx             # 내 프로필 V5 (3탭)
│   │   ├── settings/page.tsx    # 프로필 설정
│   │   ├── follows/page.tsx     # 팔로우/팔로워 목록
│   │   ├── watchlist/page.tsx   # 스카우트 관심목록
│   │   └── children/page.tsx    # 부모: 자녀 목록
│   ├── team/
│   │   ├── page.tsx             # 팀 허브
│   │   └── [id]/
│   │       ├── page.tsx         # 팀 상세
│   │       └── settings/page.tsx # 팀 설정 (관리자)
│   ├── upload/page.tsx          # 영상 업로드 위저드
│   ├── dm/
│   │   ├── page.tsx             # DM 목록
│   │   └── [conversationId]/page.tsx # DM 대화
│   ├── p/[handle]/              # 공개 선수 프로필 SSR
│   │   ├── page.tsx
│   │   ├── client.tsx
│   │   └── opengraph-image.tsx
│   ├── t/[handle]/              # 공개 팀 프로필 SSR
│   │   ├── page.tsx
│   │   ├── client.tsx
│   │   └── opengraph-image.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── onboarding/page.tsx      # 역할별 온보딩 (player/parent/scout)
│   ├── auth/
│   │   ├── callback/route.ts
│   │   ├── confirm/route.ts
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── admin/video-lab/page.tsx # 영상 가공 랩
│   └── api/                     # 50+ API Route Handlers
│       ├── clips/, feed/, follows/, highlights/, mvp/
│       ├── notifications/, parent/, profile/, seasons/
│       ├── stats/, teams/, timeline/, upload/, watchlist/
│       ├── achievements/, coach-reviews/, discover/
│       ├── render/, reports/, social/, push/
│       └── admin/video-lab/
├── components/
│   ├── ui/                      # Avatar, Badge, Button, Card, EmptyCTA,
│   │                            # ErrorBoundary, LazyVideo, PillTabs, Toast
│   ├── layout/                  # AppHeader, AppShell, BottomTab, ProfileHydrator
│   ├── profile/                 # HeroSection, ProfileTabBar, HighlightsTabV5,
│   │                            # RecordsTabV5, CareerTabV5, VerifyBadge, TournamentTypeBadge
│   ├── player/                  # ProfileCard, ProfileEditSheet, ProfileTabs,
│   │                            # HighlightsTab, ProfileRadar, RadarChart,
│   │                            # SeasonTimeline, SeasonAddSheet, StatRow,
│   │                            # PlayStyleCard, PlayStyleTest, GrowthCard,
│   │                            # ClipPickerSheet, ClipPlayerSheet, VideoThumb
│   ├── video/                   # VideoTrimmer, EffectsToggle, SkillLabelPicker,
│   │                            # SpotlightPicker, RenderProgress
│   ├── upload/                  # VideoSelector, UploadBottomSheet, TagMemoForm,
│   │                            # UploadComplete, GlobalUploadIndicator, ChildSelector
│   ├── feed/                    # FeedCard, FeedList, UploadNudge
│   ├── mvp/                     # VoteCard, MvpRanking, MvpArchive,
│   │                            # MvpHallOfFame, MvpTeaser, MvpPageClient
│   ├── explore/                 # PlayerRanking, TeamRanking, SearchOverlay,
│   │                            # TagGrid, RisingPlayers
│   ├── social/                  # FollowButton, FollowList, CommentSheet,
│   │                            # ShareSheet, MentionInput, ReportModal, ReactionPicker
│   ├── team/                    # TeamHeader, TeamFeed, MemberList, TeamAlbum,
│   │                            # TeamRecordsTab, CreateTeamSheet, JoinTeamSheet, AlumniLabel
│   ├── parent/                  # ChildDashboard, ChildSelector, WeeklyRecap,
│   │                            # ParentQuickUpload, LinkChildSheet
│   ├── scout/                   # ScoutHome, WatchlistPanel, AddToWatchlistButton
│   ├── dm/                      # ChatBubble, ConversationList, MessageInput,
│   │                            # DmRequestCard, NewConversationSheet
│   ├── notifications/           # NotificationSettings, PushPermissionPrompt
│   ├── auth/                    # KakaoLoginButton, EmailLoginForm,
│   │                            # EmailSignupForm, ForgotPasswordForm
│   ├── onboarding/              # PlayerOnboarding, ParentOnboarding,
│   │                            # ScoutOnboarding, WelcomeModal
│   ├── portfolio/               # AchievementList, ProfilePdfExport
│   ├── home/                    # HomePlayerView
│   ├── stats/                   # StatInputSheet
│   ├── admin/                   # VideoLabClient
│   └── providers/               # ProfileProvider
├── hooks/                       # 22개 커스텀 훅
│   ├── useProfile.ts, useClips.ts, useFeed.ts, useFollow.ts
│   ├── useTeam.ts, useStats.ts, useSeasons.ts, useDm.ts
│   ├── useNotifications.ts, useParent.ts, useDiscover.ts
│   ├── useMvp.ts(서버), usePlayStyle.ts, useRenderJob.ts
│   ├── useRealtimeFeed.ts, useRealtimeMessages.ts
│   └── (기타: useComments, useAchievements, usePermissions 등)
├── stores/
│   └── upload-store.ts          # Zustand: 업로드 진행 상태
├── providers/
│   └── ProfileProvider.tsx      # 프로필 컨텍스트 (SSR → 클라이언트 하이드레이션)
├── types/
│   └── discover.ts              # 탐색 관련 타입
└── lib/
    ├── supabase/
    │   ├── client.ts            # 브라우저 Supabase 클라이언트
    │   ├── server.ts            # 서버 Supabase 클라이언트
    │   └── database.ts          # 자동생성 DB 타입 (Relationships: [] 필수)
    ├── auth.ts                  # signInWithKakao, signUpWithEmail, signOut 등
    ├── auth-guard.ts            # 서버사이드 인증 가드
    ├── types.ts                 # 공통 TypeScript 타입
    ├── constants.ts             # 레벨, 태그, 포지션, MVP 등급 상수
    ├── r2.ts                    # R2 presigned URL (서버 전용)
    ├── r2-client.ts             # R2 SDK 클라이언트
    ├── feed-algorithm.ts        # 추천 피드 알고리즘
    ├── mvp-scoring.ts           # MVP 자동점수 + 투표 합산 로직
    ├── upload-service.ts        # 업로드 오케스트레이션
    ├── render-api.ts            # 렌더 파이프라인 API
    ├── skill-labels.ts          # 스킬 라벨 정의
    ├── notifications.ts         # 알림 유틸
    ├── pdf-generator.ts         # 프로필 PDF 생성
    ├── permissions.ts           # 역할별 권한 체크
    ├── radar-calc.ts            # 레이더 차트 계산
    ├── stat-display.ts          # 스탯 표시 포맷
    ├── media-url.ts             # R2/CDN URL 변환
    ├── utils.ts                 # 공통 유틸리티
    ├── dm.ts, timeline.ts, blocks.ts, video.ts 등
    └── server/                  # 서버 전용 데이터 로직
        ├── feed.ts, mvp.ts
        ├── parent-home.ts, scout-home.ts
```
