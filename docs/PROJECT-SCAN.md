# PROJECT-SCAN.md — Footory 프로젝트 전체 구조 분석

> 생성일: 2026-03-20

---

## 1. 디렉토리 구조 (3레벨, node_modules/.next 제외)

```
footory/
├── .auth/                    # Playwright 인증 상태 저장
├── .claude/                  # Claude Code 설정 + 커맨드
│   ├── commands/             # deploy-check, design-qa, refactor, review, sprint-status, test-cmd
│   └── settings.local.json
├── .github/
│   └── workflows/qa.yml     # CI/CD
├── docs/                     # 기획/설계 문서
│   └── sprints/              # SPRINT-01 ~ SPRINT-26 (38개 파일)
├── public/                   # 정적 에셋 (아이콘, SW, splash)
├── qa-results/               # QA 보고서 (player/parent/scout/FINAL)
├── scripts/                  # 유틸리티 스크립트
│   ├── create-poc-admin.mjs
│   ├── refresh-showcase-data.mjs
│   └── setup-r2-cors.mjs
├── src/
│   ├── __tests__/            # Vitest 유닛 테스트 (7개)
│   ├── app/                  # Next.js App Router 라우트
│   │   ├── (main)/           # 그룹 라우트 (notifications)
│   │   ├── admin/            # 관리자 (video-lab)
│   │   ├── api/              # API Route Handlers (74개 엔드포인트)
│   │   ├── auth/             # 인증 (callback, confirm, forgot/reset-password)
│   │   ├── discover/         # 탐색 페이지
│   │   ├── dm/               # DM (목록 + 대화)
│   │   ├── login/            # 로그인
│   │   ├── mvp/              # MVP 투표
│   │   ├── onboarding/       # 온보딩
│   │   ├── p/[handle]/       # 공개 프로필 (SSR + OG이미지)
│   │   ├── profile/          # 내 프로필 (children/follows/settings/watchlist)
│   │   ├── signup/           # 회원가입
│   │   ├── t/[handle]/       # 팀 공개 페이지 (SSR + OG이미지)
│   │   ├── team/             # 팀 허브 ([id]/settings)
│   │   └── upload/           # 업로드
│   ├── components/           # UI 컴포넌트 (117개 TSX)
│   │   ├── admin/            # VideoLabClient
│   │   ├── auth/             # KakaoLoginButton, EmailLoginForm, EmailSignupForm, ForgotPasswordForm
│   │   ├── challenge/        # ChallengeRanking
│   │   ├── dm/               # ChatBubble, ConversationList, DmRequestCard, MessageInput, NewConversationSheet, SentRequestCard
│   │   ├── explore/          # PlayerRanking, RisingPlayers, SearchOverlay, TagGrid, TeamRanking
│   │   ├── feed/             # FeedCard, FeedList, UploadNudge
│   │   ├── home/             # HomePlayerView
│   │   ├── layout/           # AppHeader, AppShell, BottomTab, ProfileHydrator
│   │   ├── mvp/              # MvpArchive, MvpHallOfFame, MvpPageClient, MvpPageSkeleton, MvpRanking, MvpTeaser, MvpThumbnail, VoteCard
│   │   ├── notifications/    # NotificationSettings, PushPermissionPrompt
│   │   ├── onboarding/       # PlayerOnboarding, ParentOnboarding, ScoutOnboarding, WelcomeModal
│   │   ├── parent/           # ChildDashboard, ChildSelector, LinkChildSheet, ParentQuickUpload, WeeklyRecap
│   │   ├── player/           # ProfileCard, ProfileTabs, StatRow, RadarChart 등 (20개)
│   │   ├── portfolio/        # AchievementList, GrowthTimeline, ProfilePdfExport
│   │   ├── scout/            # AddToWatchlistButton, ScoutHome, WatchlistPanel
│   │   ├── social/           # CommentSheet, FollowButton, FollowList, MentionInput, ReactionPicker, ReportModal, ShareSheet
│   │   ├── stats/            # StatInputSheet, StatReportSheet
│   │   ├── team/             # AlumniLabel, CreateTeamSheet, JoinTeamSheet, MemberList, TeamAlbum, TeamFeed, TeamHeader, TeamRecordsTab
│   │   ├── ui/               # Avatar, Badge, Button, Card, EmptyCTA, ErrorBoundary, LazyVideo, PillTabs, sonner, Toast
│   │   ├── upload/           # ChildSelector, TagMemoForm, UploadBottomSheet, UploadComplete, VideoSelector
│   │   └── video/            # BgmPicker, ClipSelector, EffectsToggle, FootoryPlayer, ReelTimeline, RenderProgress, SkillLabelPicker, SlowmoPicker, SpotlightPicker, VideoTrimmer
│   ├── hooks/                # 커스텀 훅 (25개)
│   ├── lib/                  # 유틸리티/비즈니스 로직 (30+ 파일)
│   │   ├── server/           # 서버 전용 (feed, mvp, parent-home, scout-home)
│   │   └── supabase/         # client, server, database 타입
│   ├── providers/            # ProfileProvider
│   ├── proxy.ts              # Auth 미들웨어 (Next.js 16 proxy)
│   ├── stores/               # Zustand (upload-store)
│   └── types/                # discover.ts
├── supabase/
│   └── migrations/           # SQL 마이그레이션 (001 ~ 034 + 날짜 패치 4개)
├── tests/
│   ├── e2e/                  # Playwright E2E 테스트
│   ├── fixtures/             # 테스트 픽스처
│   └── visual/               # 비주얼 테스트
├── CLAUDE.md                 # 프로젝트 규칙
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── wrangler.jsonc            # Cloudflare Workers 설정
```

