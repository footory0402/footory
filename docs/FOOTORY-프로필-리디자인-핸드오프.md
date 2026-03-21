# FOOTORY 프로필 리디자인 v5 — Claude Code 핸드오프

## 개요

프로필 페이지 전면 재설계. 기존 레이더 차트 + 세로 나열 구조를 폐기하고,
좌측 사진 + 우측 정보 히어로 + 탭 네비게이션 구조로 전환.

**프로토타입 파일**: 이 문서와 함께 제공되는 `footory-profile-v5.jsx`를 참고.
실제 React 코드이므로 컴포넌트 구조와 스타일을 그대로 따라갈 것.

---

## 핵심 설계 원칙

1. **스카우터 관점 우선**: 정보 순서 = 스카우터가 보고 싶은 순서
2. **Authentic data**: 자기 신고 vs 팀 인증을 시각적으로 구분
3. **영상이 핵심**: 하이라이트 탭이 기본 탭. 대표 영상이 가장 먼저 보임
4. **현실적 데이터만**: 유소년이 실제로 기록할 수 있는 항목만 포함
5. **Pitch Black Gold 테마**: 다크 배경 + 골드 악센트 유지

---

## 정보 구조 (Information Architecture)

```
프로필 페이지
├── [고정] 상단 네비게이션 바 (FOOTORY 로고 + 아이콘)
├── [고정] 히어로 섹션
│   ├── 좌: 프로필 사진 (세로형, 40% 너비)
│   │   ├── 포지션 배지 (좌상단)
│   │   └── MVP 배지 (좌하단)
│   ├── 우: 선수 정보 (60% 너비)
│   │   ├── 이름
│   │   ├── 핸들 + 지역
│   │   ├── 신체정보 태그 (출생년, 키, 몸무게, 주발)
│   │   ├── 플레이 스타일 한줄
│   │   ├── 팀 상태 (has-team / no-team / transferring)
│   │   └── 팔로워 / 팔로잉 / 조회
│   └── 액션 바 (공유 / PDF / 편집)
├── [sticky] 탭 바 (하이라이트 | 기록 | 커리어)
└── [스크롤] 탭 콘텐츠
    ├── 하이라이트 탭 (기본)
    │   ├── 대표 영상 (16:9, 크게)
    │   ├── 스킬 태그 필터
    │   └── 전체 클립 그리드 (2열)
    ├── 기록 탭
    │   ├── 플레이 스타일 카드
    │   ├── 체력 측정 카드 (2열) + 인증 배지
    │   └── 성장 추이 리스트
    └── 커리어 탭
        ├── 현재 소속
        ├── 대회 기록 카드 + 인증 배지
        ├── 수상 / 성과
        └── 소속 이력
```

---

## 데이터 모델

### Player Profile

```typescript
interface PlayerProfile {
  // 기본 정보
  name: string;
  handle: string;           // @logan
  position: string;         // FW, MF, DF, GK 등
  profileImageUrl: string | null;
  birthYear: number;
  region: string;
  height: number;           // cm
  weight: number;           // kg
  foot: string;             // "오른발" | "왼발" | "양발"

  // 소셜
  followers: number;
  following: number;
  views: number;
  mvpCount: number;

  // 플레이 스타일 (테스트 결과)
  playStyle: {
    title: string;          // "공격형 드리블러"
    quote: string;          // "공을 잡으면 돌파부터"
    icon: string;           // 이모지
  } | null;

  // 팀 상태
  currentTeam: {
    name: string;
    since: string;          // "2025"
  } | null;
}
```

### Physical Test (체력 측정)

```typescript
interface PhysicalTest {
  id: string;
  key: string;              // "50m 달리기", "슈팅 속도" 등
  value: string;            // "7.3", "86" 등 (문자열 — 포맷 다양)
  unit: string;             // "초", "km/h", "회", "" 등
  date: string;             // "2025.3.13"
  source: "team" | "self";  // 핵심: 인증 출처
  verifier: string | null;  // "FC서울 U-15", null
  change: {                 // 이전 대비 변동
    val: string | number;
    dir: "up" | "down";
  } | null;
}
```

### Tournament Record (대회 기록)

