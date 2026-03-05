# DESIGN-SYSTEM.md — Section 9: v1.2 신규 컴포넌트 (기존 파일에 추가)

---

## 9.1 검색 오버레이

```
컨테이너: position fixed, inset 0, z-50, bg #0C0C0E
진입 애니메이션: translateY(100%) → translateY(0), 200ms ease-out
퇴장: 역방향

검색바: bg #161618, radius 12px, h 44px, px 16px
  placeholder: "선수, 팀, @핸들 검색" (#71717A)
  아이콘: 🔍 왼쪽 (#71717A)
  포커스 시: 골드 보더 1px #D4A853
```

## 9.2 알림 아이템

```
일반 알림: py 12px, px 16px, border-bottom 1px #1E1E22
  아이콘: 24px (👏👤💬🎉)
  텍스트: #FAFAFA 14px
  시간: #71717A 12px, 오른쪽 정렬
  읽음: opacity 0.6

MVP 알림: bg #1E1E22, border-left 3px #D4A853, radius 10px, m 8px
  텍스트: #D4A853 bold
```

## 9.3 DM 대화

```
대화 목록 아이템: h 72px, px 16px, border-bottom 1px #1E1E22
  아바타: 48px 원형
  이름: #FAFAFA 15px semibold
  미리보기: #A1A1AA 13px, 1줄 말줄임
  시간: #71717A 12px
  안읽음 ●: #D4A853 8px 원

채팅 버블 (상대): bg #1E1E22, radius 14px 14px 14px 4px, max-w 75%
채팅 버블 (나): bg rgba(212,168,67,0.15), border 1px rgba(212,168,67,0.3),
  radius 14px 14px 4px 14px, max-w 75%
시간: #71717A 11px
읽음 ✓✓: #D4A853 11px

클립 공유 카드: bg #161618, radius 10px, overflow hidden
  썸네일: aspect-ratio 16/9
  제목: #FAFAFA 13px
  선수명: #A1A1AA 12px

입력란: bg #161618, radius 24px, h 44px
  📎 아이콘: 24px #71717A
  전송 버튼: #D4A853
```

## 9.4 이모지 리액션 피커

```
컨테이너: bg #1E1E22, radius 24px, p 8px, shadow
  position absolute, bottom 100%, mb 8px
이모지: 32px 간격, 탭 영역 44px
선택 시: 확대 애니메이션 scale 1.3 → 1.0

리액션 표시 (카드): inline-flex gap 8px
  각 리액션: bg #1E1E22, radius 16px, px 8px h 28px
  이모지 16px + 카운트 12px #A1A1AA
  내가 누른 것: border 1px #D4A853
```

## 9.5 코치 리뷰 뱃지

```
영상 카드 오른쪽 상단: 📋 아이콘 + "코치 리뷰"
  bg rgba(212,168,67,0.1), border 1px rgba(212,168,67,0.3)
  radius 6px, px 8px h 24px, font 11px #D4A853

리뷰 상세: bg #161618, radius 10px, p 12px
  코치명: #FAFAFA 13px semibold + ✅
  평가: ⚽/🔥/💎 아이콘 + 라벨
  코멘트: #A1A1AA 13px
```

## 9.6 챌린지 배너

```
홈 피드 인라인 카드: bg #161618, border 1px #1E1E22
  radius 12px, p 16px
  🎯 아이콘 + "이번 주 챌린지" (#D4A853 14px bold)
  제목: #FAFAFA 16px bold
  참여수 + 남은 일: #A1A1AA 13px
  [참여하기 →]: #D4A853 13px, 오른쪽 정렬
```

## 9.7 퀘스트 체크리스트

```
카드: bg #161618, radius 12px, p 16px
  제목: "🎮 초보자 퀘스트" #FAFAFA 14px bold
  각 항목: py 8px, 체크박스 + 텍스트 + XP
    미완료: □ #71717A 13px
    완료: ✓ (#D4A853) + 취소선 + #71717A
  진행바: bg #1E1E22, fill #D4A853, h 4px, radius 2px
```

## 9.8 성장 타임라인

```
왼쪽 라인: 2px #1E1E22, 왼쪽 24px에서
점: 8px 원, bg #D4A853 (팀 이동/MVP), bg #A1A1AA (기타)
날짜: #71717A 12px
제목: #FAFAFA 14px
설명: #A1A1AA 13px
영상 썸네일: 60×45, radius 6px (있으면)
```

## 9.9 부모 대시보드

```
인사: #FAFAFA 18px, "👋 민준이 보호자님"
활동 카드: bg #161618, radius 12px, p 16px
  각 항목: icon + 라벨 (#A1A1AA 13px) + 값 (#FAFAFA 16px Oswald)
  구분선: 1px #1E1E22
CTA 버튼: ghost 스타일, border 1px #D4A853, #D4A853 text
```

## 9.10 공유 바텀시트

```
배경: bg #161618, radius-top 14px
핸들: 4px × 32px #71717A, 중앙, mt 8px
각 항목: h 52px, px 16px, icon 24px + 텍스트 15px #FAFAFA
  hover: bg #1E1E22
구분선: "── 최근 DM ──" #71717A 12px
아바타 행: 가로 스크롤, gap 16px
```
