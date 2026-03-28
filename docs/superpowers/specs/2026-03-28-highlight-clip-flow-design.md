# 하이라이트 클립 플로우 재설계

> 경기 풀영상에서 원하는 구간을 잘라 하이라이트 릴로 합치고, 각 클립에 EA FC 스타일 선수 마커를 찍어 업로드하는 end-to-end 플로우.

## 문제 정의

현재 `/editor/video` 페이지는 장면 마킹까지만 가능하고, 마킹 후 다음 단계(업로드)가 없는 막다른 길이다.

### 현재 플로우 (끊어짐)
```
/upload → "경기 영상으로 하이라이트 만들기" → /editor/video → 장면 마킹 → ???
```

### 구체적 문제 3가지
1. 마킹 후 "완료" / "다음" / "업로드" 버튼이 없음
2. 마킹한 클립 세그먼트를 실제로 잘라서 합치는 로직 미존재
3. `/upload` 페이지의 가이드("영상 선택 → 장면 마킹 → 완성!")와 실제 기능 불일치

## 설계 결정 (합의 사항)

| 항목 | 결정 | 이유 |
|------|------|------|
| 클립 처리 방식 | 마킹한 장면들을 하나의 하이라이트 릴로 concat | 개별 클립보다 "이번 경기 하이라이트" 릴 1개가 사용자 목적에 부합 |
| 영상 합성 위치 | 클라이언트 ffmpeg.wasm | 서버 비용 없음, 이미 프로젝트에 설치됨. 서버는 나중에 이관 |
| 합성 방식 | `-c copy` trim + concat demuxer | 재인코딩 없이 스트림 복사. 10 세그먼트도 90ms (테스트 완료) |
| 화면 전환 | `/editor/video` 안에서 상태 전환 (URL 변경 없음) | 마킹 데이터가 이미 state에 있어 전달 불필요 |
| 영상 구조 (MVP) | 마킹 장면만 concat (인트로/HUD/아웃트로 없음) | 클라이언트에서 인트로 합성은 무거움. 서버 준비 후 추가 |
| 선수 마커 | EA FC 다이아몬드 스타일, 각 클립별로 개별 지정 | 선수 위치가 클립마다 다르므로 자동 적용 불가 |
| 파일 크기 제한 | 300MB | WASM 메모리 안전선 |

## 성능 테스트 결과

test_test_player.mp4 (30MB, 76초, 1920x1080 HEVC+AAC) 기준, Chromium 브라우저 실측:

| 세그먼트 | Trim | Concat | 합계 | 출력 |
|----------|------|--------|------|------|
| 3개 | 44ms | 20ms | **65ms** | 7.5MB |
| 5개 | 22ms | 26ms | **49ms** | 12.8MB |
| 10개 | 41ms | 49ms | **90ms** | 25.3MB |

- FFmpeg 로딩: ~2.5초 (1회, 캐시 후 재사용)
- 모바일 예상: 처리 시간 x3~5배 → 여전히 1초 미만
- 병목: FFmpeg 최초 로딩 → 영상 재생 중 백그라운드 프리로딩으로 해결
- 오디오: `-c copy`가 비디오+오디오 모두 복사하므로 별도 처리 불필요
- Keyframe 정밀도: 6초 요청 → 6.1초 결과 (0.1초 오차, 하이라이트 용도 충분)

## 페이지 상태 머신

`/editor/video` 페이지 내 5개 상태를 전환한다. URL 변경 없음.

```
"onboarding" → (파일 선택) → "marking"
"marking"    → (헤더 "다음" 클릭) → "confirm"
"confirm"    → (← 뒤로) → "marking"
"confirm"    → ("하이라이트 생성" 클릭) → "processing"
"processing" → (합성+업로드 완료) → "done"
"done"       → ("프로필에서 보기") → /profile 이동
"done"       → ("한 번 더 만들기") → "onboarding" 리셋
```

## 각 상태별 UI 명세

### 1. onboarding (기존 + 개선)

- **스텝 인디케이터**: 3도트 바 (1/3 활성)
- **메인 CTA**: "영상 선택하기" 버튼
- **파일 제한 표시**: "MP4, MOV · 최대 300MB"
- **3단계 미리보기**: ▶ 영상 재생 → ⚡ 구간 선택 → ✨ 하이라이트 완성
- **변경점**: 파일 크기 제한 100MB → 300MB, "좋은 장면" → "원하는 구간" 워딩 변경

