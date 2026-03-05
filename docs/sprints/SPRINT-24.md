# SPRINT-24: 주간 챌린지 + 퀘스트

> Phase D | 의존: SPRINT-23 완료
> 예상: 3~4시간

---

## 목표

주간 챌린지 시스템 + 초보자/주간 퀘스트 + XP 연동

---

## 작업

### 1. DB

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  skill_tag TEXT,
  week_start DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,  -- 'onboarding', 'weekly'
  quest_key TEXT NOT NULL,   -- 'first_upload', 'vote_3', 'send_kudos_5'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, quest_key)
);
```

### 2. 주간 챌린지

파일: `src/components/challenge/ChallengeBanner.tsx`
파일: `src/components/challenge/ChallengeRanking.tsx`

```
홈 피드 상단 (베스트 캐러셀 아래):
┌───────────────────────────┐
│ 🎯 이번 주 챌린지          │
│ "무회전 프리킥"            │
│ 참여 12명 · 3일 남음       │
│              [참여하기 →]  │
└───────────────────────────┘

[참여하기] → 영상 업로드 (챌린지 태그 자동 추가)

챌린지 랭킹 (챌린지 배너 탭하면):
  해당 챌린지 태그 영상들, 응원 많은 순
  1위: 챌린지 뱃지 🎯 (프로필에 표시)

챌린지 데이터:
  초기에는 수동 입력 (관리자)
  challenges 테이블에 INSERT
  is_active = true인 것만 표시
```

스킬 태그와 연동:
  챌린지 태그로 업로드 → 해당 스킬 태그가 프로필에 자동 추가

### 3. 퀘스트

파일: `src/components/quest/QuestChecklist.tsx`

```
프로필 탭 상단 (레벨 아래) 또는 홈 피드 인라인:

초보자 퀘스트 (가입 후 7일):
  □ 프사 등록하기         +10 XP
  □ 첫 영상 올리기        +50 XP
  □ 친구 1명 팔로우       +10 XP
  □ 첫 응원 보내기        +10 XP
  □ 첫 DM 보내기          +10 XP
  → 전부 완료: "🎒 신입생" 뱃지

주간 퀘스트 (매주 월요일 리셋):
  □ 영상 1개 업로드       +30 XP
  □ MVP 투표 3표 사용     +20 XP
  □ 응원 5개 보내기       +10 XP
  → 전부 완료: 보너스 +50 XP

UI:
  작은 카드, 체크리스트 형태
  완료 항목: 취소선 + 골드 체크 ✓
  전부 완료 시: 축하 애니메이션 + 뱃지 획득
  완료 후 카드 숨김 (다음 주까지)
```

### 4. 퀘스트 트리거

파일: `src/lib/quests.ts`

```typescript
export async function checkQuestCompletion(
  profileId: string,
  action: 'upload' | 'follow' | 'kudos' | 'dm' | 'vote' | 'profile_photo'
): Promise<void> {
  // 1. 해당 action에 대응하는 quest_key 확인
  // 2. 조건 충족 시 quest_progress에 completed_at 설정
  // 3. XP 부여 (profiles 레벨 업데이트와 연동)
  // 4. 전체 완료 시 뱃지 부여 + 타임라인 이벤트
}
```

기존 업로드/팔로우/응원/DM/투표 로직에서 checkQuestCompletion() 호출 추가.

### 5. XP → 레벨 연동

기존 레벨 시스템에 XP 포인트 연동:
```
퀘스트 완료 → XP 획득 → 레벨업 기준에 반영
기존 레벨 기준과 병합 (영상 수 + XP 합산)
```

---

## 확인 사항

- [ ] 홈 피드에 챌린지 배너 표시
- [ ] 챌린지 참여 → 태그 붙은 영상 업로드
- [ ] 챌린지 랭킹 (응원 많은 순)
- [ ] 초보자 퀘스트 체크리스트 표시
- [ ] 퀘스트 완료 시 XP 획득 + 체크 표시
- [ ] 전부 완료 시 뱃지 획득
- [ ] 주간 퀘스트 매주 리셋
