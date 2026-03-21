# GAP-ANALYSIS.md — 기획 vs 구현 갭 분석

> 생성일: 2026-03-19 | 최종 업데이트: 2026-03-20
> 비교 대상: SPEC-v1.2.md, FOOTORY-v1.2-최종-기획안.md, ARCHITECTURE-v1.2.md vs 실제 코드
> 기준: PROJECT-SCAN.md (2026-03-20) + 코드 직접 검증

---

## 1. 문서에는 있지만 구현 안 된 기능

### 심각도: 높음 — 핵심 기능 누락

| # | 기획 출처 | 기획 내용 | 구현 상태 | 상세 |
|---|----------|-----------|----------|------|
| H-01 | SPEC-v1.2 §1 | **바텀탭 탐색→DM 교체** (🏠/🏆/💬DM/👤/👥) | ❌ 미반영 | 현재: 🏠/🏆/**🔍탐색**/👤/프로필. DM은 헤더 아이콘으로만 접근. v1.1 구조 그대로 유지 |
| H-02 | SPEC-v1.2 §1 | **헤더 🔍 검색 아이콘 → 풀스크린 오버레이** | ❌ 미구현 | 현재 헤더: 💬DM + 🔔알림 + ⚙️설정. **🔍 아이콘 자체가 없음**. `/discover`가 독립 페이지로 바텀탭에 존재 |
| H-03 | v1.2 기획안 §2 | **부모 전용 바텀탭 3탭** (🏠/💬DM/⚙️) | ❌ 미반영 | 현재 부모: 🏠/🏆MVP/⬆️업로드/🔍탐색/⚙️내계정 **(5탭)**. 기획의 3탭과 완전히 다름 |
| H-04 | SPEC-v1.2 §2.3 | **코치 인증 시스템 (3가지 방법)**: 팀코드/증빙/추천 | ❌ 미구현 | `coach_verifications` 테이블만 존재. 인증 플로우 UI/API 전무. ScoutOnboarding에도 인증 옵션 없음 |
| H-05 | SPEC.md | **메달 자동 부여** (medal_criteria 기반 판정) | ❌ 미구현 | DB 테이블(medals, medal_criteria) 존재하나 스탯 기록 시 자동 판정 로직/API 없음 |
| H-06 | SPEC.md | **OG 이미지 자동 생성** (EA FC 카드 스타일) | ❌ 미구현 | `p/[handle]/opengraph-image.tsx` 파일 존재하나 EA FC 스타일 카드형 OG 미확인 |
| H-07 | SPEC.md | **하이라이트 개별 공유 URL** (`/p/{handle}/h/{id}`) | ❌ 미구현 | 공유 URL 라우트 자체가 없음 |
| H-08 | SPEC.md | **레벨업 축하 모달 + 피드 자동 게시** | ❌ 미구현 | XP/레벨 계산은 있으나 레벨업 이벤트 감지/축하 UI/피드 자동 게시 없음 |

### 심각도: 중간 — 기획된 기능 부분 구현

