# 학부모 QA 리포트

**테스트 일시**: 2026-03-07
**계정**: parent@footory.test (Test Parent)
**테스터**: QA Agent (claude-opus-4-6)
**앱 버전**: FOOTORY v1.2.0

## 요약
- 총 테스트: 10개
- PASS: 5개
- FAIL: 2개
- PARTIAL: 3개

## 상세 결과

### T1. 로그인 + 온보딩 — PASS
- 관찰: 로그인 페이지에서 카카오 OAuth로 인증 성공. 온보딩 페이지에서 "부모/보호자" 역할 선택지가 정상 표시됨. 선택 시 골드 하이라이트로 활성 상태 표시되며, "다음" 버튼 활성화.
- 스크린샷: parent/t1-login-page.png, parent/t1-login-success.png, parent/t1-onboarding-role.png
- 이슈: 없음

### T2. 바텀탭 (학부모) — PARTIAL
- 관찰: 프로필 로딩 완료 후 바텀탭이 3개(홈/DM/설정)로 정상 표시됨. MVP탭, 팀탭 없음.
- 스크린샷: parent/t2-bottomtab.png
- 이슈: 페이지 최초 로딩 시 약 1~2초 동안 5탭(홈/MVP/DM/프로필/팀)이 깜빡임(flash). 프로필 role 로딩 완료 후 3탭으로 전환됨. 매 페이지 이동마다 발생하는 race condition.

### T3. 자녀 대시보드 — PARTIAL
- 관찰: 홈 화면이 자녀 대시보드 형태로 표시됨. "Test Player 보호자님" 인사 텍스트와 "Test Player의 이번 주" 섹션 헤더가 보임.
- 스크린샷: parent/t3-child-dashboard.png
- 이슈: `/api/parent/dashboard` API가 500 에러를 반환하여 주간 통계(영상 수, 응원 수, 조회수, MVP 순위, 레벨)가 전혀 표시되지 않음. 콘솔에 `Failed to load resource: the server responded with a status of 500` 에러 확인. 서버 로그 확인 필요.

### T4. 자녀 관련 버튼 — PASS
- 관찰: [Test Player 프로필 보기] 링크 버튼과 [영상 올려주기] 골드 버튼이 나란히 존재. 추가로 [+ 다른 자녀 연동] 버튼도 표시됨.
- 스크린샷: parent/t4-child-buttons.png
- 이슈: 없음

### T5. 자녀 연결 플로우 — PASS
- 관찰: [+ 다른 자녀 연동] 버튼 클릭 시 바텀시트 팝업으로 "자녀 프로필 연동" 시트가 열림. @핸들 입력 필드와 "연동하기" 버튼 존재. 또한 온보딩 2단계에서 자녀 검색/연결/나중에 옵션 모두 제공됨.
- 스크린샷: parent/t5-link-child-sheet.png
- 이슈: 없음

### T6. 대리 영상 업로드 — PASS
- 관찰: [영상 올려주기] 버튼 클릭 시 "Test Player에게 영상 올리기" 제목의 3단계 업로드 플로우(영상 선택 -> 태그 선택 -> 완료)가 정상 진입됨. MP4, 최대 5분, 100MB 이하 제한 안내 표시.
- 스크린샷: parent/t6-proxy-upload.png
- 이슈: 없음

### T7. DM 권한 — PARTIAL
- 관찰: DM 페이지 접근 가능하며 "아직 대화가 없습니다" 빈 상태 표시. 새 대화 시트에서 검색 가능. 자녀 프로필 페이지에서 "메시지" 버튼 존재하며, DM 권한 체크 로직(`canSendDm`)은 서버에서 처리됨.
- 스크린샷: parent/t7-dm-page.png, parent/t7-dm-new-conversation.png
- 이슈: `canDm()` 퍼미션 함수에서 parent 역할이 명시적으로 처리되지 않음. 코치에게 DM 가능 여부와 선수에게 DM 불가 여부를 UI 레벨에서 직접 확인할 수 없었음(팔로잉 목록이 비어있어 대화 상대를 선택할 수 없음). 서버 사이드 `canSendDm` 함수에서 처리되는 것으로 보이나 실제 시나리오 테스트 불가.

