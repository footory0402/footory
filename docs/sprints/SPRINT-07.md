# Sprint 07: 하이라이트

> 예상 소요: 1일
> 선행: Sprint 06 완료
> 병렬 가능: ❌

## 작업 목록
- [ ] 스마트 트리밍: 업로드 후 앞 30초 자동 커트
  - Supabase Edge Function에서 FFmpeg 실행 (또는 Cloudflare Worker)
  - 결과를 R2 highlights/ 폴더에 저장
- [ ] 자동 썸네일: 5초 지점 캡처 → R2 thumbnails/에 저장
- [ ] 하이라이트 생성 상태 관리 (pending → processing → done/failed)
- [ ] 대기 화면 UI (SPEC Section 3.3)
  - 프로그레스 바 + "기다리는 동안..." 크로스 액션 유도
  - 완료 시 알림
- [ ] Featured 관리 UI
  - Progressive Disclosure (1개 채우면 2번째 등장)
  - 최대 3개, 교체 UX
- [ ] featured_clips 테이블 CRUD

## 완료 기준
- [ ] 업로드 후 30초 하이라이트 자동 생성
- [ ] 썸네일 자동 생성
- [ ] Featured 1~3개 관리 가능
- [ ] 대기 화면에서 크로스 액션 동작

---
