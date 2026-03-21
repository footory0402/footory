# FOOTORY 모델 선택 & MCP/플러그인 가이드

## 1. 모델 선택 전략

### 핵심 원칙
**가장 추천하는 모드: `opusplan`**

Claude Code에는 `opusplan` 이라는 모드가 있어요.
**Opus로 계획/설계** → **Sonnet으로 코드 실행**을 자동 전환합니다.
설계 품질은 Opus급, 코드 작성 속도는 Sonnet급. 비용도 최적화됨.

```bash
# 세션 시작 시
claude --model opusplan
```

### 스프린트별 모델 추천

| Sprint | 작업 | 추천 모델 | 이유 |
|--------|------|-----------|------|
| **01** | 프로젝트 셋업 | **Sonnet** | 단순 설정, Opus 불필요 |
| **02** | 기본 컴포넌트 | **Sonnet** | 패턴화된 UI 작업 |
| **03** | Supabase 셋업 | **Opus** ⭐ | DB 스키마 설계, RLS 정책은 한번 잘못하면 나중에 큰 문제 |
| **04** | 프로필 UI | **Sonnet** | UI 코드 생성은 Sonnet이 충분 |
| **05** | 프로필 DB연동 | **opusplan** | 데이터 흐름 설계(Opus) + 구현(Sonnet) |
| **06** | 영상 업로드 | **Opus** ⭐ | R2 + Presigned URL + Edge Function 연동, 아키텍처 판단 필요 |
| **07** | 하이라이트 | **opusplan** | FFmpeg 파이프라인 설계 + 구현 |
| **08** | 측정/메달 | **Sonnet** | 자동 부여 로직은 심플한 조건 분기 |
| **09** | 피드 시스템 | **Opus** ⭐ | 6종 카드 자동 생성 로직 + DB 트리거 설계 |
| **10** | 소셜 기능 | **Sonnet** | 팔로우/좋아요는 패턴화된 CRUD |
| **11** | 탐색 화면 | **Sonnet** | 검색 쿼리 + UI |
| **12** | 팀 기능 | **opusplan** | 권한 설계(Opus) + UI(Sonnet) |
| **13** | 부모 계정 | **Sonnet** | 역할 분기 로직, 비교적 단순 |
| **14** | 공개 프로필 | **opusplan** | OG 이미지 생성 + SSR 설계 |
| **15** | 온보딩 | **Sonnet** | 플로우 UI, 단순 |
| **16** | 알림 시스템 | **opusplan** | FCM + Realtime 아키텍처 |
| **17** | 설정/기타 | **Sonnet** | 설정 페이지 UI, 단순 |
| **18** | 통합QA | **Opus** ⭐ | 전체 코드 리뷰 + 버그 분석 |

### 요약 규칙

```
🔴 Opus (또는 opusplan) 써야 할 때:
  - DB 스키마/RLS 설계
  - 외부 서비스 연동 아키텍처 (R2, FCM, OAuth)
  - 멀티 파일 리팩토링
  - 전체 코드 리뷰 / QA
  - 복잡한 비즈니스 로직 (피드 자동 생성, 레벨 계산)

🟢 Sonnet이면 충분할 때:
  - UI 컴포넌트 코드 작성
  - 패턴화된 CRUD (팔로우, 댓글, 좋아요)
  - Tailwind 스타일링
  - 단순 페이지 레이아웃
  - 기존 패턴 따라서 새 화면 만들기
```

### 세션 중 모델 전환

```bash
# 세션 중 언제든 전환 가능
/model sonnet     # Sonnet으로 변경
/model opus       # Opus로 변경
/model opusplan   # 하이브리드 모드

# 예시: Sprint 05 작업 중
# 1. 데이터 모델링 → Opus로 시작
/model opus
"profiles 테이블과 clips 테이블의 관계를 설계해줘"

# 2. 설계가 끝나면 → Sonnet으로 전환
/model sonnet
"지금 설계한 대로 ProfileCard 컴포넌트에 데이터 연동해줘"
```

---

## 2. 미리 설치할 MCP 서버

### 2.1 필수 (꼭 설치)

#### Supabase MCP
DB 관리를 Claude Code 안에서 직접. 테이블 생성, 쿼리, 마이그레이션 전부 가능.

```json
// .mcp.json (프로젝트 루트에 생성)
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_SUPABASE_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

**이걸로 할 수 있는 것:**
- "profiles 테이블에 city 컬럼 추가해줘" → SQL 마이그레이션 자동 생성
- "현재 DB 스키마 보여줘" → 전체 테이블 구조 확인
- "TypeScript 타입 생성해줘" → DB 기반 자동 타입 생성
- "RLS 정책 확인해줘" → 보안 감사

⚠️ 개발용으로만 쓸 것. `--read-only` 플래그 권장 (실수 방지).

#### Playwright MCP
브라우저 자동화. 개발 중 실시간 테스트에 유용.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-playwright"]
    }
  }
}
```

**이걸로 할 수 있는 것:**
- "로컬 서버 열고 프로필 페이지 스크린샷 찍어줘" → 실시간 UI 확인
- "모바일 뷰포트로 홈 피드 테스트해줘" → 반응형 테스트
- "카카오 로그인 플로우 테스트해줘" → E2E 테스트

### 2.2 권장 (있으면 좋음)

