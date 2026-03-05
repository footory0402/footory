# ARCHITECTURE.md — v1.2 추가 사항 (기존 파일에 병합)

---

## v1.2 DB 스키마 변경

### 기존 테이블 변경

```sql
-- profiles 확장
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'player';
  -- 'player', 'parent', 'coach'
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN birth_year INTEGER;
ALTER TABLE profiles ADD COLUMN height_cm INTEGER;
ALTER TABLE profiles ADD COLUMN weight_kg INTEGER;
ALTER TABLE profiles ADD COLUMN preferred_foot TEXT;
  -- 'right', 'left', 'both'
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN profile_views INTEGER DEFAULT 0;

-- notifications 확장
ALTER TABLE notifications ADD COLUMN group_key TEXT;
ALTER TABLE notifications ADD COLUMN action_url TEXT;
ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- comments 확장 (대댓글)
ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id);

-- kudos 확장 (이모지 리액션)
ALTER TABLE kudos ADD COLUMN reaction TEXT DEFAULT 'clap';
  -- 'clap', 'fire', 'goal', 'strong', 'wow'
ALTER TABLE kudos DROP CONSTRAINT IF EXISTS kudos_unique;
ALTER TABLE kudos ADD CONSTRAINT kudos_unique
  UNIQUE(profile_id, clip_id, reaction);

-- parent_links 확장
ALTER TABLE parent_links ADD COLUMN consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_links ADD COLUMN consent_at TIMESTAMPTZ;

-- clips 확장 (부모 대신 업로드)
ALTER TABLE clips ADD COLUMN uploaded_by UUID REFERENCES profiles(id);
  -- NULL이면 본인 업로드, 값이 있으면 대신 업로드 (부모)

-- teams 확장 (팀 코드)
ALTER TABLE teams ADD COLUMN invite_code TEXT UNIQUE;
  -- 팀 생성 시 자동 생성, 예: "SUWON-2026"
```

### 신규 테이블 (13개)

```sql
-- 1. DM 대화방
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

-- 2. DM 메시지
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

-- 3. DM 요청
CREATE TABLE dm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  preview_message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 4. 차단
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 5. 신고
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id),
  comment_id UUID REFERENCES comments(id),
  clip_id UUID REFERENCES clips(id),
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 푸시 토큰
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, token)
);

-- 7. 알림 설정
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

-- 8. 코치 인증 요청
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

-- 9. 수상/성과
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  competition TEXT,
  year INTEGER,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 코치 태그/평가
CREATE TABLE coach_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
  comment TEXT,
  private_note TEXT,
  rating TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, clip_id)
);

-- 11. 스카우터 관심 선수
CREATE TABLE scout_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scout_id, player_id)
);

-- 12. 챌린지
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  skill_tag TEXT,
  week_start DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 퀘스트 진행
CREATE TABLE quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, quest_key)
);

-- 14. 성장 타임라인
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  clip_id UUID REFERENCES clips(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_timeline_profile ON timeline_events(profile_id, created_at DESC);
```

### Supabase Realtime 구독

```
DM 실시간:
  채널: conversation:{conversation_id}
  이벤트: messages INSERT

알림 실시간:
  채널: notifications:{profile_id}
  이벤트: notifications INSERT

읽음 표시:
  채널: conversation:{conversation_id}
  이벤트: messages UPDATE (is_read)
```

### RLS (Row Level Security) 정책

```sql
-- messages: 대화 참여자만 읽기/쓰기
CREATE POLICY messages_select ON messages FOR SELECT
  USING (sender_id = auth.uid() OR conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  ));

-- blocks: 본인 차단 목록만
CREATE POLICY blocks_select ON blocks FOR SELECT
  USING (blocker_id = auth.uid());

-- scout_watchlist: 본인 리스트만
CREATE POLICY watchlist_select ON scout_watchlist FOR SELECT
  USING (scout_id = auth.uid());

-- coach_reviews: private_note는 코치+선수만
-- (private_note 필드는 API에서 필터링)

-- notification_preferences: 본인만
CREATE POLICY notif_prefs ON notification_preferences FOR ALL
  USING (profile_id = auth.uid());
```

### Edge Functions (신규)

```
supabase/functions/
├── send-push/index.ts          # FCM 푸시 발송
├── send-alimtalk/index.ts      # 카카오 알림톡
├── weekly-recap/index.ts       # 주간 리캡 생성 (cron)
├── mvp-result-notify/index.ts  # MVP 결과 알림 (cron)
├── generate-profile-pdf/index.ts  # PDF 생성
├── generate-og-image/index.ts     # OG 이미지 생성
└── update-timeline/index.ts       # 타임라인 이벤트 생성
```

### v1.2 프로젝트 구조 추가

```
src/
├── app/
│   ├── dm/
│   │   ├── page.tsx              # DM 대화 목록
│   │   └── [conversationId]/page.tsx  # 대화 화면
│   ├── notifications/page.tsx     # 알림 센터
│   └── profile/
│       └── export/page.tsx        # PDF 내보내기
├── components/
│   ├── dm/                        # DM 관련
│   │   ├── ConversationList.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── DmRequestCard.tsx
│   │   └── ClipShareCard.tsx
│   ├── notifications/             # 알림 관련
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationItem.tsx
│   │   └── NotificationSettings.tsx
│   ├── search/                    # 검색+탐색 오버레이
│   │   └── SearchOverlay.tsx
│   ├── challenge/                 # 챌린지
│   │   ├── ChallengeBanner.tsx
│   │   └── ChallengeRanking.tsx
│   ├── quest/                     # 퀘스트
│   │   └── QuestChecklist.tsx
│   ├── portfolio/                 # 포트폴리오
│   │   ├── AchievementList.tsx
│   │   ├── GrowthTimeline.tsx
│   │   └── ProfilePdfExport.tsx
│   ├── coach/                     # 코치 도구
│   │   ├── CoachReviewBadge.tsx
│   │   └── CoachReviewForm.tsx
│   ├── scout/                     # 스카우터 도구
│   │   └── WatchlistPanel.tsx
│   ├── parent/                    # 부모 전용
│   │   ├── ChildDashboard.tsx
│   │   ├── ProxyUpload.tsx
│   │   └── ParentBottomTab.tsx
│   └── onboarding/               # 온보딩
│       ├── RoleSelect.tsx
│       ├── PlayerOnboarding.tsx
│       ├── ParentOnboarding.tsx
│       └── CoachOnboarding.tsx
├── lib/
│   ├── dm.ts                     # DM 유틸
│   ├── notifications.ts          # 알림 유틸
│   ├── permissions.ts            # 역할별 권한 체크
│   ├── challenges.ts             # 챌린지 유틸
│   ├── quests.ts                 # 퀘스트 유틸
│   └── pdf-generator.ts          # PDF 생성
└── hooks/
    ├── useRealtimeMessages.ts     # DM Realtime 훅
    ├── useRealtimeNotifications.ts
    └── usePermissions.ts          # 역할 권한 훅
```
