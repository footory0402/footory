# SPRINT-16: 알림 센터

> Phase B | 의존: SPRINT-11b-v2 완료
> 예상: 3~4시간

---

## 목표

알림 센터 UI + 알림 읽음 처리 + 뱃지 카운트 + 알림 설정

---

## 작업

### 1. DB 변경

```sql
ALTER TABLE notifications ADD COLUMN group_key TEXT;
ALTER TABLE notifications ADD COLUMN action_url TEXT;
ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

CREATE TABLE notification_preferences (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  kudos BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  follows BOOLEAN DEFAULT TRUE,
  dm BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  vote_open BOOLEAN DEFAULT TRUE,
  vote_remind BOOLEAN DEFAULT TRUE,
  mvp_result BOOLEAN DEFAULT TRUE,
  team_invite BOOLEAN DEFAULT TRUE,
  weekly_recap BOOLEAN DEFAULT TRUE,
  upload_nudge BOOLEAN DEFAULT FALSE,
  quiet_start TIME DEFAULT '22:00',
  quiet_end TIME DEFAULT '08:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 알림 센터 화면

파일: `src/app/notifications/page.tsx`
파일: `src/components/notifications/NotificationCenter.tsx`
파일: `src/components/notifications/NotificationItem.tsx`

```
화면 구성:
  ← 알림                    ⚙️

  (단순 시간순 리스트, 스크롤)

  🏆 카드 스타일 (MVP 알림만 골드 배경 #1E1E22 + 골드 보더)
  👏 배준혁 외 3명이 응원              4시간
  👤 김민준님이 팔로우                  5시간
  💬 서현우: "돌파 미쳤다"              어제
  🎉 Lv.3 달성!                        3일 전

그룹핑:
  같은 group_key("kudos:clip_{id}")인 알림을 묶어 "외 N명" 표시
  나머지는 개별 표시

탭 동작:
  각 알림 탭 → action_url로 router.push
  예: "/mvp", "/profile/handle", "/dm/conv_id"

읽음 처리:
  알림 센터 진입 시 → 모든 알림 is_read = true
  이미 읽은 알림은 투명도 낮게 (opacity 0.7)
```

### 3. 🔔 뱃지 카운트

파일: `src/components/layout/AppHeader.tsx` 수정

```
미읽은 알림 수 = notifications WHERE is_read = false AND profile_id = 본인
빨간 원 뱃지 표시 (min-width 16px, font 10px, 최대 99+)
0이면 뱃지 숨김
```

Realtime 구독 (선택):
```
supabase.channel('notifications:{profile_id}')
  .on('postgres_changes', { event: 'INSERT', table: 'notifications' })
  → 뱃지 카운트 +1
```

### 4. 알림 설정

파일: `src/components/notifications/NotificationSettings.tsx`

```
사용자에게 보이는 것:
  🔔 알림 ON/OFF (마스터 토글)
  🌙 조용한 시간  22:00 ~ 08:00

⚙️ 아이콘 탭 → 이 설정 화면

고급 설정 (프로필 > 설정 > 알림 상세에 숨김):
  카테고리별 ON/OFF 토글 (notification_preferences 테이블 기반)
```

### 5. 알림 생성 유틸

파일: `src/lib/notifications.ts`

```typescript
export async function createNotification(params: {
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string;
  groupKey?: string;
  senderId?: string;
}) {
  // 1. notification_preferences 확인
  // 2. notifications 테이블 INSERT
  // 3. (Sprint 16b에서) 푸시 발송 호출
}
```

기존 응원/댓글/팔로우/MVP 로직에서 이 함수를 호출하도록 연결.

---

## 확인 사항

- [ ] /notifications 화면이 열리고 알림 리스트가 표시됨
- [ ] 같은 영상 응원이 "외 N명"으로 그룹핑됨
- [ ] MVP 알림만 골드 카드 스타일
- [ ] 알림 탭하면 해당 화면으로 이동
- [ ] 진입 시 읽음 처리, 🔔 뱃지 카운트 리셋
- [ ] 알림 설정에서 ON/OFF + 조용한 시간 조절 가능
- [ ] 디자인 토큰 적용
