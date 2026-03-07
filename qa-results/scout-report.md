# 스카우터 QA 리포트

**테스트 일시**: 2026-03-07
**테스터**: QA Agent (코드 분석 기반)
**분석 범위**: src/app, src/components, src/lib, src/hooks

## 요약
- 총 테스트: 8개
- PASS: 4개
- FAIL: 1개
- PARTIAL: 3개
- NOT_IMPL: 0개

---

## 상세 결과

### T1. 로그인 + 역할 선택 -- PARTIAL

- **관찰**: 로그인 페이지(`/login`)는 카카오 SSO 버튼만 존재하며, 역할 선택 UI는 없다. 역할 선택은 온보딩 페이지(`/onboarding`)에서 수행된다. 온보딩의 역할 목록은 3가지: "선수", "부모/보호자", "코치/스카우터". 코치와 스카우터가 하나의 "코치/스카우터" 옵션(`other`)으로 통합되어 있다.
- **코치 vs 스카우터 세분화**: 온보딩에서 "코치/스카우터"를 선택하면 `CoachOnboarding` 컴포넌트로 이동하며, 여기서 역할 세분화 UI가 존재한다 (`COACH_ROLES`: 감독, 코치, 스카우터, 기타). 그러나 DB에 저장되는 `role` 값은 항상 `"other"`이다. 세분화된 역할(head_coach/coach/scout/other)은 `bio` 필드에 텍스트로만 반영된다.
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/app/login/page.tsx` (카카오 로그인만)
  - `/Users/jiminlee/Desktop/project/footory/src/app/onboarding/page.tsx` (ROLES 배열, line 8-12)
  - `/Users/jiminlee/Desktop/project/footory/src/components/onboarding/CoachOnboarding.tsx` (COACH_ROLES, line 7-12; role 저장 시 항상 `"other"`, line 83)
- **이슈**: `permissions.ts`에서 `UserRole` 타입은 `"coach" | "scout"`를 별도로 정의하지만, 온보딩에서는 항상 `"other"`로 저장하므로 세분화된 권한 분기가 실제로 동작하지 않는다. `permissions.ts`의 `canDm`, `canCoachReview`, `canUseWatchlist` 함수는 `"coach"`, `"scout"` 역할을 체크하지만, DB에는 `"other"`만 저장되므로 `"other"`가 포함된 조건(`["coach", "scout", "other"].includes(...)`)으로 우회되고 있다.

---

### T2. 코치 인증 방법 -- PASS

- **관찰**: 코치 인증 관련 컴포넌트가 2곳에 존재한다.
  1. **온보딩 시 인증** (`CoachOnboarding.tsx`, Step 2): 팀 코드 입력, 증빙 제출 2가지 옵션 + "나중에 인증할게요" 스킵 옵션
  2. **프로필 설정 후 인증** (`VerificationFlow.tsx`): 팀 코드 입력, 증빙 서류 제출, 인증 코치 추천 3가지 방법 모두 구현됨
- **3가지 방법 상세**:
  - 팀코드: 입력 UI + DB insert (`coach_verifications` 테이블) 구현됨
  - 증빙제출: UI 존재하나 실제 파일 업로드는 "추후 지원 예정" (VerificationFlow line 218-220), 온보딩에서는 안내 텍스트만 표시
  - 추천: `VerificationFlow.tsx`에서 @핸들 입력 -> 인증 코치 조회 -> `coach_verifications` insert + 알림 전송까지 구현됨
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/components/coach/VerificationFlow.tsx` (3가지 방법, line 8-24)
  - `/Users/jiminlee/Desktop/project/footory/src/components/onboarding/CoachOnboarding.tsx` (2가지 방법, line 229-283)
- **이슈**: 증빙 서류 제출의 실제 파일 업로드 기능은 미구현 (플레이스홀더 메시지만 표시)

---

### T3. 검색 오버레이 -- PARTIAL

