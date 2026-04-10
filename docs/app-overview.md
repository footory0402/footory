# Footory 앱 개요

## 문서 목적
- 이 문서는 현재 저장소가 실제로 어떤 기능을 제공하는지 코드 기준으로 요약한다.
- 설계안이 아니라 현재 연결되어 있는 라우트, 컴포넌트, API 흐름을 기준으로 적는다.

## 제품 한 줄 요약
- Footory는 선수, 부모, 스카우트 역할을 나눠 운영하는 유소년 축구 선수 포트폴리오 모바일 웹앱이다.
- 핵심 축은 공개 프로필, 영상 업로드, 하이라이트 재생, 릴 생성, 팀, DM, 알림, 부모 대시보드다.

## 역할별 진입 구조

### 현재 사용 중
- 선수: 홈 피드, MVP, 영상 업로드, 탐색, 공개 프로필 관리가 기본 흐름이다.
- 부모: 홈에서 자녀 대시보드와 빠른 업로드를 사용한다.
- 스카우트: 홈에서 관심 선수와 탐색 데이터를 보고, 공개 프로필에서 관심 선수 저장과 DM 액션을 사용한다.

### 근거 파일
- 홈 역할 분기: `src/app/page.tsx`
- 프로필 권한 계산: `src/app/p/[handle]/page.tsx`
- 바텀탭 역할 분기: `src/components/layout/BottomTab.tsx`

## 주요 기능 축

### 1. 인증과 온보딩
- 로그인, 회원가입, 비밀번호 재설정, 역할별 온보딩이 구현되어 있다.
- 온보딩에서 선수는 프로필과 플레이스타일을 함께 저장하고, 부모는 자녀 검색 연동을 사용한다.

