# SPRINT-25: 코치 태그 + 스카우터 워치리스트

> Phase D | 의존: SPRINT-24 완료
> 예상: 3~4시간

---

## 목표

인증 코치의 영상 평가 시스템 + 인증 스카우터의 관심 선수 리스트

---

## 작업

### 1. DB

```sql
CREATE TABLE coach_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  comment TEXT,        -- 공개 코멘트 (80자)
  private_note TEXT,   -- 비공개 피드백 (선수에게만)
  rating TEXT,         -- 'good', 'great', 'excellent'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, clip_id)
);

CREATE TABLE scout_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scout_id, player_id)
);
```

RLS:
```sql
-- coach_reviews: 누구나 읽기 (private_note는 API에서 필터)
-- scout_watchlist: 본인만
CREATE POLICY watchlist_all ON scout_watchlist FOR ALL
  USING (scout_id = auth.uid());
```

### 2. 코치 태그/평가

파일: `src/components/coach/CoachReviewForm.tsx`
파일: `src/components/coach/CoachReviewBadge.tsx`

```
권한: role='coach' AND is_verified=true
대상: 자기 팀 선수 + 팔로우한 선수의 영상

영상 상세 화면에서:
  [📋 코치 리뷰 남기기] 버튼 (인증 코치에게만 보임)

리뷰 폼:
  평가: [⚽ 좋음] [🔥 훌륭함] [💎 최고] (택 1)
  한 줄 코멘트 (공개, 80자): _______________
  비공개 피드백 (선수만, 200자): _______________
  [저장]

영상 카드에 표시:
  📋 코치 리뷰 뱃지 (리뷰가 있는 영상)
  탭하면 코치명 + 평가 + 코멘트 표시

비공개 피드백:
  선수 본인이 영상 상세에서만 볼 수 있음
  API에서 coach_reviews 조회 시:
    요청자 = 코치 본인 → 전체 반환
    요청자 = 해당 영상 소유자 → 전체 반환
    그 외 → private_note 제외

알림:
  코치 리뷰 등록 시 선수에게 알림:
  "📋 박진우 코치가 리뷰를 남겼어요"

선수가 코치 리뷰 숨기기:
  영상 ⋮ > "코치 리뷰 숨기기" → 공개 비표시 (private만)
```

### 3. 스카우터 워치리스트

파일: `src/components/scout/WatchlistPanel.tsx`

```
권한: role='coach' AND is_verified=true (스카우터 포함)

진입점: 선수 프로필 > [⭐ 관심 선수 추가]
        검색 결과 > 각 선수 옆 ⭐ 아이콘

워치리스트 화면 (프로필 > 관심 선수):
┌─────────────────────────────────┐
│ ← 관심 선수 (비공개)             │
├─────────────────────────────────┤
│ (사진) 김민준  FW · 수원FC U-15  │
│ 메모: "스피드 뛰어남, 약한 발..."│
│ 최근 영상: 2일 전               │
│                                 │
│ (사진) 배준혁  FW · 부산IP U-15  │
│ 메모: "1v1 돌파력 관찰 필요"     │
│ 최근 영상: 5일 전               │
└─────────────────────────────────┘

기능:
  - 메모 추가/수정 (비공개)
  - 관심 선수 제거
  - 관심 선수 새 영상 업로드 시 알림 (선택)
  - 선수에게는 관심 목록 노출 안 됨

비공개 보장:
  scout_watchlist는 scout_id = auth.uid() 조건의 RLS
  선수 측에서는 조회 불가
```

### 4. 코치/스카우터 프로필 표시

코치/스카우터 프로필에:
```
📋 코치 박진우
수원FC U-15 감독
✅ 인증 코치

리뷰한 영상: 23개
관리 팀: 수원FC U-15
```

---

## 확인 사항

- [ ] 인증 코치가 영상에 리뷰 남길 수 있음
- [ ] 리뷰가 있는 영상에 📋 뱃지 표시
- [ ] 비공개 피드백은 코치+선수만 볼 수 있음
- [ ] 선수에게 리뷰 알림
- [ ] 스카우터가 관심 선수 추가/제거
- [ ] 워치리스트가 비공개 (선수에게 안 보임)
- [ ] 관심 선수 새 영상 시 알림 (선택)
- [ ] 미인증 코치/스카우터에게는 기능 비활성
