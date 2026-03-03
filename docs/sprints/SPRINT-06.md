# Sprint 06: 영상 업로드

> 예상 소요: 2일
> 선행: Sprint 03 + Sprint 05 완료
> 병렬 가능: ❌

## 사전 준비 (태영이 직접)
⚠️ Claude Code 밖에서 직접 해야 하는 것:
1. Cloudflare 계정에서 R2 버킷 생성 (이름: footory-videos, 리전: APAC)
2. R2 API 토큰 생성 (읽기/쓰기 권한)
3. 커스텀 도메인 연결 (선택): videos.footory.app
4. 환경변수 추가:
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=footory-videos
   R2_PUBLIC_URL=https://videos.footory.app 또는 R2 퍼블릭 URL
   ```

## 작업 목록

### Day 1: 업로드 인프라
- [ ] `src/lib/r2.ts` — R2 클라이언트 (S3 호환 SDK)
- [ ] `supabase/functions/upload-url/index.ts` — Presigned URL 생성 Edge Function
- [ ] 클라이언트 → Presigned URL 요청 → R2 직접 업로드 플로우
- [ ] 업로드 진행률 표시 (XMLHttpRequest 또는 fetch + progress)

### Day 2: 업로드 UI + 메타데이터
- [ ] 업로드 플로우 UI (SPEC.md 영상 업로드 플로우 참고)
  - Step 1: 영상 선택 (카메라롤)
  - Step 2: 태그 선택 (1~3개) + 메모 (한 화면)
  - Step 3: 업로드 진행 + 완료
- [ ] clips 테이블에 메타데이터 저장
- [ ] clip_tags 테이블에 태그 매핑
- [ ] 첫 클립 → 자동 Top Clip 설정 (SPEC U-05)
- [ ] 프로필 진입점 3곳에서 업로드 시작 가능
  - Featured "+" / Tag "영상 추가" / 영상탭 "+"
- [ ] 영상 제한 체크 (5분, 720p, 100MB)

## 완료 기준
- [ ] 영상 파일이 R2에 정상 업로드
- [ ] clips 테이블에 URL + 메타데이터 저장
- [ ] 프로필 영상 탭에서 업로드된 영상 목록 표시
- [ ] 업로드 진행률 UI 동작

## 참고
- docs/ARCHITECTURE.md: Section 4 (영상 파이프라인)
- docs/SPEC.md: 영상 업로드 플로우, D-04 (5분 제한)

---
