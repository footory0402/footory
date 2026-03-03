# Sprint 09: 피드 시스템

> 예상 소요: 1~2일
> 선행: Sprint 05 완료
> 병렬 가능: Sprint 06~08과 병렬 가능 (피드 UI만 먼저)

## 작업 목록

### Day 1: 피드 UI
- [ ] `src/components/feed/FeedCard.tsx`
  - 6종 타입: highlight / featured_change / medal / stat / season / top_clip
  - 헤더: 아바타 + 이름 + "›" + 레벨 + 팀 + 시간
  - 본문: 타입별 렌더링
  - 푸터: 👏 응원 / 💬 댓글 / ↗ 공유
- [ ] `src/components/feed/FeedList.tsx`
  - 무한 스크롤 (cursor 기반 페이지네이션)
  - 빈 피드 상태 ("선수를 팔로우하면 업데이트가 여기에!")

### Day 2: 피드 자동 생성
- [ ] 행동 → 피드 카드 자동 생성 로직
  - 영상 업로드 → highlight 카드
  - Featured 변경 → featured_change 카드
  - 메달 획득 → medal 카드
  - 기록 등록 → stat 카드
  - 시즌 추가 → season 카드
  - Top Clip 지정 → top_clip 카드
- [ ] Supabase DB Trigger 또는 Edge Function
- [ ] 홈 피드: 팔로잉 유저의 feed_items 시간순 조회

## 완료 기준
- [ ] 6종 피드 카드가 각각 올바르게 렌더링
- [ ] 행동 시 피드 자동 생성
- [ ] 무한 스크롤 동작
- [ ] 빈 상태 UI 표시

---