### 2. marking (기존 + "다음" 버튼 추가)

기존 영상 플레이어 + "이 장면!" + 타임라인 그대로 유지. 추가/변경사항:

**헤더 우측에 "다음 →" 버튼 추가:**
- 클립 0개: 비활성 (opacity 0.25)
- 클립 1~2개: 테두리만 (골드 아웃라인)
- 클립 3개 이상: 골드 채움 (강조)

**적응형 가이드 오버레이 (영상 하단):**
- 클립 0개: `"Step 1/2 · 영상을 재생하면서 원하는 구간에서 ⚡ 이 장면! 을 눌러주세요"`
- 첫 마킹 성공: `"✓ 구간 추가 완료! 더 추가하거나 우측 상단 다음 → 을 눌러주세요"`
- 클립 3개 이상: 가이드 사라짐

**워딩 변경:**
- ~~"좋은 장면에서"~~ → "원하는 구간에서"
- ~~"장면 추가됨!"~~ → "구간 추가 완료!"
- 헤더 클립 카운터: ~~"N개 장면"~~ → "N개 구간"

### 3. confirm (NEW — 확인 화면)

마킹 상태에서 "다음" 클릭 시 전환.

**레이아웃:**
- 헤더: "← 구간 수정하기" + "Step 2/2"
- 스텝 인디케이터: 2/3 활성
- 타이틀: "하이라이트 확인" + "아래 구간들이 순서대로 합쳐집니다"

**클립 리스트:**
각 클립을 카드로 표시. 카드 구성:
- 좌측: ☰ 드래그 핸들 (순서 변경용)
- 썸네일: 해당 클립의 대표 프레임 (markedAt 시점) — **탭하면 EA FC 다이아몬드 마커 배치**
- 이벤트 이모지 + 라벨 (⚽ 골, 💨 드리블 등)
- 시간: `MM:SS → MM:SS · N초`
- 우측: ✕ 삭제 버튼

