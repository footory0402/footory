# SPRINT-20: 안전장치 + 코치 인증

> Phase C | 의존: SPRINT-19 완료
> 예상: 4~5시간

---

## 목표

차단/신고 시스템 + DM 요청 (비팔로우) + 코치/스카우터 인증 + DM 권한 적용

---

## 작업

### 1. DB

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id),
  comment_id UUID REFERENCES comments(id),
  clip_id UUID REFERENCES clips(id),
  category TEXT NOT NULL,  -- 'harassment', 'spam', 'inappropriate', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  preview_message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
```

### 2. 차단

파일: `src/lib/blocks.ts`

```
차단 시:
  1. blocks 테이블 INSERT
  2. 상대방의 DM 불가
  3. 피드에서 상대 콘텐츠 숨김
  4. 상대 프로필 접근 불가 (404 표시)
  5. 상대의 응원/댓글 숨김
  6. 차단 사실 상대에게 미노출

차단 해제: blocks에서 DELETE

UI 진입점:
  - 대화 화면 ⋮ > 차단하기
  - 프로필 ⋮ > 차단하기
  - 프로필 > 설정 > 차단 목록
```

### 3. 신고

파일: `src/components/social/ReportModal.tsx`

```
신고 바텀시트:
  "이 사용자를 신고하시겠어요?"
  카테고리 선택:
    □ 괴롭힘/욕설
    □ 스팸/광고
    □ 부적절한 콘텐츠
    □ 기타
  설명 (선택): 텍스트 입력
  [신고하기]

신고 후:
  즉시 해당 메시지/댓글 숨김
  reports 테이블 INSERT
  (운영팀 수동 검토)
```

### 4. DM 요청

비팔로우 + 다른 팀일 때 DM 시도:
```
1. dm_requests INSERT (preview_message = 첫 메시지)
2. 상대에게 알림: "김코치님이 대화를 요청했어요"
3. 상대 DM 목록 하단 "DM 요청 (1)" 섹션에 표시
4. [수락] → 정상 대화 시작 (conversations 생성)
5. [거절] → dm_requests.status = 'rejected'
```

파일: `src/components/dm/DmRequestCard.tsx`

### 5. DM 권한 매트릭스 적용

파일: `src/lib/dm.ts` 수정

```typescript
export function canSendDm(sender: Profile, target: Profile, context: {
  isFollowing: boolean;
  isSameTeam: boolean;
}): 'allowed' | 'request' | 'blocked' {
  // 차단 체크
  // 같은 팀 or 팔로잉 → 'allowed'
  // 코치(인증) → 'allowed' (누구에게나)
  // 코치(미인증) → target이 미성년이면 'blocked'
  // 그 외 → 'request'
}
```

### 6. 코치/스카우터 인증 UI

파일: `src/components/coach/VerificationFlow.tsx`

```
프로필 > 설정 > 인증 요청 (또는 온보딩에서)

방법 1: 팀 코드 입력
  → coach_verifications INSERT (method: 'team_code')
  → 팀 admin에게 확인 요청 알림
  → admin 승인 시 profiles.is_verified = true

방법 2: 증빙 제출
  → 파일 업로드 (R2에 저장)
  → coach_verifications INSERT (method: 'document')
  → status: 'pending' (수동 검토)

방법 3: 기존 인증 코치 추천
  → 인증 코치의 @핸들 입력
  → 해당 코치에게 확인 요청 알림
  → 승인 시 즉시 인증

인증 완료 시:
  프로필에 ✅ 뱃지 표시
  미성년에게 DM 가능
```

---

## 확인 사항

- [ ] 차단하면 상대 콘텐츠/프로필이 숨겨짐
- [ ] 차단 해제 가능 (설정 > 차단 목록)
- [ ] 신고 바텀시트에서 카테고리 선택 후 신고
- [ ] 비팔로우 DM 시 DM 요청 전송됨
- [ ] 상대 DM 목록에 요청이 표시됨
- [ ] 수락/거절 동작
- [ ] 코치 인증 3가지 방법 동작
- [ ] 인증 완료 시 ✅ 뱃지
- [ ] 미인증 코치 → 미성년 DM 차단됨
