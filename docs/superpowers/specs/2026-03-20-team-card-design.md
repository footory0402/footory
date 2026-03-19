# Team Card 디자인 스펙

## 개요
팀의 종합 전력을 한눈에 보여주는 카드 컴포넌트. FIFA 카드 복제가 아닌 Footory만의 스코어보드 언어.

## 사용 맥락
| 맥락 | 사이즈 | 용도 |
|------|--------|------|
| 탐색 페이지 팀 랭킹 | Compact (~68px) | 리스트에서 여러 팀 비교 |
| 팀 상세 페이지 헤더 | Full (~180px) | 단독 팀 상세 정보 |
| 프로필 내 소속팀 | Inline (~50px) | 프로필 안에 인라인 표시 |

## 데이터 모델
```typescript
interface TeamCardProps {
  team: {
    id: string;
    name: string;
    logoUrl?: string;        // 없으면 이니셜 fallback
    ageGroup?: string;       // "U-13", "U-15" 등
    city?: string;           // "경기 용인"
    memberCount: number;
  };
  stats: {
    ovr: number;             // 종합 레이팅 0~99
    atk: number;             // 공격 라인 평균 0~99
    mid: number;             // 미드필드 평균 0~99
    def: number;             // 수비 라인 평균 0~99
    gk: number;              // 골키퍼 평균 0~99
  };
  rank?: number;             // 랭킹 순위 (선택)
  tags?: string[];           // ["MVP 3명", "활동 활발"] (Full에서만)
  variant: "compact" | "full" | "inline";
}
```

## OVR 계산 로직
```
OVR = round(ATK × 0.3 + MID × 0.3 + DEF × 0.25 + GK × 0.15)
```
각 라인 평균 = 해당 포지션 선수들의 개인 레이더 스탯 평균.

### 엣지 케이스
- **포지션에 선수 0명**: 해당 라인 값 = 0, OVR 가중치 재분배 없음 (있는 그대로 계산)
- **팀 멤버 0명**: 모든 스탯 0, OVR = 0 표시
- **스탯 데이터 없는 선수**: 계산에서 제외 (스탯 있는 선수만으로 평균)

### 스탯 데이터 출처
기존 `radar_stats` 테이블에서 선수별 6축(speed, power, stamina, technique, passing, defense) → 포지션별 라인으로 매핑:
- **ATK**: FW 선수들의 6축 평균
- **MID**: MF 선수들의 6축 평균
- **DEF**: DF 선수들의 6축 평균
- **GK**: GK 선수들의 6축 평균

서버에서 계산 후 `team_ranking_cache` 테이블에 `atk`, `mid`, `def`, `gk`, `ovr` 컬럼 추가 필요.

### 태그 생성 규칙 (Full 전용)
- MVP `N`명 → `mvpCount > 0`일 때 자동 생성
- 활동 활발 → `activityScore >= 70`일 때
- 주 N회 훈련 → `weeklyTrainingCount` 값 (팀 설정에서 입력)

## 색상 등급
| 범위 | 색상 | 토큰 |
|------|------|------|
| 85~99 | 골드 | `#D4A853` / `bg-gold` gradient |
| 70~84 | 그린 | `#4ADE80` / `bg-green` gradient |
| 50~69 | 블루 | `#60A5FA` / `bg-blue` gradient |
| 0~49 | 그레이 | `#71717A` / `bg-gray` gradient |

## Compact 카드 (기본)
```
┌─[1.5px gold accent line]──────────────────────────┐
│ [Rank] [Logo 40px] [Name + Sub] [OVR 28px] [Bars] │
│  14px   rounded-10  14px+10px    Oswald      4×6px │
│                                  gold-grad  h:32px │
└────────────────────────────────────────────────────┘
```
- **높이**: ~68px (padding 14px 상하)
- **배경**: `#1C1C22` (`card` 토큰)
- **보더**: `1px solid rgba(255,255,255,0.07)`
- **radius**: 12px
- **1위 강조**: border-color `rgba(212,168,83,0.2)` + gold shadow
- **미니 바**: 세로 막대 4개 (ATK/MID/DEF/GK), width 6px, gap 3px, rounded 3px
- **바 높이**: 값% (예: ATK 87 → height: 87%)
- **Rank 숫자**: Oswald 14px, 1위=골드, 2~3위=white, 4+위=gray

