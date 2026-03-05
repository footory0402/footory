# SPRINT-15b: 온보딩 역할 선택

> Phase A | 의존: 없음 (v1.1 완성 상태에서 시작)
> 예상: 3~4시간

---

## 목표

카카오 로그인 후 "선수/부모/코치·스카우터" 역할을 선택하고,
역할에 따라 다른 온보딩 플로우를 진행한다.

---

## 작업

### 1. DB 변경

```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'player';
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN birth_year INTEGER;
ALTER TABLE profiles ADD COLUMN height_cm INTEGER;
ALTER TABLE profiles ADD COLUMN weight_kg INTEGER;
ALTER TABLE profiles ADD COLUMN preferred_foot TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN profile_views INTEGER DEFAULT 0;

CREATE TABLE coach_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  document_url TEXT,
  referrer_id UUID REFERENCES profiles(id),
  team_code TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_links ADD COLUMN consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_links ADD COLUMN consent_at TIMESTAMPTZ;
```

### 2. 역할 선택 화면

파일: `src/components/onboarding/RoleSelect.tsx`

```
화면 구성:
"어떤 분이세요?"

3개 카드 (세로 배치):
  ⚽ 선수          — "직접 축구하는 선수예요"
  👨‍👩‍👦 부모/보호자   — "자녀의 축구를 응원해요"
  📋 코치/스카우터  — "선수를 지도하거나 발굴해요"

디자인:
  - 배경: #0C0C0E
  - 카드: #161618, radius 14px
  - 선택 시: 골드 테두리 #D4A853
  - 아이콘: 48px, 중앙 정렬
  - 하단: [다음] 버튼 (골드)
```

### 3. 선수 온보딩

파일: `src/components/onboarding/PlayerOnboarding.tsx`

기존 온보딩 플로우와 유사, 필드 추가:
- 이름 (카카오에서 자동)
- 포지션 (FW/MF/DF/GK)
- 출생연도 (카카오에서 자동 가능하면)
- 키/몸무게 (선택)
- 선호 발 (오른발/왼발/양발) (선택)
- 팀 가입 (선택)
- 프사 (선택)

### 4. 부모 온보딩

파일: `src/components/onboarding/ParentOnboarding.tsx`

```
Step 1: "자녀의 Footory 계정을 연결하세요"
  - [자녀 검색] — 이름 또는 @핸들로 검색
  - [자녀 초대] — 카카오 초대 링크 생성
  - [나중에] — 건너뛰기

Step 2: 완료 → 자녀 대시보드(홈)로 이동

자녀 연결 시: parent_links 테이블에 INSERT
```

### 5. 코치/스카우터 온보딩

파일: `src/components/onboarding/CoachOnboarding.tsx`

```
Step 1: 기본 정보
  - 이름
  - 소속 팀/기관
  - 역할 상세 (감독/코치/스카우터/기타)

Step 2: 인증 (선택, 나중에 가능)
  "인증하면 ✅ 뱃지가 표시되고 선수에게 DM을 보낼 수 있어요"
  - [팀 코드 입력]
  - [증빙 제출] — 파일 업로드
  - [나중에]

Step 3: 팀 만들기/가입 (선택)
  → 완료
```

### 6. 권한 체크 유틸

파일: `src/lib/permissions.ts`

```typescript
export type UserRole = 'player' | 'parent' | 'coach';

export function canUploadClip(role: UserRole): boolean;
export function canVoteMvp(role: UserRole): boolean;
  // player만 true. parent/coach는 false → MVP 탭에서 투표 버튼 숨김
export function canFollow(role: UserRole): boolean;
  // player만 true. parent/coach는 팔로우 버튼 숨김
export function canDm(senderRole: UserRole, senderVerified: boolean, targetRole: UserRole, isFollowing: boolean, isSameTeam: boolean): boolean;
export function canCoachReview(role: UserRole, verified: boolean): boolean;
export function canUseWatchlist(role: UserRole, verified: boolean): boolean;
```

**중요**: MVP 투표 UI에서 반드시 role 체크 적용.
부모/코치가 투표하면 어뷰징이 되므로 UI 레벨에서 차단.

파일: `src/hooks/usePermissions.ts`

```typescript
export function usePermissions() {
  // 현재 유저의 role, is_verified를 기반으로 권한 체크 훅
}
```

### 7. 온보딩 라우팅

기존 온보딩 플로우에 역할 선택 스텝을 첫 번째로 추가.
역할에 따라 다음 스텝이 분기.

role이 설정되면 profiles.role 업데이트.
이후 앱 전반에서 role 기반 UI 분기에 사용.

---

## 확인 사항

- [ ] 카카오 로그인 후 역할 선택 화면이 나오는가
- [ ] 선수 선택 시 기존 온보딩 + 추가 필드가 나오는가
- [ ] 부모 선택 시 자녀 연결 화면이 나오는가
- [ ] 코치 선택 시 인증 옵션이 나오는가
- [ ] profiles.role이 올바르게 저장되는가
- [ ] 디자인 토큰 (#0C0C0E, #D4A853, Noto Sans KR) 적용