---

## 2. 주요 페이지/라우트 목록

### 페이지 (page.tsx) — 22개

| 라우트 | 역할 |
|--------|------|
| `/` | 홈 — 역할별 뷰 (선수 피드/부모 대시보드/스카우트 홈) |
| `/login` | 로그인 (카카오 + 이메일) |
| `/signup` | 이메일 회원가입 |
| `/onboarding` | 온보딩 (역할별 분기: 선수/부모/스카우트) |
| `/auth/forgot-password` | 비밀번호 찾기 |
| `/auth/reset-password` | 비밀번호 재설정 |
| `/profile` | 내 프로필 (3탭: 요약/스킬/기록) |
| `/profile/settings` | 프로필 설정 |
| `/profile/follows` | 팔로잉/팔로워 목록 |
| `/profile/children` | 부모: 연결된 자녀 관리 |
| `/profile/watchlist` | 스카우트: 관심 선수 목록 |
| `/p/[handle]` | 공개 프로필 (SSR + OG 이미지) |
| `/discover` | 탐색 — 선수/팀 랭킹 + 검색 + 태그 |
| `/mvp` | 주간 MVP 투표 + 순위 + 아카이브 |
| `/team` | 팀 허브 (내 팀 목록) |
| `/team/[id]` | 팀 상세 (피드/앨범/기록/멤버) |
| `/team/[id]/settings` | 팀 설정 |
| `/t/[handle]` | 팀 공개 페이지 (SSR + OG 이미지) |
| `/upload` | 영상 업로드 |
| `/dm` | DM 목록 |
| `/dm/[conversationId]` | DM 대화 |
| `/admin/video-lab` | 관리자 비디오 랩 |
| `/(main)/notifications` | 알림 센터 |

### API Route Handlers — 74개

