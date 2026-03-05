# SPRINT-19: DM 1:1 메시징

> Phase C | 의존: SPRINT-21 완료
> 예상: 5~6시간

---

## 목표

1:1 DM 대화 목록 + 대화 화면 + Supabase Realtime + 클립 공유 + 읽음 표시

---

## 작업

### 1. DB

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);
CREATE INDEX idx_conv_p1 ON conversations(participant_1);
CREATE INDEX idx_conv_p2 ON conversations(participant_2);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  shared_clip_id UUID REFERENCES clips(id),
  is_read BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_msg_conv ON messages(conversation_id, created_at DESC);
```

RLS:
```sql
-- 대화 참여자만 대화 조회
CREATE POLICY conv_select ON conversations FOR SELECT
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- 대화 참여자만 메시지 조회/추가
CREATE POLICY msg_select ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  ));
```

### 2. 대화 목록 화면

파일: `src/app/dm/page.tsx`
파일: `src/components/dm/ConversationList.tsx`

```
┌─────────────────────────────────┐
│ 메시지                     ✏️    │
├─────────────────────────────────┤
│ 🔍 대화 검색...                 │
│                                 │
│ (사진) 배준혁         ●  2분 전  │
│ "오늘 경기 잘했어!"              │
│                                 │
│ (사진) 코치 박진우     1시간 전  │
│ "내일 훈련 시간 변경"            │
│                                 │
│ (사진) 서현우            어제    │
│ "ㅋㅋ 그 영상 봤어"             │
└─────────────────────────────────┘

정렬: last_message_at DESC
● 표시: 해당 대화에 is_read = false인 메시지가 있으면
✏️: 새 대화 시작 (팔로잉 목록에서 선택)
```

### 3. 대화 화면

파일: `src/app/dm/[conversationId]/page.tsx`
파일: `src/components/dm/ChatBubble.tsx`
파일: `src/components/dm/MessageInput.tsx`
파일: `src/components/dm/ClipShareCard.tsx`

```
헤더: ← (사진) 배준혁  FW · 부산IP    ⋮

메시지 레이아웃:
  상대 메시지: 왼쪽 정렬, 배경 #1E1E22, radius 14px
  내 메시지: 오른쪽 정렬, 배경 골드 그라데이션 (rgba), radius 14px
  시간: 각 메시지 아래 작은 글씨 #71717A
  읽음: 내 메시지 아래 ✓✓ (is_read = true일 때)

클립 공유 카드:
  영상 썸네일 + 제목 + 선수명 + 탭하면 영상 재생

입력란:
  📎 (첨부) | 메시지 입력...  [전송]
  📎 탭 → [내 하이라이트에서 선택] 바텀시트
```

### 4. Supabase Realtime

파일: `src/hooks/useRealtimeMessages.ts`

```typescript
export function useRealtimeMessages(conversationId: string) {
  // supabase.channel(`conversation:${conversationId}`)
  //   .on('postgres_changes', { event: 'INSERT', table: 'messages',
  //        filter: `conversation_id=eq.${conversationId}` })
  //   → 새 메시지 추가 (낙관적 업데이트)
  //
  //   .on('postgres_changes', { event: 'UPDATE', table: 'messages' })
  //   → 읽음 표시 업데이트 (✓✓)
}
```

### 5. 대화 시작 / 메시지 전송 로직

파일: `src/lib/dm.ts`

```typescript
// 대화 시작 (또는 기존 대화 찾기)
export async function getOrCreateConversation(userId: string, targetId: string): Promise<string>;

// 메시지 전송
export async function sendMessage(conversationId: string, content: string, clipId?: string): Promise<void>;
// → messages INSERT
// → conversations.last_message_at, last_message_preview 업데이트
// → 상대에게 알림 (createNotification type: 'dm')
// → 상대에게 푸시

// 읽음 처리
export async function markAsRead(conversationId: string): Promise<void>;
// → 해당 대화의 상대 메시지 is_read = true

// 메시지 삭제 (소프트)
export async function deleteMessage(messageId: string): Promise<void>;
// → deleted_at = NOW()
```

### 6. DM 진입점

프로필 페이지에 [메시지] 버튼 추가 (팔로잉 상태 또는 같은 팀일 때):
```
[팔로우] [메시지]  또는  [팔로잉 ✓] [메시지]
```

탭 → getOrCreateConversation() → /dm/{conversationId}로 이동

### 7. 💬 탭 뱃지

BottomTab의 💬 DM 탭에 미읽은 대화 수 뱃지 표시:
```
미읽은 대화 수 = conversations WHERE 본인 참여 AND 
  최신 메시지가 상대방이 보낸 AND is_read = false인 대화 수
```

---

## 확인 사항

- [ ] /dm에서 대화 목록 표시 (최신순)
- [ ] 새 대화 시작 가능 (✏️ → 팔로잉 목록 선택)
- [ ] 대화 화면에서 텍스트 메시지 주고받기
- [ ] 실시간으로 상대 메시지 수신 (Realtime)
- [ ] 읽음 표시 ✓✓ 동작
- [ ] 영상 클립 공유 가능
- [ ] 프로필에서 [메시지] 버튼 → 대화 화면
- [ ] 💬 탭 뱃지 카운트
- [ ] 메시지 삭제 (소프트)
