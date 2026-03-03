# Sprint 03: Supabase 셋업

> 예상 소요: 1일
> 선행 조건: Sprint 02 완료

## 목표
Supabase 프로젝트 생성 + DB 스키마 + RLS + 카카오 Auth 연동

## 사전 준비 (Claude Code 밖에서 직접 해야 하는 것)
⚠️ 아래 항목은 태영이 Supabase 대시보드와 카카오 개발자 콘솔에서 직접 해야 합니다:

1. **Supabase 프로젝트 생성** (https://supabase.com)
   - 프로젝트명: footory
   - 리전: Northeast Asia (Seoul)
   - DB 비밀번호 안전하게 저장

2. **카카오 개발자 앱 등록** (https://developers.kakao.com)
   - 앱 생성 → REST API 키, Client Secret 확보
   - Redirect URI 설정: `https://{your-project}.supabase.co/auth/v1/callback`

3. **Supabase Auth에 카카오 프로바이더 추가**
   - Supabase Dashboard → Auth → Providers → Kakao
   - Client ID, Client Secret 입력

4. **환경변수 확보**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx  (서버사이드용)
   ```

## 작업 목록 (Claude Code에서 진행)

### 1. Supabase 클라이언트 셋업
- [ ] `npm install @supabase/supabase-js @supabase/ssr`
- [ ] `src/lib/supabase.ts` — 클라이언트 생성 (브라우저용)
- [ ] `src/lib/supabase-server.ts` — 서버 컴포넌트용
- [ ] `.env.local` 파일 생성 (환경변수)

### 2. DB 스키마 생성
- [ ] `supabase/migrations/001_initial_schema.sql`
  - ARCHITECTURE.md의 모든 테이블 생성
  - 인덱스 추가 (handle, team_id, profile_id 등)
  - 초기 메달 기준 데이터 삽입

### 3. RLS 정책
- [ ] `supabase/migrations/002_rls_policies.sql`
  - ARCHITECTURE.md Section 3 참고
  - 모든 테이블에 적용

### 4. 카카오 로그인 컴포넌트
- [ ] `src/components/auth/KakaoLoginButton.tsx`
- [ ] `src/app/auth/callback/route.ts` — OAuth 콜백 핸들러
- [ ] `src/lib/auth.ts` — 로그인/로그아웃 유틸

### 5. 인증 미들웨어
- [ ] `src/middleware.ts` — 인증 상태 체크, 리다이렉트

## 완료 기준
- [ ] 카카오 로그인 → Supabase Auth 세션 생성 동작
- [ ] profiles 테이블에 신규 유저 row 자동 생성
- [ ] RLS가 적용되어 본인 프로필만 수정 가능
- [ ] 로그인/비로그인 상태 라우팅 동작

## 참고 문서
- docs/ARCHITECTURE.md: Section 2 (DB 스키마), Section 3 (RLS)
- docs/SPEC.md: 카카오 SSO, 온보딩 관련 부분