| 그룹 | 경로 | 역할 |
|------|------|------|
| **프로필** | `/api/profile` | GET/PUT 프로필 |
| | `/api/profile/avatar` | 아바타 업로드 |
| | `/api/profile/handle-check` | 핸들 중복 확인 |
| | `/api/profile/search` | 프로필 검색 |
| | `/api/profile/linked-parents` | 연결된 부모 조회 |
| **클립/영상** | `/api/clips`, `/api/clips/[id]` | 클립 CRUD |
| | `/api/highlights` | 하이라이트 조회 |
| | `/api/featured` | 피처드 클립 |
| | `/api/upload/presign` | R2 presigned URL |
| | `/api/upload/direct` | 직접 업로드 |
| | `/api/upload/multipart` | 멀티파트 업로드 |
| **스탯** | `/api/stats`, `/api/stats/[id]` | 스탯 CRUD |
| | `/api/stats/percentile` | 백분위 |
| | `/api/stats/team-rank` | 팀 내 순위 |
| **피드/소셜** | `/api/feed` | 피드 |
| | `/api/feed/[id]/kudos` | 칭찬 |
| | `/api/feed/[id]/comments` | 댓글 |
| | `/api/follows`, `/api/follows/recommend` | 팔로우 |
| | `/api/social/mention-candidates` | 멘션 후보 |
| **MVP** | `/api/mvp/candidates` | MVP 후보 |
| | `/api/mvp/vote` | 투표 |
| | `/api/mvp/finalize` | 주간 결산 |
| | `/api/mvp/archive` | 아카이브 |
| | `/api/mvp/hall-of-fame` | 명예의 전당 |
| | `/api/mvp/notify` | MVP 알림 |
| **탐색** | `/api/discover/*` | 선수/팀/하이라이트/랭킹/검색/태그 |
| **팀** | `/api/teams/*` | 팀 CRUD + 멤버/앨범/피드/기록 |
| **알림** | `/api/notifications/*` | 알림 CRUD/읽음/설정/카운트 |
| **부모** | `/api/parent/*` | 대시보드/연결/리캡/업로드 |
| **기타** | `/api/achievements`, `/api/timeline`, `/api/seasons` | 수상/타임라인/시즌 |
| | `/api/coach-reviews` | 스카우트 리뷰 |
| | `/api/watchlist` | 관심 선수 |
| | `/api/play-style` | 플레이 스타일 |
| | `/api/render`, `/api/bgm` | 렌더/BGM |
| | `/api/push/token`, `/api/reports/stat` | 푸시/신고 |
| | `/api/onboarding` | 온보딩 |
| | `/api/admin/video-lab/*` | 관리자 비디오 |
| **인증** | `/auth/callback`, `/auth/confirm` | OAuth/이메일 콜백 |

---

## 3. 핵심 라이브러리 및 버전

### Dependencies

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| next | 16.1.6 | App Router 프레임워크 |
| react / react-dom | 19.2.3 | UI |
| @supabase/supabase-js | ^2.98.0 | Supabase 클라이언트 |
| @supabase/ssr | ^0.9.0 | Supabase SSR 통합 |
| @aws-sdk/client-s3 | ^3.1000.0 | R2 파일 업로드 |
| @aws-sdk/s3-request-presigner | ^3.1000.0 | Presigned URL |
| zustand | ^5.0.11 | 상태 관리 (업로드) |
| lucide-react | ^0.577.0 | 아이콘 |
| class-variance-authority | ^0.7.1 | 컴포넌트 변형 |
| clsx | ^2.1.1 | 클래스 병합 |
| tailwind-merge | ^3.5.0 | Tailwind 클래스 충돌 해결 |
| sonner | ^2.0.7 | 토스트 알림 |
| cmdk | ^1.1.1 | 커맨드 팔레트 |
| @base-ui/react | ^1.2.0 | Base UI 프리미티브 |
| html2canvas | ^1.4.1 | PDF 내보내기 |
| jspdf | ^4.2.0 | PDF 생성 |
| shadcn | ^4.0.0 | UI 컴포넌트 시스템 |
| @opennextjs/cloudflare | ^1.17.1 | Cloudflare 배포 어댑터 |

### DevDependencies

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| typescript | ^5 | 타입 시스템 |
| tailwindcss | ^4 | Tailwind v4 (CSS 기반 설정) |
| @tailwindcss/postcss | ^4 | PostCSS 플러그인 |
| vitest | ^4.0.18 | 유닛 테스트 |
| @playwright/test | ^1.58.2 | E2E 테스트 |
| @testing-library/react | ^16.3.2 | 컴포넌트 테스트 |
| eslint / eslint-config-next | ^9 / ^16 | 린팅 |
| prettier | ^3.8.1 | 포매팅 |
| wrangler | ^4.73.0 | Cloudflare Workers CLI |
| vercel | ^50.33.1 | Vercel CLI |

---

## 4. Supabase 테이블 구조

`src/lib/supabase/database.ts` 기준 — **33개 테이블 + 2개 RPC 함수**

