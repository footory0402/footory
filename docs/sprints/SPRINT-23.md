# SPRINT-23: 커리어 포트폴리오

> Phase D | 의존: SPRINT-20 완료
> 예상: 5~6시간

---

## 목표

수상/성과 섹션 + 성장 타임라인 + 프로필 PDF 내보내기 + 공개 프로필 OG 이미지 + 프로필 확장 필드

---

## 작업

### 1. DB

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  competition TEXT,
  year INTEGER,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

### 2. 수상/성과 UI

파일: `src/components/portfolio/AchievementList.tsx`

프로필 > 기록 탭에 추가:
```
🏅 수상/성과                    [+ 추가]

2026 수도권 1부 리그 · 득점왕
2025 서울 리그 · 수비 MVP

[+ 추가] 바텀시트:
  대회명: _______________
  수상/성과: [득점왕] [MVP] [최우수수비] [직접 입력]
  연도: [2024] [2025] [2026]
  증빙 사진 (선택): [사진 업로드]
  [저장]
```

### 3. 성장 타임라인

파일: `src/components/portfolio/GrowthTimeline.tsx`

프로필 > 기록 탭 또는 별도 [내 성장] 버튼:
```
자동 생성 이벤트 (timeline_events에 INSERT 트리거):
  first_upload → 영상 업로드 첫 번째일 때
  level_up → 레벨 변경 시
  mvp_win → weekly_mvp_results rank=1 시
  team_join → team_members INSERT 시
  team_leave → team_members role='alumni' 시
  achievement → achievements INSERT 시
  follower_milestone → 팔로워 10/50/100/500 도달 시
  kudos_milestone → 총 응원 50/100/500 도달 시

UI:
  세로 타임라인 (왼쪽 라인 + 점)
  각 이벤트: 날짜 + 제목 + 관련 영상(있으면)
  최신이 위, 과거가 아래
```

파일: `src/lib/timeline.ts` — 트리거 함수들

### 4. 프로필 PDF 내보내기

파일: `src/components/portfolio/ProfilePdfExport.tsx`
파일: `src/lib/pdf-generator.ts`

```
프로필 > ⋮ > [프로필 내보내기 (PDF)]

옵션 체크박스:
  ☑ 기본 정보 (사진, 이름, 포지션, 신체)
  ☑ 시즌 히스토리
  ☑ 스탯 (경기/골/어시)
  ☑ 대표 영상 QR코드 (3개)
  ☑ 스킬 태그
  ☑ MVP 기록
  ☑ 수상/성과
  □ 코치 평가

[PDF 생성] → 로딩 → [공유/저장]

PDF 생성:
  방법 1: 클라이언트 (html2canvas + jsPDF)
  방법 2: Edge Function (Puppeteer/Playwright)
  → 방법 1 우선 시도, 품질 부족 시 방법 2

PDF 디자인:
  A4 1페이지, 다크 배경 #0C0C0E
  FOOTORY 로고 (상단)
  선수 사진 + 기본 정보
  QR코드 (featured 영상 3개 링크)
  시즌 히스토리 테이블
  스킬 태그 바 차트
  MVP + 수상 리스트
  하단: footory.app/p/{handle} + 날짜
```

### 5. 공개 프로필 OG 이미지

파일: `src/app/p/[handle]/page.tsx` 수정
파일: `src/app/p/[handle]/opengraph-image.tsx` (Next.js OG 이미지)

```
OG 이미지 (1200×630):
  EA FC 카드 스타일
  선수 사진 + 이름 + 포지션 + 팀
  MVP 횟수 + 레벨
  배경: 다크 + 골드 그라데이션
  FOOTORY 로고

카톡 공유 시:
  이 OG 이미지가 미리보기로 표시됨
  → "이거 뭐야?" → Footory 인지 → 유입
```

### 6. 프로필 확장 필드

프로필 편집 화면에 추가:
```
기본 정보:
  키: ___cm
  몸무게: ___kg
  선호 발: [오른발] [왼발] [양발]
  한 줄 소개: _______________

프로필 카드에 표시:
  김민준 · FW · 수원FC U-15
  172cm · 62kg · 오른발
```

### 7. 프로필 조회수

```
프로필 방문 시 profile_views +1 (본인 제외)
프로필에 "이번 주 조회 N회" 표시

알림 (주 1회): "👀 이번 주 N명이 프로필을 봤어요"
→ 프로필 꾸미기 + 영상 업로드 동기 부여
```

---

## 확인 사항

- [ ] 수상/성과 추가/수정/삭제
- [ ] 성장 타임라인 자동 생성 (영상 업로드, 레벨업, MVP 등)
- [ ] PDF 생성 및 공유/저장
- [ ] PDF에 QR코드로 영상 링크 포함
- [ ] 공개 프로필 OG 이미지 (EA FC 카드 스타일)
- [ ] 카톡 공유 시 OG 미리보기
- [ ] 키/몸무게/선호발/한줄소개 입력 및 표시
- [ ] 프로필 조회수 카운트 및 표시