| # | 기획 출처 | 기획 내용 | 구현 상태 | 상세 |
|---|----------|-----------|----------|------|
| M-01 | SPEC-v1.2 §7.1 | **주간 챌린지** (홈 배너 + 랭킹 + 뱃지) | ⚠️ 데드코드 | `challenges` 테이블 존재, `ChallengeRanking` 컴포넌트 존재하나 **어디에서도 import 안 됨** (orphan) |
| M-02 | SPEC-v1.2 §7.2 | **퀘스트 시스템** (초보자/주간 체크리스트) | ⚠️ DB만 | `quest_progress` 테이블 존재. **프론트엔드 UI 전무** — 체크리스트, 진행률, 뱃지 화면 없음 |
| M-03 | SPEC-v1.2 §7.3 | **프로필 조회수 표시** ("이번 주 조회 N회") | ⚠️ 데이터만 | `profile_views` 필드 + `increment_views` RPC 존재. **프로필 화면에 표시 안 됨**, 주간 알림도 없음 |
| M-04 | SPEC-v1.2 §3.4 | **카카오 알림톡 2종** (MVP 선정, 부모 리캡) | ❌ 미구현 | 카카오 알림톡 연동 코드 없음. FCM 웹 푸시 토큰 저장만 구현 |
| M-05 | SPEC-v1.2 §3.4 | **FCM 웹 푸시 발송 (send-push)** | ⚠️ 부분 | `push_tokens` 테이블 + `usePushNotification` 훅 존재. **실제 발송 로직(Edge Function) 미구현** |
| M-06 | SPEC-v1.2 §5 | **@멘션 자동완성** | ⚠️ 부분 | `/api/social/mention-candidates` API + `MentionInput` 컴포넌트 존재. 댓글 UI 연동 여부 미확인 |
| M-07 | SPEC-v1.2 §6.2 | **성장 타임라인 자동 생성** | ⚠️ 부분 | `timeline_events` 테이블 + API 존재. 자동 이벤트 생성 **트리거 미확인** |
| M-08 | SPEC-v1.2 §9 | **팀 앨범 삭제 → 멤버 영상 자동 피드** | ❌ 미반영 | `team_albums` 테이블 + TeamAlbum 컴포넌트 + API **여전히 존재**. 기획 변경 미적용 |
| M-09 | SPEC.md | **메달 카카오톡 공유** (축하 화면 + 공유 버튼) | ❌ 미구현 | 메달 획득 축하 화면, 공유 URL 없음 |
| M-10 | SPEC.md | **피드 자동 게시 트리거** | ⚠️ 미확인 | `feed_items` 타입 정의는 있으나 실제 자동 생성 트리거 (스탯 등록→피드, 시즌 추가→피드) 확인 필요 |
| M-11 | SPEC.md | **대기 중 크로스 액션 유도** | ❌ 미구현 | 업로드 완료 후 "스탯 기록해볼까요?" 같은 유도 UI 없음 |

### 심각도: 낮음 — UX 개선사항

| # | 기획 출처 | 기획 내용 | 구현 상태 |
|---|----------|-----------|----------|
| L-01 | SPEC.md | 핸들 중복 시 대안 제안 ("@minjun_07?") | ❌ 중복 체크만, 대안 제안 없음 |
| L-02 | SPEC.md | 영상 업로드 임시 저장 + 재시도 | ❌ 미구현 |
| L-03 | SPEC.md | 비로그인 인터랙션 시 가입 유도 모달 | ❌ 미구현 |
| L-04 | SPEC-v1.2 | DM 누적 3회 신고 → 7일 자동 정지 | ❌ 신고 테이블만 있고 자동 정지 로직 없음 |
| L-05 | SPEC-v1.2 | 코치 리뷰 영상 검색 우선순위 UP | ❌ 검색 가중치 로직 없음 |
| L-06 | v1.2 기획안 | 푸시 권한 요청 타이밍 (첫 업로드 직후) | ⚠️ 설정에서만 가능, 첫 업로드 후 자동 요청 없음 |

---

## 2. 구현되어 있지만 문서화 안 된 기능

| # | 구현 위치 | 기능 | 문서 상태 |
|---|----------|------|----------|
| U-01 | `components/player/PlayStyleTest.tsx` + `hooks/usePlayStyle.ts` + `api/play-style` + constants.ts | **플레이스타일 테스트** — 시나리오 4문항, 4가지 trait(돌파/창의/결정/투지), 4가지 스타일 유형. 온보딩 step 3에 통합 | **완전 미문서화**. SPEC/기획안 어디에도 없음. `play_styles` 테이블이 database.ts에도 미반영 |
| U-02 | `components/player/RadarChart.tsx` + `ProfileRadar.tsx` + `lib/radar-calc.ts` | **능력치 레이더 차트** — 6축 헥사곤, 골드 그라데이션, 비교 오버레이 지원 | 디자인 시스템에 미기술 |
| U-03 | `components/player/CompareSheet.tsx` | **선수 비교 시트** — 2선수 레이더 차트 오버레이 + 스탯 바 비교 + VS 점수 | SPEC/기획안에 없음. v2.0 로드맵의 "비교 도구"가 이미 구현됨 |
| U-04 | `video/VideoTrimmer.tsx`, `BgmPicker.tsx`, `SlowmoPicker.tsx`, `SpotlightPicker.tsx`, `EffectsToggle.tsx`, `SkillLabelPicker.tsx` | **영상 편집 스위트** — 트리밍/BGM/슬로모/스포트라이트/효과/스킬라벨. v1.3 기획 기능이 이미 구현됨 | v1.3 기획안에 있으나 PROGRESS.md/ARCHITECTURE.md **미반영** |
| U-05 | `admin/video-lab/page.tsx` + `lib/video-lab.ts` | **관리자 비디오 랩** — 숏폼/경기하이라이트 생성 실험실 | 기획 문서 **전무** (POC/실험 기능) |
| U-06 | `api/render/` + `lib/render-api.ts` + `hooks/useRenderJob.ts` + `render_jobs` 테이블 | **렌더 파이프라인** — Cloudflare Container 기반 영상 렌더링 | v1.3 기획안에 계획. ARCHITECTURE.md **미반영** |
| U-07 | `api/upload/direct`, `api/upload/multipart` | **서버 프록시 업로드** — 모바일 presign 실패 폴백 + 멀티파트 | ARCHITECTURE.md에 presign만 기술 |
| U-08 | `api/reports/stat` | **스탯 허위 기록 신고** (시간당 5건 제한) | 어떤 기획 문서에도 없음 |
| U-09 | `api/stats/percentile`, `api/stats/team-rank` | **스탯 백분위 + 팀 내 순위** | SPEC.md에서 "v1.5"로 분류했으나 이미 구현됨 |
| U-10 | 이메일 로그인 + 비밀번호 찾기/재설정 | **이메일 인증 시스템** | SPEC.md는 "카카오 SSO"만 언급. 이후 Sprint에서 추가됨 |
| U-11 | `api/bgm` + `bgm_tracks` 테이블 | **BGM 트랙 라이브러리** | v1.3 기획안에 있으나 PROGRESS/ARCHITECTURE 미반영 |
| U-12 | `lib/notifications.ts` (service role key) | **서버 사이드 알림 발송** (별도 Supabase 클라이언트) | 알림 발송 아키텍처 문서 미기술 |

