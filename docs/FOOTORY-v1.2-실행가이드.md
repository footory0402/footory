# FOOTORY v1.2 실행 가이드 — Claude Code용

> 이 문서를 Claude Code에 가장 먼저 업로드하세요.
> v1.1이 완성된 상태에서 v1.2를 순차적으로 적용합니다.
> Date: 2026-03-05

---

## 전체 구조

```
Phase A: 기반 재설계 (Sprint 15b → 11b-v2 → 11c)
Phase B: 알림 + 소셜 (Sprint 16 → 16b → 21)
Phase C: DM (Sprint 19 → 20)
Phase D: 포트폴리오 + 재미 (Sprint 23 → 24 → 25)
Phase E: 부모 + 마무리 (Sprint 22 → 26)

총 14개 스프린트, 5개 Phase
```

---

## 실행 순서

### Phase A — 기반 재설계

```
1. docs/sprints/SPRINT-15b.md 읽고 실행
   → 온보딩 역할 선택 (선수/부모/코치·스카우터)
   → profiles 테이블 role 컬럼 추가
   → 역할별 온보딩 분기
   → 부모/코치 프로필 타입 구분

2. docs/sprints/SPRINT-11b.md 읽고 실행
   → 바텀탭 3번째: 🔍탐색 → 💬DM 교체
   → 탐색 콘텐츠 → 헤더 🔍 검색 오버레이로 이동
   → 헤더 레이아웃: FOOTORY 🔍 🔔
   → 새 5탭: 🏠홈 🏆MVP 💬DM 👤프로필 👥팀

3. docs/sprints/SPRINT-11c.md 읽고 실행
   → 팀 앨범 제거 → 멤버 영상 자동 팀 피드
   → 팀 코드 시스템 (invite_code)
   → 팀 관리 최소화 (관리자 강퇴만)
   → 팀 생성 간소화
```

### Phase B — 알림 + 소셜

```
4. docs/sprints/SPRINT-16.md 읽고 실행
   → 알림 센터 UI (단순 시간순 리스트)
   → notifications 테이블 확장 (group_key, action_url, is_read)
   → 🔔 뱃지 카운트
   → 알림 설정 (ON/OFF + 조용한 시간)

4. docs/sprints/SPRINT-16.md 읽고 실행
   → 알림 센터 UI (단순 시간순 리스트)
   → notifications 테이블 확장 (group_key, action_url, is_read)
   → 🔔 뱃지 카운트
   → 알림 설정 (ON/OFF + 조용한 시간)

5. docs/sprints/SPRINT-16b.md 읽고 실행
   → FCM 웹 푸시 셋업 (Service Worker)
   → push_tokens 테이블
   → notification_preferences 테이블
   → 알림 발송 Edge Function
   → 푸시 권한 요청 (첫 영상 업로드 후)

6. docs/sprints/SPRINT-21.md 읽고 실행
   → @멘션 시스템 (댓글 내)
   → 이모지 리액션 5종 (kudos 확장)
   → 대댓글 (comments.parent_id)
   → 공유 확장 (DM/인스타/링크복사)
```

### Phase C — DM

```
7. docs/sprints/SPRINT-19.md 읽고 실행
   → conversations, messages 테이블
   → DM 대화 목록 UI (바텀탭 💬)
   → 1:1 대화 화면
   → Supabase Realtime 구독
   → 영상 클립 공유 (DM 내)
   → 읽음 표시

8. docs/sprints/SPRINT-20.md 읽고 실행
   → blocks, reports 테이블
   → 차단/신고 UI
   → DM 요청 (dm_requests 테이블)
   → 코치/스카우터 인증 (coach_verifications 테이블)
   → DM 권한 매트릭스 적용
```

### Phase D — 포트폴리오 + 재미

```
9. docs/sprints/SPRINT-23.md 읽고 실행
   → achievements 테이블 (수상/성과)
   → timeline_events 테이블 (성장 타임라인)
   → 프로필 기록 탭 확장 (수상, 타임라인)
   → 프로필 PDF 내보내기
   → 공개 프로필 OG 이미지
   → profiles 확장 (height, weight, foot, bio)

10. docs/sprints/SPRINT-24.md 읽고 실행
    → challenges 테이블
    → 주간 챌린지 UI (홈 피드 상단 배너)
    → 챌린지 랭킹
    → quest_progress 테이블
    → 초보자/주간 퀘스트 체크리스트
    → XP → 레벨 연동

11. docs/sprints/SPRINT-25.md 읽고 실행
    → coach_reviews 테이블 (코치 태그/평가)
    → 영상에 코치 리뷰 뱃지
    → scout_watchlist 테이블 (스카우터 관심 선수)
    → 스카우터 워치리스트 UI
```

### Phase E — 부모 + 마무리

```
12. docs/sprints/SPRINT-22.md 읽고 실행
    → 부모 전용 홈 (자녀 대시보드)
    → 부모 바텀탭 3탭 (홈/DM/설정)
    → 자녀 대신 업로드 기능
    → parent_links 확장 (consent 컬럼)
    → 부모 주간 리캡 알림

13. docs/sprints/SPRINT-26.md 읽고 실행
    → 전체 QA (모든 역할별 시나리오)
    → 디자인 토큰 검증
    → 에러 상태 / 빈 상태 처리
    → 성능 최적화
    → 최종 폴리싱
```

---

## Claude Code 프롬프트

### 시작 프롬프트

```
FOOTORY v1.2 개발을 시작할 거야.
v1.1이 완성된 상태야 (5탭, MVP 투표, 탐색, 팔로우, 추천 피드).

docs/SPEC.md의 PART 1 (v1.2)을 읽고,
Phase A부터 순서대로 진행해줘.

먼저 docs/sprints/SPRINT-15b.md를 읽고 실행해.
```

### 스프린트 이동 프롬프트

```
SPRINT-15b 완료.
다음 스프린트 docs/sprints/SPRINT-11b.md 읽고 실행해줘.
docs/DESIGN-SYSTEM.md Section 8도 참고해서 UI 맞춰줘.
```

### 확인 프롬프트

```
Phase A 완료 상태야.
/, /mvp, /dm, /profile, /team 5탭이 동작하는지,
헤더에 🔍 🔔가 있는지,
🔍 탭하면 검색+탐색 오버레이가 나오는지 확인해줘.
```

---

## 문서 파일 목록

```
docs/
├── SPEC.md                 → PART 1 (v1.2) 추가
├── ARCHITECTURE.md         → v1.2 DB 스키마 추가
├── DESIGN-SYSTEM.md        → Section 9 (v1.2 컴포넌트) 추가
├── PROGRESS.md             → v1.2 체크리스트 추가
└── sprints/
    ├── SPRINT-15b.md       → 온보딩 역할 선택
    ├── SPRINT-11b-v2.md    → 탐색→검색, DM→탭
    ├── SPRINT-11c.md       → 팀 미니멀 리팩토링
    ├── SPRINT-16.md        → 알림 센터 (수정)
    ├── SPRINT-16b.md       → FCM + 알림톡
    ├── SPRINT-19.md        → DM 1:1
    ├── SPRINT-20.md        → 안전장치 + 코치 인증
    ├── SPRINT-21.md        → 소셜 강화
    ├── SPRINT-22.md        → 부모 전용 UI
    ├── SPRINT-23.md        → 커리어 포트폴리오
    ├── SPRINT-24.md        → 챌린지 + 퀘스트
    ├── SPRINT-25.md        → 코치 태그 + 스카우터
    └── SPRINT-26.md        → 최종 QA
```