### 핵심 테이블

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `profiles` | id, role, handle, name, position, level, xp, mvp_count, mvp_tier | 사용자 프로필 |
| `clips` | id, owner_id, video_url, thumbnail_url, skill_labels, render_job_id, bgm_id | 영상 클립 |
| `clip_tags` | clip_id, tag_name, is_top | 클립-태그 매핑 |
| `featured_clips` | profile_id, clip_id, sort_order | 피처드 하이라이트 |
| `highlights` | owner_id, clip_ids[], rendered_url, status | 멀티 클립 하이라이트 |
| `stats` | profile_id, stat_type, value, unit, verified | 선수 스탯/기록 |
| `medals` | profile_id, medal_code, stat_id | 메달 획득 |
| `medal_criteria` | code, stat_type, threshold, comparison | 메달 기준 마스터 |

### 팀

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `teams` | id, handle, name, logo_url, invite_code | 팀 |
| `team_members` | team_id, profile_id, role (admin/member/alumni) | 팀 멤버십 |
| `team_albums` | team_id, media_type, media_url | 팀 앨범 |

### 소셜/피드

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `follows` | follower_id, following_id | 팔로우 관계 |
| `feed_items` | profile_id, type, reference_id, metadata | 피드 아이템 |
| `kudos` | feed_item_id, user_id, reaction | 칭찬/리액션 |
| `comments` | feed_item_id, user_id, content, parent_id | 댓글 (대댓글) |

### MVP/랭킹

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `weekly_votes` | voter_id, clip_id, week_start | MVP 투표 |
| `weekly_mvp_results` | week_start, rank, profile_id, total_score | MVP 결과 |
| `player_ranking_cache` | profile_id, popularity_score, weekly_change | 선수 랭킹 캐시 |
| `team_ranking_cache` | team_id, activity_score, mvp_count | 팀 랭킹 캐시 |

### DM/안전

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `conversations` | participant_1, participant_2 | DM 대화 |
| `messages` | conversation_id, sender_id, content | DM 메시지 |
| `dm_requests` | sender_id, receiver_id, status | DM 요청 |
| `blocks` | blocker_id, blocked_id | 차단 |
| `reports` | reporter_id, reported_id, category, status | 신고 |

### 알림/푸시

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `notifications` | user_id, type, title, body, action_url, read | 알림 |
| `notification_preferences` | profile_id, push_enabled, kudos, comments 등 | 알림 설정 |
| `push_tokens` | profile_id, token, platform | 푸시 토큰 |
| `fcm_tokens` | user_id, token (레거시) | FCM 토큰 |

### 기타

| 테이블 | 주요 컬럼 | 역할 |
|--------|----------|------|
| `seasons` | profile_id, year, team_name, is_current | 시즌 기록 |
| `parent_links` | parent_id, child_id, consent_given | 부모-자녀 연결 |
| `coach_verifications` | profile_id, method, status | 스카우트 인증 |
| `coach_reviews` | coach_id, clip_id, rating, comment | 스카우트 리뷰 |
| `achievements` | profile_id, title, competition, year | 수상 이력 |
| `timeline_events` | profile_id, event_type, event_data | 타임라인 |
| `challenges` | title, skill_tag, week_start, is_active | 챌린지 |
| `quest_progress` | profile_id, quest_type, quest_key | 퀘스트 진행 |
| `stat_audit_log` | stat_id, action, old_value, new_value | 스탯 변경 이력 |
| `render_jobs` | clip_id, status, progress, input_key | 렌더 작업 |
| `skill_labels` | id, label_ko, category | 스킬 라벨 마스터 |
| `bgm_tracks` | title, category, r2_key, duration_sec | BGM 트랙 |
| `scout_watchlist` | scout_id, player_id, note | 스카우트 관심 선수 |

### DB Functions
- `increment_xp(profile_id, amount)` — XP 증가
- `increment_views(profile_id)` — 조회수 증가

---

## 5. 문서 파일 목록

### 프로젝트 루트
| 파일 | 위치 |
|------|------|
| `CLAUDE.md` | 루트 — 프로젝트 규칙/코딩 가이드 |
| `README.md` | 루트 |