---

## 3. 기획과 다르게 구현된 부분

### 3.1 네비게이션 구조 (가장 큰 차이)

| 항목 | v1.2 기획안 | 현재 구현 | 갭 |
|------|-----------|----------|-----|
| **선수 바텀탭** | 🏠홈 / 🏆MVP / 💬DM / 👤프로필 / 👥팀 | 🏠홈 / 🏆MVP / ⬆️업로드 / 🔍탐색 / 👤프로필 | **DM→탐색**, **팀탭 없음**, 업로드가 센터 |
| **부모 바텀탭** | 🏠홈 / 💬DM / ⚙️설정 **(3탭)** | 🏠홈 / 🏆MVP / ⬆️업로드 / 🔍탐색 / ⚙️내계정 **(5탭)** | 탭 수 자체가 다름 (3→5) |
| **스카우트 바텀탭** | 기획 미정 | 🏠홈 / 🏆MVP / ⭐관심 / 🔍탐색 / 👤프로필 **(5탭)** | 자체 구현 |
| **헤더** | FOOTORY + 🔍 + 🔔 | FOOTORY + 💬 + 🔔 + ⚙️ | 🔍 없음, 💬+⚙️ 추가됨 |
| **탐색 접근** | 헤더 🔍 → 풀스크린 오버레이 | `/discover` 독립 페이지 (바텀탭) | 완전히 다른 패턴 |

### 3.2 역할 체계

| 항목 | 기획 (v1.2) | 구현 | 차이 |
|------|------------|------|------|
| 역할 종류 | `player / parent / coach` | `player / parent / scout` | "coach" → "scout" 리네임 |
| 역할 분리 | 코치(리뷰) + 스카우터(워치리스트) 별도 | **scout 하나로 통합** | 기획에서 분리했던 것을 합침 |
| DB 테이블명 | coach_reviews, coach_verifications | **동일 (coach 잔존)** | 코드는 scout인데 DB는 coach |

### 3.3 업로드 플로우

| 항목 | 기획 | 구현 | 차이 |
|------|------|------|------|
| 단계 수 | v1.0: 4단계 → v1.3: 5단계 | **3단계** | Sprint 29에서 축소 |
| 진입점 | 프로필 내 3곳 (Featured "+" 등) | `/upload` 독립 라우트 (바텀탭 센터) | 다른 패턴 |
| 편집 기능 | v1.3에서 추가 예정 | **이미 구현** (트림/BGM/슬로모 등) | 선행 구현 |

### 3.4 알림 시스템

| 항목 | 기획 (v1.2) | 구현 | 차이 |
|------|------------|------|------|
| 알림 설정 UI | "🔔 ON/OFF + 🌙 조용한 시간" (2개만) | **카테고리별 16개+ 세분화 토글** | 기획 원칙 "10대에게 단순하게"와 충돌 |
| 푸시 발송 | FCM 웹 푸시 + 알림톡 2종 | **토큰 저장만** (발송 로직 없음) | 인프라 미완성 |