- **관찰**: `/discover` 페이지에서 검색바 탭 시 `SearchOverlay`가 열린다. 선수 이름/핸들 검색이 가능하며, 탭 분류(전체/선수/팀/태그)가 존재한다.
- **선수 이름 검색**: 구현됨. API(`/api/discover/search`)에서 `name.ilike` 및 `handle.ilike` 패턴 매칭으로 검색한다.
- **포지션 필터**: 미구현. SearchOverlay와 DiscoverSearch 컴포넌트 모두 포지션별 필터 UI가 없다. 검색 API에도 position 파라미터가 없다.
- **지역 필터**: 미구현. 검색 API에서 city 필드를 select하지만 필터 파라미터로 사용하지 않는다. 필터 UI도 없다.
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/components/explore/SearchOverlay.tsx` (검색 UI, 탭 분류)
  - `/Users/jiminlee/Desktop/project/footory/src/app/api/discover/search/route.ts` (검색 API, 필터 파라미터 없음)
  - `/Users/jiminlee/Desktop/project/footory/src/app/discover/page.tsx` (탐색 메인)
- **이슈**: 포지션/지역 필터가 없어 스카우터가 특정 포지션이나 지역의 선수를 효율적으로 탐색할 수 없다.

---

### T4. 선수 프로필 열람 -- PASS

- **관찰**: 공개 프로필(`/p/[handle]`)에서 다음 정보를 확인할 수 있다:
  - **영상 목록**: `featured` 대표 하이라이트가 `PublicSummaryTab`에서 그리드로 표시됨 (line 338-353)
  - **스킬 태그**: "스킬 태그 영상은 비공개입니다" 메시지 표시 (비공개 처리, line 281-283)
  - **MVP 기록**: `ProfileCard`에서 `mvpCount`, `mvpTier` 표시
  - **수상/메달**: `MedalBadge` 컴포넌트로 메달 표시 + `AchievementList`로 수상 내역 표시
  - **코치 리뷰 뱃지**: `CoachReviewBadge` 컴포넌트가 존재하며, 클립별 코치 리뷰를 뱃지 형태로 표시 (rating: good/great/excellent)
  - **시즌 기록**: `RecordsTab`에서 stats, medals, seasons 표시
  - **성장 타임라인**: `GrowthTimeline` 컴포넌트로 타임라인 이벤트 표시
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/app/p/[handle]/client.tsx` (공개 프로필 클라이언트)
  - `/Users/jiminlee/Desktop/project/footory/src/app/p/[handle]/page.tsx` (SSR 데이터 페칭)
  - `/Users/jiminlee/Desktop/project/footory/src/components/coach/CoachReviewBadge.tsx`

---

### T5. 관심선수 기능 -- PASS

