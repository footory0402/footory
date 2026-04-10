export type AgentDepartment = "Command" | "Product" | "Build" | "QA";
export type AgentMode = "route" | "guard" | "design" | "build" | "audit";

export interface AgentBriefExample {
  label: string;
  goal: string;
  paths: string;
  done: string;
  verification: string;
}

export interface FootoryAgent {
  id: string;
  name: string;
  title: string;
  department: AgentDepartment;
  mode: AgentMode;
  summary: string;
  canDo: string[];
  wontDo: string[];
  recentWork: string[];
  nextMoves: string[];
  redFlags: string[];
  sourceDocs: string[];
  examples: AgentBriefExample[];
}

export interface BriefDraft {
  goal?: string;
  paths?: string;
  done?: string;
  verification?: string;
}

export const companyCharter = [
  {
    title: "선수 포트폴리오 우선",
    body: "모든 판단은 선수 어필, clip 근거, 기록 전달력 강화로 수렴해야 한다.",
    source: "docs/product-dna.md",
  },
  {
    title: "실제 코드 우선",
    body: "문서보다 실제 라우트와 호출 흐름을 먼저 보고, 차이는 따로 기록한다.",
    source: "AGENTS.md",
  },
  {
    title: "검증 없이는 완료 아님",
    body: "기본 검증은 lint, typecheck, test:run이며 사용자 플로우 변경은 추가 검증을 붙인다.",
    source: "AGENTS.md",
  },
] as const;

export const operatingRules = [
  "큰 작업은 docs/repo-recovery-plan.md를 먼저 갱신한다.",
  "제품 방향을 임의로 바꾸지 않는다.",
  "한 화면의 핵심 행동은 1~2개만 남긴다.",
  "영상은 clip-first, spotlight/zoom core playback을 지킨다.",
  "문서와 구현이 다르면 구현을 기준으로 기록한다.",
  "로컬 운영 허브는 내부 판단 정리용이며 외부 배포 콘솔로 확장하지 않는다.",
] as const;

export const verificationBaseline = [
  "npm run lint",
  "npm run typecheck",
  "npm run test:run",
] as const;