### 3.5 MVP 시스템

| 항목 | 기획 | 구현 | 차이 |
|------|------|------|------|
| 투표 주기 | **주간** (토~일 투표, 월 확정) | **월간** 투표로 변경 | finalize API가 월간으로 구현 |

### 3.6 팀 구조

| 항목 | 기획 (v1.2) | 구현 | 차이 |
|------|------------|------|------|
| 팀 앨범 | **삭제** (멤버 영상 자동 피드) | **유지** (team_albums + TeamAlbum + API) | 기획 변경 미적용 |
| 팀 화면 탭 | 멤버 + 팀 피드 + 팀 코드 | **영상 / 기록 / 멤버** 3탭 | 다른 구성 |

### 3.7 FeedItem 타입 불일치

| 위치 | 값 |
|------|-----|
| `lib/types.ts` | `"highlight" \| "stat" \| "team_join" \| "season" \| "featured_change" \| "top_clip"` |
| `database.ts` | `"highlight" \| "featured_change" \| "medal" \| "stat" \| "season" \| "top_clip"` |
| **차이** | 앱 타입에 `"team_join"` / DB에 `"medal"` — 서로 다른 값 |

---

## 4. 죽은 코드 (Dead Code)

### 4.1 확실한 데드코드 — 어디에서도 import 안 됨

| 컴포넌트 | 파일 | 근거 |
|----------|------|------|
| `ChallengeRanking` | `challenge/ChallengeRanking.tsx` | grep 결과 0건. 챌린지 시스템 미완성으로 orphan |
| `UploadNudge` | `feed/UploadNudge.tsx` | `FeedList.tsx`에서 import하나 **실제 렌더 조건 도달 여부 불명** |

### 4.2 높은 확률의 데드코드 — `@/components/` 기준 import 없음

> 일부는 **같은 폴더 내 상대경로 import**나 **dynamic import**로 사용될 수 있음. 삭제 전 개별 확인 필수.

| 컴포넌트 | 파일 | 추정 사유 |
|----------|------|----------|
| `StatRow` | `player/StatRow.tsx` | 스탯 목록에서 사용됐을 수 있으나 현재 참조 없음 |
| `FeaturedSlot` | `player/FeaturedSlot.tsx` | 피처드 영상 슬롯 — 프로필 리팩 후 미사용 가능 |
| `TagAccordion` | `player/TagAccordion.tsx` | 태그 포트폴리오 — TagEditSheet로 대체됐을 수 있음 |
| `TagEditSheet` | `player/TagEditSheet.tsx` | 참조 없음 |
| `SeasonAddSheet` | `player/SeasonAddSheet.tsx` | 시즌 추가 시트 — 참조 없음 |
| `GrowthCard` | `player/GrowthCard.tsx` | 성장 카드 — 참조 없음 |
| `PlayStyleCard` | `player/PlayStyleCard.tsx` | 플레이스타일 결과 카드 — 참조 없음 |
| `ProfileEditSheet` | `player/ProfileEditSheet.tsx` | 프로필 편집 시트 — 참조 없음 |
| `ClipPickerSheet` | `player/ClipPickerSheet.tsx` | 클립 선택 시트 — 참조 없음 |
| `CompareSheet` | `player/CompareSheet.tsx` | 선수 비교 — RadarChart에서 사용하나 상위 트리거 불명 |
| `WeeklyRecap` | `parent/WeeklyRecap.tsx` | 부모 주간 리캡 — 참조 없음 |
| `ParentQuickUpload` | `parent/ParentQuickUpload.tsx` | 부모 간편 업로드 — 참조 없음 |
| `AddToWatchlistButton` | `scout/AddToWatchlistButton.tsx` | 워치리스트 버튼 — 참조 없음 |
| `MvpThumbnail` | `mvp/MvpThumbnail.tsx` | MVP 썸네일 — 참조 없음 |
| `ReelTimeline` | `video/ReelTimeline.tsx` | 릴 타임라인 — 참조 없음 |
| `ClipSelector` | `video/ClipSelector.tsx` | 비디오 클립 선택기 — 참조 없음 |
| `NewConversationSheet` | `dm/NewConversationSheet.tsx` | DM 새 대화 시트 — 참조 없음 |
| `CommentSheet` | `social/CommentSheet.tsx` | 댓글 시트 — 참조 없음 |
| `MentionInput` | `social/MentionInput.tsx` | 멘션 입력 — 참조 없음 |
| `StatInputSheet` | `stats/StatInputSheet.tsx` | 스탯 입력 시트 — 참조 없음 |
| `StatReportSheet` | `stats/StatReportSheet.tsx` | 스탯 신고 시트 — 참조 없음 |

