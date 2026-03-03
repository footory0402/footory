# Sprint 16: 알림 시스템

> 예상 소요: 1일
> 선행: Sprint 10 완료
> 병렬 가능: ❌

## 사전 준비 (태영이 직접)
⚠️ Firebase 프로젝트 생성 + FCM 설정 필요:
1. Firebase Console에서 프로젝트 생성
2. FCM 서버 키 확보
3. 환경변수 추가: `FCM_SERVER_KEY=xxx`

## 작업 목록
- [ ] 알림 센터 UI (헤더 🔔 → 알림 목록)
  - 읽음/안읽음 표시
  - 딥링크 (알림 탭 → 해당 화면 이동)
- [ ] 인앱 알림 (notifications 테이블)
  - 응원/댓글/팔로우/메달/검증 등 (SPEC Section 7)
- [ ] 푸시 알림 (FCM)
  - Supabase Edge Function에서 FCM API 호출
  - 알림 유형별 템플릿
- [ ] 알림 설정 (유형별 on/off)

## 완료 기준
- [ ] 응원/댓글 시 인앱 + 푸시 알림
- [ ] 알림 센터에서 목록 확인 + 읽음 처리
- [ ] 알림 탭 → 해당 콘텐츠로 이동

---