#### Context7 MCP
최신 라이브러리 문서를 Claude 세션 안에서 직접 조회.
Next.js, Tailwind, Supabase 문서를 실시간 참조.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**이걸로 할 수 있는 것:**
- Next.js 14 App Router 최신 문법을 정확히 알려줌
- Supabase SDK 업데이트된 API를 반영
- Tailwind v4 변경사항 반영

### 2.3 선택 (나중에 추가해도 됨)

| MCP 서버 | 용도 | 설치 시기 |
|----------|------|-----------|
| GitHub MCP | PR, 이슈 관리 | 협업 시작 시 |
| Figma MCP | 디자인 시안 직접 참조 | 디자이너 합류 시 |
| Sentry MCP | 에러 모니터링 | 프로덕션 배포 후 |

---

## 3. 플러그인 & 커스텀 커맨드

### 3.1 Supabase 템플릿 (강력 추천)

```bash
# Claude Code 안에서 실행
npx claude-code-templates@latest --mcp database/supabase

# 추가 유용한 커맨드들
npx claude-code-templates@latest --command database/supabase-schema-sync
npx claude-code-templates@latest --command database/supabase-type-generator
npx claude-code-templates@latest --command database/supabase-security-audit
```

**설치 후 사용:**
```
/supabase-schema-sync    → DB 스키마와 코드 동기화
/supabase-type-generator → TypeScript 타입 자동 생성
/supabase-security-audit → RLS 보안 감사
```

### 3.2 커스텀 슬래시 커맨드 (직접 만들기)

프로젝트에 `.claude/commands/` 폴더를 만들면 커스텀 커맨드를 쓸 수 있어요.

```
footory/
├── .claude/
│   └── commands/
│       ├── design-qa.md
│       ├── sprint-status.md
│       └── deploy-check.md
```

**design-qa.md** (디자인 QA 커맨드):
```markdown
## /design-qa

현재 화면을 docs/DESIGN-SYSTEM.md와 대조해서 디자인 불일치를 찾아줘.

확인 항목:
1. 배경색이 #0C0C0E / #161618 / #1E1E22 중 하나인지
2. 액센트 컬러가 #D4A853인지
3. 텍스트 컬러가 #FAFAFA / #A1A1AA / #71717A 중 하나인지
4. 숫자/스탯에 Oswald 폰트가 적용됐는지
5. 카드 border-radius가 10~14px인지
6. 바텀탭 높이가 54px인지

불일치 항목을 파일:라인 형태로 리스트업하고 수정 코드를 제안해줘.
```

**sprint-status.md** (진행 상태 확인):
```markdown
## /sprint-status

docs/PROGRESS.md를 읽고 현재 상태를 요약해줘:
1. 완료된 스프린트 수 / 전체
2. 현재 진행 중인 스프린트와 남은 작업
3. 다음에 할 스프린트 추천
4. 전체 기능 체크리스트 완료율 (%)
```

**deploy-check.md** (배포 전 체크):
```markdown
## /deploy-check

배포 전 아래 항목을 확인해줘:
1. npm run build 에러 없는지 실행
2. .env.local 환경변수가 모두 있는지
3. TypeScript 타입 에러 없는지
4. 콘솔 에러/경고 없는지
5. 모바일 뷰포트(430px)에서 레이아웃 깨지지 않는지
```

---

## 4. 초기 세팅 체크리스트

### 프로젝트 생성 후 바로 해야 할 것:

```bash
# 1. 프로젝트 생성
npx create-next-app@latest footory --typescript --tailwind --app --src-dir
cd footory

# 2. 문서 넣기 (zip 풀어서)
# CLAUDE.md → 루트
# docs/ → 루트

# 3. .mcp.json 생성 (Supabase + Playwright)
# (위의 JSON 내용을 .mcp.json에 저장)

# 4. 커스텀 커맨드 폴더 생성
mkdir -p .claude/commands

# 5. Claude Code 시작
claude --model opusplan
```

### Claude Code 첫 실행 시 프롬프트:

```
안녕! FOOTORY 프로젝트를 시작할 거야.

1. CLAUDE.md를 읽고 프로젝트 컨텍스트 파악해줘
2. docs/ 폴더의 문서들 확인해줘
3. Sprint 01을 시작하자. docs/sprints/SPRINT-01.md 읽고 작업해줘

디자인은 반드시 docs/DESIGN-SYSTEM.md의 '피치 블랙 골드' 토큰을 따라야 해.
```

---

## 5. 비용 최적화 팁

### Max 구독 사용 시
- 기본 모델이 Opus → 한도 소진 시 자동으로 Sonnet 폴백
- UI 작업 시 미리 `/model sonnet`으로 전환하면 한도 아끼기

### API (pay-as-you-go) 사용 시
- Sonnet: $3/$15 per 1M tokens
- Opus: $5/$25 per 1M tokens
- **UI 위주 Sprint는 Sonnet, 아키텍처 Sprint만 Opus**로 하면 60~70% 절감

### 프롬프트 캐싱
- Claude Code가 자동으로 프롬프트 캐싱 적용
- CLAUDE.md, DESIGN-SYSTEM.md 같은 큰 파일이 캐시되므로 비용 절감
- 세션 중간에 이 파일들을 수정하면 캐시가 무효화되니 주의
