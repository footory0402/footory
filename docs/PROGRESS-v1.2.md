# PROGRESS.md — v1.2 체크리스트 (기존 파일에 추가)

---

## v1.2 "소셜 엔진" 진행 상황

### Phase A: 기반 재설계
- [ ] SPRINT-15b: 온보딩 역할 선택 (선수/부모/코치)
  - [ ] profiles 테이블 role, is_verified 등 추가
  - [ ] 역할 선택 화면
  - [ ] 선수 온보딩 (키/몸무게/선호발 추가)
  - [ ] 부모 온보딩 (자녀 연결)
  - [ ] 코치 온보딩 (인증 옵션)
  - [ ] permissions.ts 권한 체크

- [ ] SPRINT-11b-v2: 네비게이션 재설계
  - [ ] 바텀탭 🔍탐색 → 💬DM 교체
  - [ ] 헤더 🔍 🔔 추가
  - [ ] 검색+탐색 오버레이 (SearchOverlay)
  - [ ] /dm, /notifications 라우트 생성 (빈 화면)
  - [ ] 부모 바텀탭 3탭 분기

- [ ] SPRINT-11c: 팀 미니멀 리팩토링
  - [ ] 팀 앨범 제거 → 멤버 영상 자동 팀 피드
  - [ ] teams.invite_code 추가 + 코드 공유 UI
  - [ ] 팀 코드로 가입 기능
  - [ ] 팀 관리 최소화 (관리자 강퇴만)
  - [ ] 팀 생성 간소화

### Phase B: 알림 + 소셜
- [ ] SPRINT-16: 알림 센터
  - [ ] notifications 테이블 확장
  - [ ] 알림 센터 UI (시간순, 그룹핑)
  - [ ] 🔔 뱃지 카운트
  - [ ] 알림 설정 (ON/OFF + 조용한 시간)
  - [ ] notification_preferences 테이블

- [ ] SPRINT-16b: FCM + 알림톡
  - [ ] push_tokens 테이블
  - [ ] Service Worker (firebase-messaging-sw.js)
  - [ ] 푸시 권한 요청 (첫 업로드 후)
  - [ ] send-push Edge Function
  - [ ] 알림톡 2종 (MVP, 부모 리캡)

- [ ] SPRINT-21: 소셜 강화
  - [ ] @멘션 + 자동완성
  - [ ] 이모지 리액션 5종
  - [ ] 대댓글 (parent_id)
  - [ ] 공유 바텀시트 (DM/카톡/인스타/링크)

### Phase C: DM
- [ ] SPRINT-19: DM 1:1
  - [ ] conversations, messages 테이블 + RLS
  - [ ] 대화 목록 UI (/dm)
  - [ ] 대화 화면 (/dm/[id])
  - [ ] Realtime 수신
  - [ ] 클립 공유
  - [ ] 읽음 ✓✓
  - [ ] 프로필 [메시지] 버튼
  - [ ] 💬 탭 뱃지

- [ ] SPRINT-20: 안전장치 + 코치 인증
  - [ ] blocks 테이블 + 차단 기능
  - [ ] reports 테이블 + 신고 UI
  - [ ] dm_requests + DM 요청 플로우
  - [ ] coach_verifications + 인증 3방법
  - [ ] DM 권한 매트릭스 적용

### Phase D: 포트폴리오 + 재미
- [ ] SPRINT-23: 커리어 포트폴리오
  - [ ] achievements 테이블 + CRUD UI
  - [ ] timeline_events + 자동 생성 트리거
  - [ ] 프로필 PDF 내보내기
  - [ ] 공개 프로필 OG 이미지
  - [ ] 프로필 확장 필드 (키/몸무게/발/소개)
  - [ ] 프로필 조회수

- [ ] SPRINT-24: 챌린지 + 퀘스트
  - [ ] challenges 테이블 + 배너 UI
  - [ ] 챌린지 랭킹
  - [ ] quest_progress + 체크리스트 UI
  - [ ] 초보자/주간 퀘스트
  - [ ] XP → 레벨 연동

- [ ] SPRINT-25: 코치 태그 + 스카우터
  - [ ] coach_reviews + 리뷰 폼
  - [ ] 📋 코치 리뷰 뱃지
  - [ ] 비공개 피드백 (API 필터링)
  - [ ] scout_watchlist + UI (비공개)
  - [ ] 관심 선수 알림

### Phase E: 부모 + 마무리
- [ ] SPRINT-22: 부모 전용 UI
  - [ ] 자녀 대시보드 (홈)
  - [ ] 부모 바텀탭 3탭
  - [ ] 자녀 대신 업로드
  - [ ] 주간 리캡 카드
  - [ ] 부모 설정 화면

- [ ] SPRINT-26: 최종 QA
  - [ ] 전체 시나리오 테스트 (선수/부모/코치/스카우터)
  - [ ] 디자인 토큰 검증
  - [ ] 에러/빈 상태 처리
  - [ ] 성능 최적화
  - [ ] 최종 체크리스트 통과