- **관찰**: 관심선수 기능이 완전히 구현되어 있다.
  - **추가 버튼**: `AddToWatchlistButton` 컴포넌트가 공개 프로필에서 동적 로드됨 (client.tsx line 16-19). 인증된 코치/스카우터에게만 표시 (role check + is_verified, line 25)
  - **워치리스트**: `/profile/watchlist` 페이지 + `WatchlistPanel` 컴포넌트로 목록 관리
  - **메모 작성**: WatchlistPanel에서 각 선수별 메모 추가/편집 가능 (textarea + 저장/취소 버튼)
  - **비공개**: "비공개" 라벨이 헤더에 표시됨 (WatchlistPanel line 94)
  - **알림 토글**: 선수 새 영상 업로드 시 알림 ON/OFF 기능 (`notify_on_upload`)
  - **제거**: 관심선수 제거 기능
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/components/scout/AddToWatchlistButton.tsx`
  - `/Users/jiminlee/Desktop/project/footory/src/components/scout/WatchlistPanel.tsx`
  - `/Users/jiminlee/Desktop/project/footory/src/app/profile/watchlist/page.tsx`
  - `/Users/jiminlee/Desktop/project/footory/src/lib/permissions.ts` (`canUseWatchlist`, line 43-45)

---

### T6. DM 권한 (미인증) -- PASS

- **관찰**: DM 권한 로직이 `src/lib/dm.ts`의 `canSendDm` 함수에서 구현되어 있다.
  - 미인증 스카우터(role=`"other"`, is_verified=false)가 미성년 선수(birth_year 기준 18세 미만)에게 DM 시도 시, `"blocked"`를 반환한다 (dm.ts line 63-69).
  - 인증된 코치/스카우터(role=`"other"`, is_verified=true)는 `"allowed"` 반환 (line 52-54).
  - 팔로우/같은팀 관계가 없고, 인증되지 않았으며, 미성년자가 아닌 경우는 `"request"` 반환 (DM 요청 흐름).
  - 공개 프로필에서 "메시지" 버튼 클릭 시 `canSendDm` 결과에 따라 분기: blocked -> alert, request -> prompt -> `sendDmRequest`, allowed -> 대화방 이동 (client.tsx line 213-232).
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/lib/dm.ts` (canSendDm, line 8-72)
  - `/Users/jiminlee/Desktop/project/footory/src/app/p/[handle]/client.tsx` (메시지 버튼, line 213-232)
- **이슈**: `"blocked"` 시 사용자에게 표시되는 메시지가 "이 사용자에게 메시지를 보낼 수 없습니다."로 범용적이며, "인증이 필요합니다" 같은 구체적 안내가 아니다. 미인증 스카우터에게 인증 유도 메시지를 보여주면 UX가 개선될 것이다.

---

### T7. 권한 제한 확인 -- FAIL