### docs/ — 핵심 문서 (10개)
| 파일 | 역할 |
|------|------|
| `SPEC-v1.2.md` | 전체 기획서 (화면설계, 기능 명세) |
| `ARCHITECTURE-v1.2.md` | DB 스키마, API 구조, 영상 파이프라인 |
| `DESIGN-SYSTEM-v1.2.md` | 디자인 토큰, 컬러, 타이포, 컴포넌트 패턴 |
| `PROGRESS-v1.2.md` | 진행 상황 체크리스트 |
| `FOOTORY-v1.2-최종-기획안.md` | v1.2 최종 기획 |
| `FOOTORY-v1.2-실행가이드.md` | v1.2 실행 가이드 |
| `QA-LOOP.md` | QA 루프 가이드 |
| `PARALLEL-GUIDE.md` | 병렬 작업 가이드 |
| `MODEL-AND-TOOLS-GUIDE.md` | 모델/도구 가이드 |
| `GAP-ANALYSIS.md` | 갭 분석 (git 미추적) |

### docs/sprints/ — 스프린트 문서 (38개)
`SPRINT-01` ~ `SPRINT-26` + 변형: `11b`, `11b-v2`, `11c`, `15b`, `16b`

### qa-results/ — QA 보고서 (4개)
`player-report.md`, `parent-report.md`, `scout-report.md`, `FINAL-QA-REPORT.md`

### .claude/commands/ — Claude 커맨드 (6개)
`deploy-check.md`, `design-qa.md`, `refactor.md`, `review.md`, `sprint-status.md`, `test-cmd.md`

---

## 6. 사용되지 않는 것으로 보이는 파일/컴포넌트

### 미사용 가능성 높음 (import 확인 결과)

| 컴포넌트 | 파일 | 상태 |
|----------|------|------|
| `UploadNudge` | `feed/UploadNudge.tsx` | 어디에서도 import 안 됨 |
| `UploadBottomSheet` | `upload/UploadBottomSheet.tsx` | upload/page.tsx에서 미사용 |
| `ChildSelector` (upload/) | `upload/ChildSelector.tsx` | parent/ChildSelector와 중복 가능 |
| `MvpThumbnail` | `mvp/MvpThumbnail.tsx` | 사용처 불명 |
| `ReelTimeline` | `video/ReelTimeline.tsx` | 연결 여부 불명 |
| `ClipSelector` (video/) | `video/ClipSelector.tsx` | 사용처 불명 |
| `StatRow` | `player/StatRow.tsx` | 다른 컴포넌트에서 참조 없음 |
| `ClipPickerSheet` | `player/ClipPickerSheet.tsx` | 사용처 불명 |
| `FeaturedSlot` | `player/FeaturedSlot.tsx` | 사용처 불명 |
| `TagAccordion` | `player/TagAccordion.tsx` | 사용처 불명 |
| `TagEditSheet` | `player/TagEditSheet.tsx` | 사용처 불명 |
| `SeasonAddSheet` | `player/SeasonAddSheet.tsx` | 사용처 불명 |
| `CompareSheet` | `player/CompareSheet.tsx` | 사용처 불명 |
| `GrowthCard` | `player/GrowthCard.tsx` | 사용처 불명 |
| `PlayStyleCard` | `player/PlayStyleCard.tsx` | 사용처 불명 |
| `ProfileEditSheet` | `player/ProfileEditSheet.tsx` | 사용처 불명 |
| `AddToWatchlistButton` | `scout/AddToWatchlistButton.tsx` | 사용처 불명 |
| `WeeklyRecap` | `parent/WeeklyRecap.tsx` | 사용처 불명 |
| `ParentQuickUpload` | `parent/ParentQuickUpload.tsx` | 사용처 불명 |
| `NewConversationSheet` | `dm/NewConversationSheet.tsx` | 사용처 불명 |
| `CommentSheet` | `social/CommentSheet.tsx` | 사용처 불명 |
| `MentionInput` | `social/MentionInput.tsx` | 사용처 불명 |

> **주의**: 위 컴포넌트들은 `@/components/` 기준 grep 결과. 일부는 **같은 폴더 내 다른 컴포넌트에서 상대경로 import**되거나, **dynamic import**로 사용 중일 수 있음. 삭제 전 반드시 개별 확인 필요.

### 레거시 잔존물

| 항목 | 설명 |
|------|------|
| `fcm_tokens` 테이블 | `push_tokens`과 중복. FCM 전용 레거시 |
| `coach_reviews` 테이블/API | "coach" → "scout" 리네임 됐으나 DB/API 경로는 미변경 |
| `coach_verifications` 테이블 | 동일 — "coach" 명칭 잔존 |

---

## 7. 코드 패턴 일관성 이슈