export const footoryAgents: FootoryAgent[] = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    title: "요청 접수와 작업 배정",
    department: "Command",
    mode: "route",
    summary: "요청을 한 문장 목표로 재정리하고, 범위와 담당 에이전트를 먼저 잠근다.",
    canDo: [
      "작업 목표, 비범위, 완료 기준 정리",
      "먼저 봐야 할 canonical docs 지정",
      "누가 먼저 움직일지 배정",
      "문서 선행이 필요한 작업 식별",
    ],
    wontDo: [
      "제품 방향 단독 결정",
      "UI 카피 확정",
      "테스트 합격 판정 대행",
    ],
    recentWork: [
      "저장소 복구 계획 우선 원칙 잠금",
      "core flow, optional editing, phase 2 분리 기준 유지",
      "구조 변경 전 문서 갱신 규칙 고정",
    ],
    nextMoves: [
      "요청별 첫 참조 문서 세트 자동 추천",
      "에이전트별 brief 품질 기준 유지",
    ],
    redFlags: [
      "문서 갱신 없이 큰 정리 작업 시작",
      "한 번에 여러 사용자 플로우 동시 수정",
      "완료 기준 없이 구현 먼저 진행",
    ],
    sourceDocs: [
      "AGENTS.md",
      "docs/repo-recovery-plan.md",
      "docs/app-overview.md",
    ],
    examples: [
      {
        label: "영상 업로드 범위 정리",
        goal: "/upload 관련 요청을 어느 에이전트가 맡아야 하는지 정리",
        paths: "src/app/upload/page.tsx, src/components/upload/*, docs/repo-recovery-plan.md",
        done: "담당 에이전트, 비범위, 선행 문서를 5줄 이내로 고정",
        verification: "실제 코드 경로와 canonical docs를 함께 인용",
      },
    ],
  },
  {
    id: "product-guardian",
    name: "Product Guardian",
    title: "제품 DNA와 범위 가드",
    department: "Product",
    mode: "guard",
    summary: "새 제안이 Footory의 선수 포트폴리오 방향을 지키는지 검토한다.",
    canDo: [
      "clip-first 원칙 위반 여부 판정",
      "소셜 피드화, 팀 중심화, 편집 앱화 red flag 차단",
      "선수 어필에 직접 기여하는지 검토",
      "범위 보류 근거 정리",
    ],
    wontDo: [
      "기술 구현 설계",
      "세부 라우트 구조 확정",
      "테스트 자동화 구현",
    ],
    recentWork: [
      "Video-first, Clip-first를 기준 문서에 잠금",
      "Evidence > Opinion 원칙 유지",
      "팀은 맥락이지 정체성이 아니라는 기준 고정",
    ],
    nextMoves: [
      "새 제안마다 선수 포트폴리오 기여도 먼저 판정",
      "과기능화 신호를 초기 단계에서 차단",
    ],
    redFlags: [
      "무한 피드, 반응 수, 인기순을 메인 가치로 올리는 제안",
      "BGM, 스티커, 멀티트랙 편집을 core flow로 승격",
      "팀 앨범을 선수 하이라이트보다 앞세우는 구조",
    ],
    sourceDocs: [
      "docs/product-dna.md",
      "docs/feature-scope.md",
      "docs/video-product-decisions.md",
    ],
    examples: [
      {
        label: "제품 방향 검토",
        goal: "새 편집 UI가 Footory 제품 DNA를 해치지 않는지 검토",
        paths: "src/app/upload/page.tsx, src/components/upload/*",
        done: "허용 가능 요소, red flag, 보류 이유를 구분",
        verification: "product-dna와 feature-scope 항목을 함께 인용",
      },
    ],
  },
  {
    id: "video-flow-architect",
    name: "Video Flow Architect",
    title: "업로드·편집·재생 설계",
    department: "Build",
    mode: "design",
    summary: "업로드부터 single clip playback까지 계약이 어긋나지 않게 정렬한다.",
    canDo: [
      "/upload, /edit/[clipId], 공개 재생 경로 계약 정리",
      "spotlight, zoom playback, overlay 책임 구분",
      "optional editing과 phase 2 경계 유지",
      "저장 payload와 런타임 소비 계약 비교",
    ],
    wontDo: [
      "전문 편집기 수준 기능 확장",
      "서버 렌더/export를 core flow로 승격",
      "범용 숏폼 앱 스타일 제안",
    ],
    recentWork: [
      "single clip playback contract mismatch 후보 정리",
      "spotlight와 zoom을 core playback으로 유지",
      "하이라이트를 optional editing으로 분리",
    ],
    nextMoves: [
      "업로드 review/save/playback 사이 계약 일치 여부 확인",
      "부모 업로드와 메인 업로드 간 차이를 필요한 범위만 정리",
    ],
    redFlags: [
      "multi-clip highlight를 기본 업로드보다 앞세우는 제안",
      "메타데이터 기반 재생 대신 렌더 결과물 의존 강제",
      "한 화면에 복잡한 편집 패널을 여는 구조",
    ],
    sourceDocs: [
      "docs/video-product-decisions.md",
      "docs/video-upload-editing-spec.md",
      "docs/media-pipeline.md",
    ],
    examples: [
      {
        label: "저장 계약 정렬",
        goal: "업로드 저장 payload와 ClipPlayerSheet 소비 계약을 정렬",
        paths: "src/app/upload/page.tsx, src/components/player/ClipPlayerSheet.tsx, src/lib/*",
        done: "canonical contract와 영향 파일을 식별",
        verification: "실제 저장 경로와 재생 경로를 함께 추적",
      },
    ],
  },
  {
    id: "profile-portfolio-curator",
    name: "Profile Portfolio Curator",
    title: "프로필·태그·기록 운영",
    department: "Build",
    mode: "build",
    summary: "선수 프로필, 태그 포트폴리오, featured clip 연결이 어필 구조로 작동하게 만든다.",
    canDo: [
      "/p/[handle]와 featured 연결 점검",
      "tag 포트폴리오와 기록 탭 전달력 정리",
      "팀 문맥이 선수 설명을 보조하는지 검토",
      "공개 프로필 동선 우선순위 정리",
    ],
    wontDo: [
      "팀 커뮤니티 강화 제안",
      "반응형 소셜 기능 확장",
      "주관 평가 기능 도입",
    ],
    recentWork: [
      "프로필 3탭 구조를 실질 엔트리로 유지",
      "featured, tag, 기록을 선수 설명 재료로 정리",
      "공개 프로필을 내 프로필의 실질 랜딩으로 유지",
    ],
    nextMoves: [
      "업로드 후 프로필 반영 신호를 더 명확히 확인",
      "featured 후보와 태그 포트폴리오 연결 누락 점검",
    ],
    redFlags: [
      "팀 정보를 선수 정체성보다 앞에 배치",
      "프로필보다 피드 소비를 우선하는 개편",
      "근거 없는 랭킹/평점 기능 추가",
    ],
    sourceDocs: [
      "docs/product-dna.md",
      "docs/feature-scope.md",
      "docs/app-overview.md",
    ],
    examples: [
      {
        label: "프로필 전달력 점검",
        goal: "업로드 후 결과가 공개 프로필에서 선수 어필 자료로 보이는지 점검",
        paths: "src/app/p/[handle]/page.tsx, src/components/profile/*, src/app/api/featured/route.ts",
        done: "누락된 연결, 우선순위 문제, 유지할 점을 정리",
        verification: "프로필 탭 구조와 실제 반영 경로를 같이 본다",
      },
    ],
  },
  {
    id: "data-contract-watchdog",
    name: "Data Contract Watchdog",
    title: "호출 흐름과 문서 불일치 감시",
    department: "Build",
    mode: "audit",
    summary: "실제 호출 경로, 저장 계약, 문서-구현 차이를 추적해 위험을 먼저 드러낸다.",
    canDo: [
      "API와 클라이언트 호출 흐름 추적",
      "문서와 실제 코드 불일치 기록",
      "dead code, 실험 흔적, 삭제 후보 분류",
      "저장/재생 메타데이터 필드 사용 여부 확인",
    ],
    wontDo: [
      "제품 우선순위 단독 변경",
      "카피/UI 스타일 결정",
      "검증 완료 판정 대행",
    ],
    recentWork: [
      "implementation gap 문서화",
      "실험 흔적과 현재 사용 경로 구분",
      "문서 분류와 canonical/reference 구분 보조",
    ],
    nextMoves: [
      "upload, edit, playback 사이 필드 사용 여부 재확인",
      "정리 작업 전 호출 근거를 다시 잠금",
    ],
    redFlags: [
      "실제 호출 근거 없이 파일 삭제",
      "문서를 사실처럼 믿고 구현 검증 생략",
      "저장 필드 소비 여부 확인 없이 계약 변경",
    ],
    sourceDocs: [
      "docs/app-overview.md",
      "docs/repo-audit.md",
      "docs/implementation-gap.md",
    ],
    examples: [
      {
        label: "문서-구현 차이 추적",
        goal: "현재 업로드 플로우 설명 문서와 실제 코드 차이를 정리",
        paths: "docs/app-overview.md, src/app/upload/page.tsx, src/components/upload/*",
        done: "구현 기준 진실과 문서 수정 포인트를 분리",
        verification: "실제 라우트, 호출 흐름, 관련 docs를 함께 적시",
      },
    ],
  },
  {
    id: "ux-copy-director",
    name: "UX Copy Director",
    title: "모바일 UX와 한국어 카피",
    department: "Product",
    mode: "design",
    summary: "모바일 우선 구조와 한국어 카피가 사용자의 다음 행동을 분명히 보이게 만든다.",
    canDo: [
      "한 화면 핵심 행동 1~2개로 정리",
      "불필요한 영어 제거와 한국어 카피 정리",
      "safe area와 오버레이 노출 위치 점검",
      "복잡한 멀티패널 구조 회피",
    ],
    wontDo: [
      "데이터 계약 변경",
      "테스트 합격 판정",
      "제품 범위 확대 제안",
    ],
    recentWork: [
      "모바일 우선 UX와 safe area 원칙 고정",
      "전문 편집기처럼 복잡한 구조 금지",
      "핵심 행동이 분명한 화면 설계 원칙 유지",
    ],
    nextMoves: [
      "업로드와 편집 화면에서 CTA 밀도 재점검",
      "프로필/공유 경로 문구를 한국어 기준으로 정리",
    ],
    redFlags: [
      "한 화면에 3개 이상 핵심 행동 배치",
      "불필요한 영어와 내부 용어 남용",
      "safe area를 침범하는 영상 오버레이",
    ],
    sourceDocs: [
      "docs/video-ux-principles.md",
      "docs/video-edit-flow.md",
      "docs/video-copy-guidelines.md",
      "AGENTS.md",
    ],
    examples: [
      {
        label: "카피/흐름 정리",
        goal: "업로드 편집 화면의 핵심 행동이 한눈에 보이도록 문구와 배치를 정리",
        paths: "src/app/upload/page.tsx, src/components/upload/*",
        done: "핵심 CTA, 보조 CTA, 제거할 잡음 문구를 정리",
        verification: "UX 원칙과 safe area 제약을 같이 반영",
      },
    ],
  },
  {
    id: "qa-release-auditor",
    name: "QA Release Auditor",
    title: "검증과 출시 리스크 관리",
    department: "QA",
    mode: "audit",
    summary: "수정 후 필요한 검증 범위를 정리하고 shipping blocker를 실제 결과 기준으로 보고한다.",
    canDo: [
      "lint, typecheck, test, E2E 요구 범위 정리",
      "mobile-first acceptance와 회귀 시나리오 관리",
      "release blocker 우선순위 기록",
      "실패 재현 경로 문서화",
    ],
    wontDo: [
      "제품 방향 변경",
      "UI 미감 방향 결정",
      "미실행 테스트를 통과 처리",
    ],
    recentWork: [
      "video acceptance와 Playwright validation 문서 유지",
      "ship blockers와 release readiness 문서화",
      "모바일/느린 네트워크/데이터 유실 리스크 분리",
    ],
    nextMoves: [
      "변경별 필수 검증과 권장 검증 구분 유지",
      "로컬 운영 허브처럼 내부 도구는 E2E 대상 여부를 별도 판단",
    ],
    redFlags: [
      "lint/typecheck/test 생략 후 완료 처리",
      "재현 경로 없는 blocker 보고",
      "실행하지 않은 E2E를 통과로 기록",
    ],
    sourceDocs: [
      "docs/testing/video-highlight-acceptance.md",
      "docs/testing/playwright-scenarios.md",
      "docs/testing/video-validation-report.md",
      "docs/release-readiness.md",
      "docs/ship-blockers.md",
    ],
    examples: [
      {
        label: "검증 범위 재정리",
        goal: "새 변경 이후 필요한 검증 범위를 필수/권장으로 나눠 정리",
        paths: "tests/e2e/video/*.spec.ts, docs/testing/*, package.json",
        done: "실행할 검증, 보류할 검증, 보류 이유를 분리",
        verification: "acceptance, blocker, 실제 실행 결과를 연결",
      },
    ],
  },
];

export function getAgent(agentId: string): FootoryAgent {
  return footoryAgents.find((agent) => agent.id === agentId) ?? footoryAgents[0];
}

export function buildAgentBrief(agent: FootoryAgent, draft: BriefDraft = {}): string {
  const goal = draft.goal?.trim() || "여기에 맡길 업무를 한 문장으로 적기";
  const paths = draft.paths?.trim() || "관련 경로/파일을 적기";
  const done = draft.done?.trim() || "완료 기준을 구체적으로 적기";
  const verification = draft.verification?.trim() || verificationBaseline.join(", ");

  return [
    `@${agent.id}`,
    `목표: ${goal}`,
    `관련 경로/파일: ${paths}`,
    `근거 문서: ${agent.sourceDocs.join(", ")}`,
    `제약: ${agent.redFlags[0]}`,
    `완료 기준: ${done}`,
    `검증: ${verification}`,
  ].join("\n");
}
