# SPRINT-16b: FCM 웹 푸시 + 카카오 알림톡

> Phase B | 의존: SPRINT-16 완료
> 예상: 4~5시간

---

## 목표

FCM 웹 푸시 설정 + 푸시 토큰 관리 + 알림톡 2종 + 푸시 권한 요청 UX

---

## 작업

### 1. DB

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,  -- 'web'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, token)
);
```

### 2. FCM Service Worker

파일: `public/firebase-messaging-sw.js`

```javascript
// Firebase SDK 임포트
// onBackgroundMessage 핸들러
// 알림 표시 (title, body, icon, data.url)
// 알림 클릭 → data.url로 이동
```

파일: `src/lib/fcm.ts`

```typescript
export async function requestPushPermission(): Promise<string | null>;
export async function savePushToken(token: string): Promise<void>;
export async function removePushToken(token: string): Promise<void>;
```

### 3. 푸시 권한 요청 타이밍

첫 영상 업로드 완료 직후:
```
"🎬 영상이 업로드됐어요!
 다른 선수가 응원하면 알려드릴까요?"
 [네, 알려주세요]  [나중에]
```

[네] → requestPushPermission() → 토큰 저장
[나중에] → 다음 업로드 시 다시 물어봄 (최대 3회)

### 4. 푸시 발송 Edge Function

파일: `supabase/functions/send-push/index.ts`

```
트리거: notifications INSERT 후 호출
로직:
  1. 알림 타입 확인
  2. notification_preferences 확인 (해당 타입 ON?)
  3. quiet_hours 체크 (quiet_start~quiet_end 사이면 발송 안 함)
  4. push_tokens에서 is_active = true 토큰 가져오기
  5. FCM HTTP v1 API 호출
  6. 응답 실패 시 토큰 is_active = false

페이로드:
  {
    notification: { title, body },
    data: { url: action_url, type: notification_type },
    webpush: {
      notification: {
        icon: "/icons/footory-192.png",
        badge: "/icons/badge-72.png",
        tag: group_key  // 같은 tag는 덮어쓰기
      }
    }
  }
```

### 5. 카카오 알림톡 (2종만)

파일: `supabase/functions/send-alimtalk/index.ts`

```
알림톡 1: MVP 선정 (선수에게)
  트리거: weekly_mvp_results INSERT (rank = 1)
  템플릿: "축하합니다! 이번 주 FOOTORY MVP로 선정되었습니다 🏆
           지금 확인하기 → footory.app/mvp"

알림톡 2: 부모 주간 리캡
  트리거: 매주 월 09:00 (pg_cron)
  대상: role = 'parent'이고 parent_links가 있는 유저
  템플릿: "[{자녀이름}] 이번 주 활동
           영상 {n}개 · 응원 {n}개 · 조회 {n}회
           {MVP 선정 시: '🏆 이번 주 MVP!'}
           자세히 보기 → footory.app"
```

### 6. 스케줄러 (pg_cron)

```sql
-- 주간 리캡 알림톡 (매주 월 09:00 KST)
SELECT cron.schedule('weekly-recap', '0 0 * * 1', $$
  SELECT net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/weekly-recap',
    headers := '{"Authorization": "Bearer {anon_key}"}'::jsonb
  )
$$);
```

---

## 확인 사항

- [ ] 첫 영상 업로드 후 푸시 권한 요청 팝업
- [ ] 권한 수락 시 push_tokens에 토큰 저장
- [ ] 응원/댓글/팔로우 시 상대에게 푸시 알림 전송
- [ ] quiet_hours 시간에는 푸시 안 감
- [ ] MVP 선정 시 알림톡 발송 (mock 테스트)
- [ ] 부모 주간 리캡 알림톡 발송 (mock 테스트)