```typescript
interface TournamentRecord {
  id: string;
  name: string;             // "2026 전국 소년체전"
  type: "공식대회" | "리그" | "친선";
  date: string;             // "2026.02" 또는 "2025.09~11"
  result: string | null;    // "8강", "리그 3위", null
  personal: {
    goals: number;
    assists: number;
    mvp: boolean;
  };
  source: "team" | "self";
  verifier: string | null;
}
```

### Video Clip

```typescript
interface VideoClip {
  id: string;
  title: string;            // "vs 수원전 드리블 돌파"
  duration: string;         // "0:14"
  date: string;
  tags: string[];           // ["드리블", "슈팅"]
  views: number;
  featured: boolean;        // 대표 영상 여부
  thumbnailUrl: string | null;
  videoUrl: string;         // R2 URL
  tournament: string | null; // 연결된 대회명
}
```

### Career

```typescript
interface CareerHistory {
  team: string;
  period: string;           // "2025 ~"
  current: boolean;
}

interface Award {
  title: string;            // "2026 소년체전"
  detail: string;           // "MVP"
  source: "team" | "self";
  verifier: string | null;
}
```

---

## 디자인 토큰

```typescript
const DESIGN_TOKENS = {
  // Colors
  gold: "#c9a84c",
  goldLight: "#e8d48b",
  goldDim: "rgba(201,168,76,0.5)",
  goldBg: "rgba(201,168,76,0.08)",
  goldBorder: "rgba(201,168,76,0.15)",
  goldGlow: "rgba(201,168,76,0.12)",

  dark: "#080808",           // 페이지 배경
  card: "#111111",           // 카드 배경
  cardBorder: "rgba(255,255,255,0.06)",

  text: "#f0f0f0",
  textSub: "rgba(255,255,255,0.50)",
  textDim: "rgba(255,255,255,0.22)",

  green: "#4ade80",          // 팀 인증 색상
  greenBg: "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.18)",

  red: "#f87171",            // 하락 지표
  blue: "#60a5fa",           // 리그 배지 / 진학이적 상태
  blueBg: "rgba(96,165,250,0.08)",
  blueBorder: "rgba(96,165,250,0.18)",

  // Typography
  fontDisplay: "'Oswald', sans-serif",    // 숫자, 레이블, 제목
  fontBody: "'Noto Sans KR', sans-serif", // 본문, 설명
};
```

---

## 컴포넌트 목록

### 공통 컴포넌트
| 컴포넌트 | 용도 |
|---|---|
| `VerifyBadge` | 팀 인증 / 자기 기록 배지. `source`, `verifier`, `compact` props |
| `TournamentTypeBadge` | 공식대회(골드) / 리그(블루) / 친선(그레이) |
| `SectionHeader` | 골드 바 + 제목 + 카운트 + 우측 액션 버튼 |
| `AddButton` | "+ 라벨" 형태 소형 버튼. `gold` prop |

### 히어로
| 컴포넌트 | 용도 |
|---|---|
| `HeroSection` | 좌우 분할 히어로. `teamState` prop으로 팀 상태 분기 |

### 탭 콘텐츠
| 컴포넌트 | 용도 |
|---|---|
| `TabBar` | sticky 탭 네비게이션 |
| `HighlightsTab` | 대표 영상 + 태그 필터 + 클립 그리드 |
| `RecordsTab` | 플레이 스타일 + 체력 측정 카드 + 성장 추이 |
| `CareerTab` | 소속 + 대회 기록 + 수상 + 이력 |

---

## 팀 상태 분기 (HeroSection)

| teamState | 조건 | UI |
|---|---|---|
| `has-team` | `currentTeam !== null` | 소속팀 표시 + [변경] 버튼 |
| `no-team` | `currentTeam === null` | 골드 CTA: 초대코드 가입 / 팀 만들기 |
| `transferring` | 유저가 "변경" 누른 상태 | 블루 CTA: 새 팀 초대코드 / 새 팀 등록 |

**진학/이적 플로우**: 
1. 팀 있음 상태에서 [변경] 탭 → transferring 상태
2. 새 팀 가입 완료 → 기존 팀은 자동으로 커리어 이력에 추가
3. 새 팀이 currentTeam으로 설정

---

## 영상 구조