### 관련 경로
- `/login`
- `/signup`
- `/onboarding`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/callback`
- `/auth/confirm`

### 2. 홈
- 홈은 서버에서 역할을 판별한 뒤 선수 피드, 부모 대시보드, 스카우트 홈으로 분기된다.
- 선수 홈은 MVP 리더 요약과 피드 스트림을 함께 보여준다.
- 부모 홈은 자녀 선택, 최근 활동, 주간 리캡, 빠른 업로드를 제공한다.
- 스카우트 홈은 관심 선수, 상승 선수, 최근 하이라이트를 제공한다.

### 관련 파일
- `src/app/page.tsx`
- `src/lib/server/feed.ts`
- `src/lib/server/parent-home.ts`
- `src/lib/server/scout-home.ts`
- `src/components/parent/ChildDashboard.tsx`
- `src/components/scout/ScoutHome.tsx`

### 3. 공개 프로필과 내 프로필
- `/profile`은 실제 화면이 아니라 현재 로그인한 사용자의 핸들 기반 공개 프로필로 리다이렉트한다.
- 공개 프로필은 하이라이트, 기록, 커리어 3탭 구조다.
- 프로필 안에서 팔로우, DM, 관심 선수 저장, 통계 입력, 시즌 추가, 대회 기록/수상 기록 편집이 연결된다.

### 관련 파일
- `src/app/profile/page.tsx`
- `src/app/p/[handle]/page.tsx`
- `src/app/p/[handle]/client.tsx`
- `src/components/profile/HighlightsTabV5.tsx`
- `src/components/profile/RecordsTabV5.tsx`
- `src/components/profile/CareerTabV5.tsx`

### 4. 탐색과 MVP
- 탐색은 선수, 팀, 태그 탭으로 구성된다.
- MVP는 후보, 랭킹, 아카이브, 명예의 전당 데이터를 서버에서 받아 클라이언트에 전달한다.

### 관련 파일
- `src/app/discover/page.tsx`
- `src/app/mvp/page.tsx`
- `src/components/explore/*`
- `src/components/mvp/*`

### 5. 팀
- 팀 허브, 팀 상세, 공개 팀 페이지가 있다.
- 팀 상세에서는 멤버, 팀 피드, 앨범, 기록을 다룬다.

### 관련 파일
- `src/app/team/page.tsx`
- `src/app/team/[id]/page.tsx`
- `src/app/team/[id]/settings/page.tsx`
- `src/app/t/[handle]/page.tsx`
- `src/components/team/*`

### 6. DM과 알림
- DM 목록과 대화 스레드가 있고, 알림 페이지는 그룹화된 알림 목록과 알림 설정을 제공한다.

### 관련 파일
- `src/app/dm/page.tsx`
- `src/app/dm/[conversationId]/page.tsx`
- `src/app/(main)/notifications/page.tsx`
- `src/components/dm/*`
- `src/components/notifications/*`

## 영상 업로드와 편집

## 현재 메인 업로드 흐름
- 현재 메인 업로드 경로는 `/upload`다.
- 흐름은 파일 선택과 구간 선택을 담당하는 `SelectView` 다음에, 선수 포커스 지정 중심의 `DecorateView`로 이어진다.
- 업로드 상태는 `src/stores/upload-store.ts`의 Zustand 스토어가 관리한다.
- 실제 업로드는 `src/lib/upload-service.ts`가 presign, R2 업로드, 메타데이터 저장, 백그라운드 썸네일 업로드를 오케스트레이션한다.

### 메인 업로드 경로와 구성 요소
- 페이지: `src/app/upload/page.tsx`
- 파일 선택과 트림: `src/components/upload/SelectView.tsx`
- 포커스 지정: `src/components/upload/DecorateView.tsx`
- 완료 화면: `src/components/upload/DoneView.tsx`
- 전역 진행 표시: `src/components/upload/GlobalUploadIndicator.tsx`
- 상태 저장: `src/stores/upload-store.ts`
- 오케스트레이션: `src/lib/upload-service.ts`

### 서버 API
- presign 발급: `src/app/api/upload/presign/route.ts`
- 직접 업로드 폴백: `src/app/api/upload/direct/route.ts`
- 멀티파트 업로드: `src/app/api/upload/multipart/route.ts`
- 클립 메타데이터 저장: `src/app/api/clips/route.ts`
- 부모 업로드 저장: `src/app/api/parent/upload/route.ts`
- 클립 수정/삭제/썸네일 갱신: `src/app/api/clips/[id]/route.ts`

### 스토리지 흐름
- 원본 영상과 썸네일은 Cloudflare R2를 사용한다.
- 브라우저는 `/api/upload/presign`으로 presigned URL을 받은 뒤 R2에 직접 PUT한다.
- 메타데이터는 이후 `/api/clips` 또는 `/api/parent/upload`에 저장한다.
- 공개 재생 URL은 `src/lib/r2-client.ts`의 공개 URL 조합을 사용한다.

## 부모 업로드 흐름
- 부모 홈의 자녀 대시보드에서 `영상 올려주기`를 누르면 자녀 정보를 쿼리로 실은 공통 `/upload` 화면으로 이동한다.
- 파일 선택 이후 업로드/저장/선택 편집 단계는 선수와 부모가 같은 화면을 사용한다.
- 서버 저장은 `/api/parent/upload`로 간다.

### 관련 파일
- `src/components/parent/ChildDashboard.tsx`
- `src/app/upload/page.tsx`
- `src/components/upload/SelectView.tsx`
- `src/components/upload/UploadProcessingView.tsx`

## 하이라이트 재생과 릴
- 개별 클립 재생은 `ClipPlayerSheet`가 맡고, 런타임 오버레이 방식으로 spotlight, freeze, trim 정보를 적용한다.
- 개별 공유 페이지는 `/p/[handle]/h/[clipId]`다.
- 여러 클립을 묶는 릴 생성 페이지는 `/reel/create`이며 저장 대상은 `highlights` 테이블이다.
- 릴 공개 페이지는 `/reel/[id]`다.

### 관련 파일
- `src/components/player/ClipPlayerSheet.tsx`
- `src/app/p/[handle]/h/[clipId]/page.tsx`
- `src/app/p/[handle]/h/[clipId]/HighlightSharePlayerClient.tsx`
- `src/app/reel/create/page.tsx`
- `src/app/reel/[id]/page.tsx`
- `src/app/reel/[id]/ReelShareClient.tsx`
- `src/app/api/highlights/route.ts`
- `src/app/api/highlights/[id]/route.ts`

## 관리자용 영상 랩
- 관리자 계정은 홈에서 일반 대시보드 대신 `/admin/video-lab`로 리다이렉트된다.
- 이 경로는 서비스 핵심 업로드와 별도인 관리자용 실험/가공 랩 성격이다.
- 숏폼 렌더와 풀경기 하이라이트 생성 API가 별도로 존재한다.

### 관련 파일
- `src/app/admin/video-lab/page.tsx`
- `src/components/admin/VideoLabClient.tsx`
- `src/app/api/admin/video-lab/short-form/route.ts`
- `src/app/api/admin/video-lab/match-highlight/route.ts`
- `src/lib/video-lab.ts`

## 데이터와 인프라
- 인증, DB, Realtime: Supabase
- 영상 저장: Cloudflare R2
- Next.js 앱 배포와 API: Vercel 및 OpenNext/Cloudflare 설정 공존
- 렌더 워커: `render-worker/`에 Cloudflare Containers 기반 별도 파이프라인이 남아 있다

## 현재 제품에서 눈에 띄는 구조적 특징
- 프로필은 `/profile`보다 `/p/[handle]`가 실질 엔트리다.
- 영상 꾸미기는 현재 파일 굽기보다 런타임 재생 오버레이 쪽이 주 흐름이다.
- 부모 업로드는 일반 업로드와 별도 UI와 별도 업로드 코드를 유지한다.
- 공개 재생 로직이 프로필 시트, 공유 페이지, 릴 페이지로 나뉘어 있다.