### 7.1 네이밍 컨벤션 혼재 (snake_case vs camelCase)

| 파일 | 스타일 | 예시 |
|------|--------|------|
| `src/lib/types.ts` | **camelCase** | `playerId`, `videoUrl`, `avatarUrl` |
| `src/types/discover.ts` | **snake_case** | `avatar_url`, `logo_url`, `member_count` |
| `src/lib/supabase/database.ts` | **snake_case** | DB 컬럼 그대로 (정상) |

`types.ts`는 DB → camelCase 변환한 앱 타입, `discover.ts`는 DB snake_case 그대로 사용. 변환 규칙 불일치.

### 7.2 Toast import 경로 혼재

```
// 패턴 A — sonner 직접 (7곳)
import { toast } from "sonner";
// 사용: p/[handle]/client, profile/page, ParentOnboarding, PlayerOnboarding,
//       ScoutOnboarding, StatReportSheet, MvpPageClient

// 패턴 B — 래퍼 컴포넌트 (6곳)
import { toast } from "@/components/ui/Toast";
// 사용: profile/settings/page, ProfileEditSheet, ProfileCard,
//       ProfilePdfExport, AchievementList, CommentSheet, ShareSheet
```

`Toast.tsx`는 sonner를 래핑하는 얇은 레이어. 하나로 통일 필요.

### 7.3 "coach" vs "scout" 용어 불일치

역할이 `player | parent | scout`로 정리됐으나:
- **테이블명**: `coach_reviews`, `coach_verifications` (coach 잔존)
- **API 경로**: `/api/coach-reviews/` (coach 잔존)
- **알림 타입**: `"coach_review"` (`notifications.ts`)
- **컬럼명**: `coach_id` (`database.ts`의 `coach_reviews`)

### 7.4 타입 정의 분산

타입이 3곳에 분산:
1. `src/lib/types.ts` — 앱 레벨 타입 (camelCase, 30+ 인터페이스, 373줄)
2. `src/types/discover.ts` — 탐색 전용 타입 (snake_case, 7개)
3. `src/lib/supabase/database.ts` — DB 스키마 타입

`types/` 폴더에 `discover.ts`만 있고, 나머지는 `lib/types.ts`에 몰려 있어 위치 규칙 불일치.

### 7.5 "use client" 과다

22개 페이지 중 **18개가 `"use client"`** 선언. Server Component 이점 미활용.

서버 컴포넌트 페이지: `/` (홈), `/p/[handle]`, `/t/[handle]`, `/mvp` — **4개만**

### 7.6 중복 컴포넌트

| 중복 | 위치 | 비고 |
|------|------|------|
| `ChildSelector` | `upload/` + `parent/` | 유사 역할, 통합 가능 |
| `sonner.tsx` + `Toast.tsx` | `ui/` | shadcn 기본 + 커스텀 래퍼 공존 |
| `r2.ts` + `r2-client.ts` | `lib/` | 서버용 + 클라이언트용이나 `r2-client.ts`는 URL 조합만 |

### 7.7 배포 타겟 혼재

- `@opennextjs/cloudflare` + `wrangler` → Cloudflare 배포
- `vercel` CLI → Vercel 배포
- `CLAUDE.md`: "배포: Vercel"
- `package.json` scripts: `deploy` = `opennextjs-cloudflare build && deploy`

두 배포 타겟이 공존. 실제 프로덕션 타겟 불명확.

### 7.8 컴포넌트 파일명 규칙

대부분 `PascalCase.tsx`이나, `ui/sonner.tsx`만 소문자. shadcn 기본 생성 파일이지만 프로젝트 규칙과 불일치.

### 7.9 FeedItem 타입 불일치

- `lib/types.ts`의 `FeedItem.type`: `"highlight" | "stat" | "team_join" | "season" | "featured_change" | "top_clip"`
- `database.ts`의 `feed_items.type`: `"highlight" | "featured_change" | "medal" | "stat" | "season" | "top_clip"`
- **차이**: 앱 타입에는 `"team_join"` / DB에는 `"medal"` — 서로 다른 값 보유

### 7.10 스프린트 문서 번호 불연속

`SPRINT-11b`, `11b-v2`, `11c`, `15b`, `16b` 등 변형 파일 존재. 스프린트 추적 어려움.