### 4.3 레거시 DB 테이블

| 테이블 | 상태 | 비고 |
|--------|------|------|
| `fcm_tokens` | 레거시 | `push_tokens`과 중복. FCM 전용으로 만들었다가 push_tokens으로 통합 |
| `coach_verifications` | 미사용 | 인증 플로우 미구현. 데이터 없을 것으로 추정 |

### 4.4 사용되지만 중복인 코드

| 항목 | 위치 | 비고 |
|------|------|------|
| `ChildSelector` x2 | `upload/ChildSelector.tsx` + `parent/ChildSelector.tsx` | 유사 역할, 통합 가능 |
| `Toast.tsx` + `sonner.tsx` | `ui/Toast.tsx` (래퍼) + `ui/sonner.tsx` (shadcn) | import 경로 혼재 (7곳 vs 6곳) |
| `r2.ts` + `r2-client.ts` | `lib/r2.ts` (서버) + `lib/r2-client.ts` (클라이언트) | r2-client는 URL 조합만 수행 |

---

## 5. 문서 간 충돌/불일치

| # | 충돌 | 문서들 | 실제 코드 |
|---|------|--------|----------|
| C-01 | 바텀탭 구성 | SPEC v1.1: 5탭(탐색포함) / SPEC v1.2: 5탭(DM포함) / 기획안: 5탭(DM포함) | **5탭(탐색포함, DM 미포함)** — v1.1 유지 |
| C-02 | 역할명 | SPEC.md: `other` / SPEC-v1.2: `coach` / 기획안: `coach` | **`scout`** — 3개 문서 모두 다름 |
| C-03 | API 구조 | ARCHITECTURE.md: "Supabase Edge Functions" | **Next.js Route Handlers** (`/api/*`) |
| C-04 | 투표 주기 | SPEC: 주간 / 기획안: 주간 | **월간**으로 변경됨 |
| C-05 | PROGRESS-v1.2.md | 모든 항목 `[ ]` (미완료) | 대부분 구현 완료. **PROGRESS.md 심각하게 outdated** |
| C-06 | 업로드 단계 | SPEC: 4단계 / v1.3 기획: 5단계 | **3단계** (Sprint 29 축소) |
| C-07 | 배포 타겟 | CLAUDE.md: "배포: Vercel" | package.json: `@opennextjs/cloudflare` + `wrangler` (Cloudflare 배포) |

---

## 6. 요약 — 우선순위별 조치 권장

### 🔴 즉시 필요 (문서 동기화)

1. **PROGRESS-v1.2.md 전면 업데이트** — 모든 항목이 `[ ]`인데 실제로는 대부분 구현됨
2. **역할명 통일** — 모든 문서에서 `player/parent/scout`로 통일, coach 잔존 정리
3. **ARCHITECTURE.md 업데이트** — Edge Functions→Route Handlers, 렌더 파이프라인, 영상 편집 기능 추가

### 🟡 기능 결정 필요

4. **네비게이션 구조 확정** — v1.2 기획(DM 탭) vs 현재(탐색 탭) 중 어느 방향으로 갈지 결정
5. **부모 탭 수 확정** — 3탭 vs 5탭
6. **챌린지/퀘스트** — 구현할지, DB만 유지할지, 삭제할지 결정

### 🟢 코드 정리

7. **데드코드 정리** — 4.2의 21개 컴포넌트 개별 확인 후 미사용 삭제
8. **Toast import 통일** — sonner 직접 vs Toast 래퍼 중 하나로
9. **타입 파일 정리** — `types/discover.ts`(snake_case) vs `lib/types.ts`(camelCase) 규칙 통일
10. **play_styles 테이블을 database.ts에 추가** — migration 034 반영

### 📝 문서화 필요

11. **플레이스타일 테스트** — 가장 큰 미문서 기능. SPEC에 섹션 추가
12. **레이더 차트 + 선수 비교** — 디자인 시스템에 추가
13. **영상 편집 스위트** — 현재 구현 상태 기준으로 SPEC 업데이트
14. **이메일 인증** — 카카오 외 인증 수단 문서화