### T8. PDF 내보내기 — FAIL
- 관찰: 자녀 프로필(공개 프로필 `/p/test_player_footory`)에 PDF 내보내기 버튼이 없음. PDF 내보내기 기능은 `/profile` (내 프로필) 페이지에만 존재하며, 부모 계정으로 `/profile` 접근 시 빈 페이지가 표시됨(부모에게는 선수 프로필 데이터가 없음).
- 스크린샷: parent/t8-child-profile.png, parent/t8-profile-page.png
- 이슈: 부모가 자녀 프로필의 PDF를 내보낼 수 있는 경로가 전혀 없음. 자녀 대시보드나 공개 프로필 페이지에 PDF 내보내기 버튼 추가 필요.

### T9. 권한 제한 확인 — FAIL
- 관찰:
  - MVP 투표: MVP 페이지 접근 가능하며 "MVP 투표는 선수 계정만 참여할 수 있어요" 안내 표시. 상단 카드의 투표 버튼은 disabled 상태. 하지만 하단 순위 목록의 "투표" 버튼은 disabled가 아닌 것으로 보임.
  - 팔로우 버튼: 자녀 공개 프로필(`/p/test_player_footory`)에 "팔로우" 버튼이 표시됨. `permissions.ts`에서 `canFollow`는 player만 허용하지만, UI 컴포넌트(`FollowButton`)와 공개 프로필 페이지(`client.tsx`)에서 role 체크 없이 렌더링됨.
  - 팀앨범 업로드: 팀 페이지 접근 가능(직접 URL). 현재 팀이 없어 업로드 버튼 미확인.
- 스크린샷: parent/t9-mvp-permissions.png, parent/t9-team-page.png, parent/t8-child-profile.png
- 이슈: 공개 프로필에서 팔로우 버튼이 부모에게도 표시되는 권한 버그.

### T10. 알림 설정 — PASS
- 관찰: 알림 페이지 -> 설정 아이콘 클릭 시 알림 설정 화면 표시. 알림 ON/OFF 토글, 조용한 시간(22:00~08:00) 설정, 카테고리별 설정 옵션 모두 존재.
- 스크린샷: parent/t10-settings.png, parent/t10-notification-settings.png
- 이슈: 없음

## 발견된 버그
| # | 심각도 | 테스트 | 설명 |
|---|--------|--------|------|
| 1 | HIGH | T3 | `/api/parent/dashboard` API 500 에러 - 자녀 주간 통계가 전혀 표시되지 않음 |
| 2 | HIGH | T8 | 부모 계정에서 자녀 프로필 PDF 내보내기 버튼/경로 없음 |
| 3 | MEDIUM | T9 | 공개 프로필에서 부모에게 "팔로우" 버튼이 표시됨 (canFollow 권한 미반영) |
| 4 | MEDIUM | T2 | 페이지 로딩 시 바텀탭이 5탭 -> 3탭으로 깜빡이는 race condition |
| 5 | LOW | T9 | MVP 순위 목록의 "투표" 버튼이 부모에게도 활성 상태로 보임 (상단 카드는 disabled 처리됨) |
| 6 | LOW | T9 | 팀 페이지가 직접 URL로 접근 가능 (바텀탭에는 없지만 URL 직접 입력 시 접근됨) |

## 권한 확인
| 기능 | 기획 | 실제 | 판정 |
|------|------|------|------|
| MVP 투표 | 불가 | 상단 카드 disabled, 하단 목록 일부 활성 | PARTIAL |
| 팔로우 | 불가 | 팔로우 버튼 표시됨 (클릭 가능) | FAIL |
| 영상 업로드 (대리) | 가능 | 정상 작동 | PASS |
| 팀앨범 업로드 | 불가 | 팀 미가입 상태로 미확인 | N/A |
| 코치 DM | 가능 | 서버 사이드 체크, UI 미확인 | N/A |
| 선수 DM | 불가 | 서버 사이드 체크, UI 미확인 | N/A |
| PDF 내보내기 | 가능 | 버튼/경로 없음 | FAIL |
| 바텀탭 제한 | 3탭만 | 로딩 후 3탭 (초기 깜빡임) | PARTIAL |
