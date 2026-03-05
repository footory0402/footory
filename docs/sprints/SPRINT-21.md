# SPRINT-21: 소셜 강화 (@멘션, 이모지 리액션, 대댓글, 공유)

> Phase B | 의존: SPRINT-16b 완료
> 예상: 4~5시간

---

## 목표

@멘션, 이모지 리액션 5종, 대댓글, 영상 공유 확장

---

## 작업

### 1. DB 변경

```sql
-- 대댓글
ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id);

-- 이모지 리액션
ALTER TABLE kudos ADD COLUMN reaction TEXT DEFAULT 'clap';
ALTER TABLE kudos DROP CONSTRAINT IF EXISTS kudos_unique;
ALTER TABLE kudos ADD CONSTRAINT kudos_unique UNIQUE(profile_id, clip_id, reaction);
```

### 2. @멘션 시스템

파일: `src/components/social/MentionInput.tsx`

```
댓글 입력 중 "@" 타이핑 → 자동완성 드롭다운
  대상: 팔로잉 선수 + 같은 팀 + 해당 영상 업로더
  드롭다운: 아바타 + 이름 + 포지션
  선택 시: @이름 삽입 (골드 컬러 #D4A853)

저장: 댓글 텍스트에 "@[handle]" 형식으로 저장
표시: "@handle" → 골드 컬러 텍스트, 탭하면 프로필 이동

멘션 알림:
  createNotification({
    type: 'mention',
    title: '${sender}님이 @멘션했어요',
    actionUrl: '/clip/${clipId}'
  })
```

### 3. 이모지 리액션 5종

파일: `src/components/social/ReactionPicker.tsx`
파일: `src/components/social/ReactionDisplay.tsx`

```
리액션 5종:
  👏 clap (응원)
  🔥 fire (불타오름)
  ⚽ goal (골)
  💪 strong (힘내)
  😮 wow (놀라움)

UX:
  기본 탭 = 👏 (기존과 동일)
  길게 누르기(500ms) → 리액션 피커 팝업
  피커: 5개 이모지 가로 배열, 배경 #1E1E22, radius 24px

카드 표시:
  👏 12  🔥 5  ⚽ 3
  0인 리액션은 숨김
```

### 4. 대댓글

파일: 기존 댓글 컴포넌트 수정

```
1단계만 (깊은 스레딩 X):
  comments.parent_id가 NULL → 루트 댓글
  comments.parent_id가 있으면 → 대댓글 (들여쓰기 왼쪽 24px)

루트 댓글에 "답글달기" 버튼 추가
대댓글 입력 시 parent_id 설정
대댓글은 더 작은 폰트 (13px vs 14px)
```

### 5. 공유 확장

파일: `src/components/social/ShareSheet.tsx`

```
피드 카드 ↗ 버튼 → 바텀시트:

  📱 DM으로 보내기     → DM 대화 선택 화면 (Sprint 19 후 연결)
  💬 카카오톡          → 기존 카카오 공유
  📷 인스타 스토리     → Web Share API (딥링크)
  🔗 링크 복사         → clipboard API

  ── 최근 DM ──
  (사진) 배준혁  (사진) 서현우  → 바로 전송

바텀시트 디자인:
  배경 #161618, radius-top 14px, 항목 높이 48px
```

---

## 확인 사항

- [ ] 댓글 입력 시 "@" 타이핑하면 자동완성 드롭다운
- [ ] 멘션된 텍스트가 골드 컬러로 표시
- [ ] 멘션 시 해당 사용자에게 알림
- [ ] 응원 버튼 길게 누르면 5개 리액션 피커
- [ ] 기본 탭은 👏 (기존 동작 유지)
- [ ] 카드에 리액션별 카운트 표시
- [ ] 대댓글 달기 가능, 들여쓰기 표시
- [ ] 공유 바텀시트에 4가지 옵션
- [ ] 링크 복사 동작