## Full 카드 (팀 상세 헤더)
```
┌─[2px gold accent line]────────────────────┐
│ [Logo 52px] [Name 18px + Meta] [OVR 44px] │
│             [age·city·members]  [label]    │
├────────────[divider]──────────────────────┤
│     [ATK]   [MID]   [DEF]   [GK]          │
│      87      81      78      69            │
│     [bar]   [bar]   [bar]   [bar]          │
│     ATK     MID     DEF     GK             │
├────────────────────────────────────────────┤
│ [tag] [tag] [tag]                          │
└────────────────────────────────────────────┘
```
- **높이**: ~180px
- **OVR**: Oswald 44px, gold gradient text
- **세로 바**: width 10px, 높이 비례, 상단에 숫자(Oswald 12px)
- **태그**: 하단, 배경 `rgba(255,255,255,0.04)`, rounded 6px

## Inline 카드 (프로필 내)
```
┌──────────────────────────────────────┐
│ [Logo 32px] [Name 13px + Meta] [OVR] │
│  rounded-8                     22px  │
└──────────────────────────────────────┘
```
- **높이**: ~50px (padding 10px)
- **배경**: `rgba(255,255,255,0.03)`
- **보더**: `1px solid rgba(255,255,255,0.06)`
- **radius**: 10px
- **OVR**: Oswald 22px, `#D4A853` solid

## 로고 Fallback
로고 URL이 없으면 팀명에서 이니셜 추출:
- "FC 용인 드래곤즈" → "FC"
- "성남 SC 유스" → "SC"
- "용인 드래곤즈" → "용인" (한글만 있으면 첫 2글자)
- 로직: 영문 대문자 약어 매칭 (`/[A-Z]{2,}/`) → 없으면 팀명 첫 2글자

## 폰트 규칙
| 요소 | 폰트 | 크기 | 무게 |
|------|------|------|------|
| OVR (Full) | Oswald | 44px | 700 |
| OVR (Compact) | Oswald | 28px | 700 |
| OVR (Inline) | Oswald | 22px | 600 |
| 팀명 | Noto Sans KR | 14~18px | 700~800 |
| 메타 정보 | Noto Sans KR | 10~11px | 400 |
| 바 라벨 | Rajdhani | 9px | 600 |
| 바 숫자 | Oswald | 12~13px | 600 |
| Rank | Oswald | 14px | 600 |

## 애니메이션
- 카드 진입: `fadeUp` 0.4s, stagger 0.05s per card
- 바 성장: 없음 (compact는 정적)
- 탭 press: `scale(0.985)` 0.15s

## 파일 구조
```
src/components/team/TeamCard.tsx        # 메인 컴포넌트 (variant prop)
src/components/team/TeamCardBars.tsx    # 미니 바 차트 (공용)
src/lib/team-stats.ts                  # OVR 계산, 색상 등급 유틸
```

## 기존 코드 변경
- `src/components/explore/TeamRanking.tsx` — 기존 팀 리스트 → TeamCard compact 사용
- `src/app/team/[id]/page.tsx` — TeamHeader 영역에 TeamCard full 삽입
- `src/components/player/ProfileCard.tsx` — 변경 없음 (개인 카드는 그대로)

## CSS 추가 사항
`globals.css`에 gradient 유틸 클래스 추가:
```css
.bar-gold { background: linear-gradient(0deg, #8B6914, #D4A853); }
.bar-green { background: linear-gradient(0deg, #166534, #4ADE80); }
.bar-blue { background: linear-gradient(0deg, #1e40af, #60A5FA); }
.bar-gray { background: linear-gradient(0deg, #3f3f46, #71717A); }
```

## 카드 동작
- **Compact/Inline 클릭**: `/team/[id]`로 라우팅 (`<Link>`)
- **Full**: 클릭 없음 (이미 팀 상세 페이지 내부)
- **너비**: full-width (부모 컨테이너 100%, max-width 430px는 앱 레벨 제약)
- **접근성**: 바에 `aria-label="공격 87점"` 등 스크린 리더 지원

## 제거 항목
기존 ProfileCard의 FIFA 요소들은 팀 카드에 사용하지 않음:
- conic-gradient 보더
- 필름 그레인 오버레이
- 280px 사진 영역
- 레이더 차트 (팀 카드 한정)
