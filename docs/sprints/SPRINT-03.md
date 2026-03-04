# Sprint 03: Supabase 셋업

> 예상 소요: 1~2일
> 선행 조건: Sprint 01 완료
> **v1.1 변경: 새 테이블 6개 추가 (MVP, 랭킹, follows 확인)**

## 목표
Supabase 프로젝트 생성 + DB 스키마 전체 + RLS 정책 + Edge Functions 기본 셋업

## 작업 목록

### 1. Supabase 프로젝트
- [ ] 프로젝트 생성 (ap-northeast-2 서울 리전)
- [ ] 카카오 OAuth Provider 설정

### 2. DB 테이블 생성 (ARCHITECTURE.md 참고)
- [ ] `profiles` (선수/부모 프로필) — **mvp_count, mvp_tier 포함 (v1.1)**
- [ ] `parent_links` (부모-자녀 연동)
- [ ] `clips` (영상 클립)
- [ ] `clip_tags` (클립-태그 매핑)
- [ ] `featured_clips` (대표 영상)
- [ ] `stats` (측정 기록)
- [ ] `medals` (메달)
- [ ] `medal_criteria` (메달 기준) + 초기 데이터 INSERT
- [ ] `teams` (팀)
- [ ] `team_members` (팀 멤버) — **role에 'alumni' 포함 (v1.1)**
- [ ] `team_albums` (팀 앨범)
- [ ] `follows` (팔로우)
- [ ] `feed_items` (피드)
- [ ] `kudos` (응원)
- [ ] `comments` (댓글)
- [ ] `notifications` (알림) — **mvp_result, vote_open, mvp_win 타입 (v1.1)**
- [ ] `seasons` (시즌) — **team_id, is_current 포함 (v1.1)**
- [ ] **`weekly_votes` (MVP 투표) (v1.1 신규)**
- [ ] **`weekly_mvp_results` (MVP 결과 아카이브) (v1.1 신규)**
- [ ] **`player_ranking_cache` (선수 랭킹 캐시) (v1.1 신규)**
- [ ] **`team_ranking_cache` (팀 랭킹 캐시) (v1.1 신규)**

### 3. RLS 정책 적용
- [ ] profiles: 누구나 읽기, 본인만 수정
- [ ] clips: 누구나 읽기, 본인(+부모)만 생성
- [ ] teams: 누구나 읽기, 관리자만 수정
- [ ] weekly_votes: 본인만 생성, 본인만 삭제
- [ ] weekly_mvp_results: 누구나 읽기, Edge Function만 생성
- [ ] follows: 본인만 생성/삭제, 누구나 읽기

### 4. 인덱스
- [ ] `profiles(city, position, birth_year)` — 추천 피드 알고리즘
- [ ] `weekly_votes(week_start, clip_id)` — 주간 투표 집계
- [ ] `follows(follower_id)`, `follows(following_id)` — 팔로우 조회
- [ ] `player_ranking_cache(popularity_score DESC)` — 랭킹 정렬
- [ ] `team_ranking_cache(activity_score DESC)` — 팀 랭킹 정렬
- [ ] `feed_items(profile_id, created_at)` — 피드 조회

### 5. Edge Functions 기본
- [ ] `upload-url`: R2 presigned URL 생성
- [ ] `process-video`: 비동기 트리밍+썸네일
- [ ] `check-medal`: 메달 자동 부여
- [ ] `generate-feed`: 피드 카드 생성
- [ ] **`mvp-score`: 주간 MVP 자동 점수 집계 (매일 cron) (v1.1)**
- [ ] **`mvp-finalize`: 주간 MVP 최종 확정 (월 00시 cron) (v1.1)**
- [ ] **`ranking-update`: 선수/팀 랭킹 캐시 갱신 (매일 cron) (v1.1)**

### 6. Supabase Client 설정
- [ ] `src/lib/supabase.ts` — 클라이언트 생성
- [ ] 환경 변수 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY)

## 완료 기준
- [ ] Supabase 대시보드에서 모든 테이블 확인 가능 (기존 17개 + 신규 4개 = 21개)
- [ ] RLS 활성화 상태에서 SELECT/INSERT 동작 확인
- [ ] 카카오 로그인 테스트 성공
- [ ] weekly_votes, weekly_mvp_results 테이블이 존재한다

## 참고 문서
- docs/ARCHITECTURE.md: Section 2 전체 (특히 2.6, 2.7 v1.1 신규)
- docs/ARCHITECTURE.md: Section 3 (RLS), Section 5 (API)