- **MVP 투표**: PASS. `permissions.ts`의 `canVoteMvp(role)`는 `role === "player"`만 true 반환. MVP 페이지에서 `usePermissions` 훅을 사용하여 `canVoteMvp`가 false이면 투표 버튼 비활성 + "MVP 투표는 선수 계정만 참여할 수 있어요" 안내 표시 (mvp/page.tsx line 296-299).
- **팔로우**: FAIL. `permissions.ts`의 `canFollow(role)`는 `role === "player"`만 true 반환하지만, **FollowButton 컴포넌트와 Follow API 모두 role 체크를 하지 않는다.** `useFollow` 훅은 단순히 API 호출만 하며 역할 검증이 없다. `/api/follows` POST 핸들러도 인증만 확인하고 role을 체크하지 않는다. 즉, 스카우터가 팔로우 버튼을 사용할 수 있다.
- **영상 업로드**: PARTIAL. `permissions.ts`의 `canUploadClip(role)`은 `role === "player"`만 true 반환. 그러나 `/upload` 페이지에는 role 체크가 보이지 않는다. BottomTab에서 업로드 탭이 별도로 없으므로 직접 URL 접근해야 하지만, 접근 자체를 차단하지는 않는다.
- **코치 태그 버튼**: PASS. `CoachReviewBadge`의 "리뷰 남기기" 버튼은 `canReview` prop이 true일 때만 표시됨. 이 값은 `canCoachReview(role, verified)`에 의해 인증된 코치/스카우터만 true가 된다.
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/lib/permissions.ts`
  - `/Users/jiminlee/Desktop/project/footory/src/hooks/usePermissions.ts`
  - `/Users/jiminlee/Desktop/project/footory/src/components/social/FollowButton.tsx` (role 체크 없음)
  - `/Users/jiminlee/Desktop/project/footory/src/app/api/follows/route.ts` (role 체크 없음)
  - `/Users/jiminlee/Desktop/project/footory/src/hooks/useFollow.ts` (role 체크 없음)
  - `/Users/jiminlee/Desktop/project/footory/src/app/mvp/page.tsx` (canVoteMvp 사용, line 27, 296-299)
- **이슈**: FollowButton과 Follow API에서 역할 기반 제한이 누락되어, 스카우터/코치/부모 계정도 팔로우가 가능하다. `canFollow` 함수가 정의되어 있지만 실제로 사용되는 곳이 없다.

---

### T8. 공개 프로필 -- PASS

- **관찰**:
  - `/p/{handle}` 라우트가 SSR로 구현되어 있다. `proxy.ts`에서 `/p/` 경로는 `PUBLIC_PREFIXES`에 포함되어 비로그인 사용자도 접근 가능하다.
  - **[Footory에서 보기] CTA 버튼**: `client.tsx` line 300-312에서 하단에 "Footory에서 전체 프로필 보기" 텍스트 + "Footory에서 보기" 골드 CTA 버튼이 구현되어 있다. `APP_URL` 상수를 사용하여 링크를 생성한다.
  - OG 메타데이터도 `generateMetadata`에서 설정됨 (page.tsx line 125-145).
- **근거 파일**:
  - `/Users/jiminlee/Desktop/project/footory/src/app/p/[handle]/page.tsx` (SSR + 메타데이터)
  - `/Users/jiminlee/Desktop/project/footory/src/app/p/[handle]/client.tsx` (CTA 버튼, line 300-312)
  - `/Users/jiminlee/Desktop/project/footory/src/proxy.ts` (PUBLIC_PREFIXES, line 5)

---

## 발견된 버그

| # | 심각도 | 테스트 | 설명 |
|---|--------|--------|------|
| 1 | HIGH | T7 | FollowButton과 Follow API에 역할 기반 제한이 없다. `canFollow` 함수가 정의되어 있으나 어디서도 사용되지 않아, 스카우터/코치/부모도 팔로우가 가능하다. |
| 2 | MEDIUM | T1 | 온보딩에서 코치/스카우터 세분화 역할(감독/코치/스카우터/기타)을 선택하지만, DB role은 항상 `"other"`로 저장된다. `permissions.ts`의 `"coach"` \| `"scout"` 분기가 사실상 사용되지 않는다. |
| 3 | LOW | T6 | 미인증 스카우터의 미성년자 DM 차단 시 "이 사용자에게 메시지를 보낼 수 없습니다."라는 범용 메시지만 표시. 인증 유도 안내가 없다. |
| 4 | LOW | T2 | 증빙 서류 제출 방법에서 실제 파일 업로드가 미구현 (플레이스홀더 안내만 존재). |
| 5 | MEDIUM | T3 | 검색에 포지션/지역 필터가 없어 스카우터의 선수 탐색 효율이 떨어진다. |

---

## 권한 확인

| 기능 | 기획 (스카우터 불가) | 실제 구현 | 판정 |
|------|----------------------|-----------|------|
| MVP 투표 | 불가 | 불가 (canVoteMvp 체크 + UI 안내) | PASS |
| 팔로우 | 불가 | **가능 (role 체크 누락)** | FAIL |
| 영상 업로드 | 불가 | BottomTab에 탭 없으나 URL 직접 접근 가능 | PARTIAL |
| 코치 태그(리뷰) | 인증 시 가능 | 인증 시만 버튼 표시 (canReview prop) | PASS |
| 관심선수 | 인증 시 가능 | 인증 코치/스카우터만 버튼 표시 | PASS |
| DM (미인증->미성년) | 불가 | blocked 반환 | PASS |
| DM (인증->선수) | 가능 | allowed 반환 | PASS |

---

## 미구현 기능 목록

- 검색 포지션 필터 (스카우터가 FW, MF 등 포지션별 선수 검색)
- 검색 지역 필터 (스카우터가 서울, 경기 등 지역별 선수 검색)
- 증빙 서류 파일 업로드 (VerificationFlow에서 "추후 지원 예정" 표시)
- 역할 세분화 DB 저장 (coach/scout 구분이 DB level에서 되지 않음, 모두 "other")