**선수 마커 (EA FC 다이아몬드):**
- 각 클립 썸네일을 탭하면 해당 위치에 마커 생성
- 마커 디자인: 골드 다이아몬드(45도 회전 정사각형) + 수직선 + 이름표(선수명 #등번호)
- 선수 이름/등번호: `/api/player-card`에서 가져온 프로필 데이터 자동 채움
- 다시 탭하면 위치 변경 (새 위치로 이동)
- 마커가 있는 상태에서 마커 자체를 탭하면 제거
- 선택사항 (마커 안 찍어도 업로드 가능)

**요약 영역:**
- N개 구간 · 총 N초
- 힌트: "☰ 드래그로 순서 변경 · 썸네일 탭으로 선수 표시 · ✕ 삭제"

**CTA:**
- "🎬 하이라이트 생성하기" 버튼 (골드→레드 그라디언트)

### 4. processing (NEW — 합성 중)

"하이라이트 생성하기" 클릭 시 전환. 전체 화면.

**UI:**
- 원형 프로그레스 (퍼센트 표시)
- 타이틀: "구간을 합치고 있어요"
- 서브: "잠깐만 기다려주세요..."
- 체크리스트 (단계별 진행):
  - ✓ 영상 준비 (FFmpeg 로딩 — 프리로딩 완료 시 즉시 체크)
  - ✓ 구간 자르기 (N/N)
  - ● 하나로 합치는 중...
  - ○ 업로드

**기술 처리 순서:**
1. FFmpeg가 프리로딩 안 됐으면 여기서 로딩 (이미 됐으면 스킵)
2. 원본 파일을 WASM 파일시스템에 쓰기
3. 각 클립 세그먼트를 `-ss` + `-t` + `-c copy`로 trim
4. `concat demuxer` + `-c copy`로 합치기
5. 결과 MP4를 R2에 presigned URL로 업로드
6. `/api/clips` POST로 DB 레코드 생성 (클립 메타 + 마커 좌표 포함)

**에러 처리:**
- 실패 시: "다시 시도" 버튼 표시
- FFmpeg 로딩 실패 시: "브라우저에서 영상 처리를 지원하지 않습니다" 메시지

### 5. done (NEW — 완료)

합성+업로드 성공 시 전환.

**UI:**
- 스텝 인디케이터: 3/3 완료 (전부 그린)
- 체크마크 애니메이션 (scale-up)
- 타이틀: "하이라이트 완성!"
- 요약: "N개 구간 · N초"
- 서브: "프로필에서 확인할 수 있어요"
- 메인 CTA: "프로필에서 보기" → `/profile` 이동
- 보조: "한 번 더 만들기" → onboarding 리셋

## EA FC 다이아몬드 마커 컴포넌트

### 디자인 스펙
```
       ◆ (20x20, #D4A853, rotate 45deg, box-shadow glow)
       │ (2px width, 24px height, linear-gradient to transparent)
  ┌─────────────┐
  │ ● 김민수 #10 │ (bg: rgba(0,0,0,0.7), border: gold 0.4, 이름+등번호)
  └─────────────┘
```

### 데이터 구조
```typescript
interface ClipSegment {
  id: string;
  startTime: number;
  endTime: number;
  eventTag: EventTag;
  markedAt: number;
  // NEW
  markerX?: number;  // 0~1 normalized (탭 위치 X)
  markerY?: number;  // 0~1 normalized (탭 위치 Y)
}
```

### 동작
- 확인 화면에서 클립 썸네일 탭 → 탭 좌표를 `markerX`, `markerY`에 저장
- 다시 탭 → 위치 갱신
- 마커 없이도 업로드 가능 (선택사항)
- 프로필 데이터(이름, 등번호)는 `/api/player-card`에서 로드

## FFmpeg 프리로딩 전략

```
사용자가 영상을 선택하고 마킹을 시작하는 시점에 FFmpeg를 백그라운드로 로딩한다.
marking 상태 진입 시 즉시 시작. confirm/processing 도달 시 이미 로딩 완료 상태.
```

```typescript
// marking 상태 진입 시
useEffect(() => {
  if (phase === "marking" && !ffmpegRef.current) {
    const ffmpeg = new FFmpeg();
    ffmpeg.load().then(() => { ffmpegRef.current = ffmpeg; });
  }
}, [phase]);
```

## 기존 코드 영향 범위

### 수정하는 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/app/editor/video/page.tsx` | phase 상태 머신 추가, "다음" 버튼, confirm/processing/done 뷰 |
| `src/components/editor/video/types.ts` | ClipSegment에 markerX, markerY 추가 |
| `src/app/upload/page.tsx` | 가이드 워딩 변경 ("좋은 장면" → "원하는 구간"), 파일 제한 300MB |

### 새로 만드는 파일
| 파일 | 용도 |
|------|------|
| `src/components/editor/video/ConfirmView.tsx` | 확인 화면 (클립 리스트 + 마커 + CTA) |
| `src/components/editor/video/ProcessingView.tsx` | 합성 프로그레스 오버레이 |
| `src/components/editor/video/DoneView.tsx` | 완료 화면 |
| `src/components/editor/video/PlayerMarker.tsx` | EA FC 다이아몬드 마커 컴포넌트 |
| `src/components/editor/video/ClipThumbnail.tsx` | 클립 대표 프레임 캡처 + 마커 탭 영역 |
| `src/lib/highlight-concat.ts` | ffmpeg.wasm trim + concat + R2 업로드 로직 |

### 건드리지 않는 것
- 기존 마킹 UI (VideoPlayer, ClipTimeline, "이 장면!" 버튼)
- 기존 짧은 영상 업로드 플로우 (VideoSelector, SpotlightPicker)
- 기존 API 엔드포인트 (`/api/clips`, `/api/upload/presign`)
- 기존 HUD 시스템, 인트로 합성, 카드 에디터

## 제약사항

- 인트로/HUD 오버레이/아웃트로는 이 스펙에 포함하지 않음 (서버 렌더 준비 후 별도 구현)
- 마커는 정적 위치 (영상 재생 중 고정, 선수 트래킹 아님)
- 드래그 순서 변경은 터치 드래그 기반 (라이브러리 없이 구현 또는 경량 라이브러리 사용)
- SharedArrayBuffer 없이 동작 (싱글 스레드 ffmpeg.wasm)