### 대표 영상 (Featured)
- 16:9 비율, 골드 테두리 + glow shadow
- `⭐ FEATURED` 배지 (좌상단)
- 조회수 (우상단)
- 하단: 제목, duration, 날짜, 연결 대회명, 스킬 태그
- **항상 최상단 고정** — 다른 클립 위에

### 일반 클립
- 3:4 비율, 2열 그리드
- 좌상단: 스킬 태그 (최대 2개)
- 우상단: duration
- 하단: 제목 + 날짜 + 조회수

### 스킬 태그
- 영상 업로드 시 선택 (복수 선택 가능)
- 기본 태그: 드리블, 슈팅, 패스, 프리킥, 헤딩, 수비, 세트피스
- 태그 필터 바: 클립 목록 상단에 가로 스크롤, 0개인 태그는 숨김

---

## 인증 시스템

### 두 가지 레벨
| 레벨 | 색상 | 아이콘 | 의미 |
|---|---|---|---|
| `team` | 🟢 초록 | ✓ | 코치/팀이 확인한 기록 |
| `self` | ⚪ 회색 | ○ | 본인이 직접 입력한 기록 |

### 적용 범위
- 체력 측정 카드 → 각 카드 하단에 배지
- 대회 기록 카드 → 카드 우상단에 배지
- 수상/성과 → 우측에 배지
- 팀 인증 카드는 테두리가 초록(greenBorder)

### 향후 확장
- 코치 계정에서 선수 기록을 "인증"하는 플로우 추가 가능
- `self` → `team` 업그레이드 시 배지 색상 자동 전환

---

## 폐기 항목 (v1.2 대비)

| 폐기 | 이유 |
|---|---|
| 레이더 차트 | 정규화 기준 없음 + 중복 표시 문제 |
| 정규화 점수 (1~99) | 자기 신고에 점수 매기면 신뢰도 0 |
| OVR 종합 점수 | 정규화 점수 폐기에 따라 함께 제거 |
| 경기 출전/골/도움 (히어로) | 유소년이 매경기 추적 불가능 |
| 팔로워 바 (별도 섹션) | 히어로 안으로 통합 |
| 공유/PDF (중간 배치) | 액션 바로 이동 |

---

## Supabase 스키마 변경 필요사항

### 신규 테이블

```sql
-- 체력 측정 기록
CREATE TABLE physical_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id),
  key TEXT NOT NULL,           -- "50m 달리기"
  value TEXT NOT NULL,         -- "7.3"
  unit TEXT DEFAULT '',
  measured_at DATE,
  source TEXT CHECK (source IN ('team', 'self')),
  verifier_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 대회 기록
CREATE TABLE tournament_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('공식대회', '리그', '친선')),
  date_text TEXT,              -- "2026.02" 자유 포맷
  result TEXT,                 -- "8강"
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  is_mvp BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('team', 'self')),
  verifier_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 수상/성과
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  detail TEXT,
  source TEXT CHECK (source IN ('team', 'self')),
  verifier TEXT,               -- "대한축구협회" 등 자유 텍스트
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 영상 클립 (기존 videos 테이블 확장)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS tournament_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
```

### profiles 테이블 변경

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_quote TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style_icon TEXT DEFAULT '⚡';
```

---

## 구현 우선순위

### Phase 1: 히어로 + 탭 구조
1. 프로필 페이지 레이아웃을 좌우 분할 히어로로 변경
2. 탭 네비게이션 (하이라이트 | 기록 | 커리어) 구현
3. 팀 상태 3분기 (has-team / no-team / transferring) 구현

### Phase 2: 하이라이트 탭
4. 대표 영상 크게 표시
5. 스킬 태그 시스템 (업로드 시 태그 선택 + 필터)
6. 클립 그리드 (3:4 비율, 2열)

### Phase 3: 기록 탭
7. 체력 측정 카드 + 인증 배지
8. 성장 추이 리스트
9. DB 스키마: physical_tests 테이블

### Phase 4: 커리어 탭
10. 대회 기록 카드 + 인증 배지
11. 수상/성과
12. DB 스키마: tournament_records, awards 테이블

---

## 참고: 프로토타입 파일

`footory-profile-v5.jsx` — 실제 동작하는 React 컴포넌트.
디자인 토큰, 컴포넌트 구조, 레이아웃, 간격, 색상 전부 이 파일이 source of truth.
