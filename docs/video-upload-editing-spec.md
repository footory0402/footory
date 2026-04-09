# 영상 업로드 및 편집 사양

> Last synced: 2026-04-10

## 문서 목적
- Footory에서 만들 영상 업로드 및 편집 기능의 기준 사양을 고정한다.
- 이 문서는 하이라이트 중심 문서가 아니라 clip-first 업로드와 선택형 편집 기준을 정의한다.
- 현재 살아 있는 저장 계약과 재생 계약을 버리지 않고 제품 기준을 다시 맞춘다.

## 제품 원칙
- 기본 업로드 플로우는 짧은 영상 빠른 업로드다.
- 기본 소비 플로우는 업로드 후 바로 재생 가능이다.
- 영상 편집은 선수 프로필 강화 도구여야 한다.
- 하이라이트는 선택형 편집 기능이며 항상 강제되지 않는다.
- spotlight, zoom playback, profile card, lower third는 유지해야 하는 핵심 기능이다.
- 전문 편집기처럼 복잡하게 만들지 말 것.

## 사용자 목표
- 짧은 영상을 빠르게 올리고 바로 보여 주고 싶다.
- 필요할 때만 trim, spotlight, zoom, 선수 정보 오버레이, highlight range를 조정하고 싶다.

## 핵심 사용자
- 부모: 촬영한 짧은 영상을 빠르게 올려 자녀 프로필에 반영하고 싶다.
- 선수: 내 clip을 바로 보여 주고, 필요한 경우에만 대표 범위를 다듬고 싶다.
- 팀 운영자: 선수별 포트폴리오 자료를 빠르게 쌓고, 과한 편집 없이 재생 가능 상태로 만들고 싶다.

## 해결하려는 문제
- 축구 영상은 멀리서 찍히는 경우가 많아 주인공 식별이 어렵다.
- 일반 편집기는 기능이 너무 많아 모바일에서 빠르게 쓰기 어렵다.
- 모든 clip을 하이라이트 완성본으로 만들도록 강제하면 업로드 속도와 유지 비용이 커진다.

## Core Flow
1. 사용자가 짧은 영상을 선택한다.
2. 시스템이 원본 업로드와 메타데이터 준비를 진행한다.
3. 업로드가 끝나면 clip을 바로 재생할 수 있다.
4. 재생 시 spotlight, zoom playback, profile card, lower third가 핵심 정보 전달을 돕는다.
5. 사용자는 필요할 때만 편집 단계로 들어간다.

## 기본 업로드 플로우
- 단일 clip 업로드
- 허용 형식, 길이, 용량 제한 이해
- 업로드 진행 상태 노출
- 업로드 직후 메타데이터 추출과 썸네일 준비
- 실패 시 재시도 또는 복구 안내

## 기본 소비 플로우
- 업로드 후 바로 재생 가능
- `clips` 메타데이터 기반 런타임 재생
- spotlight와 zoom playback 적용 가능
- player profile card와 lower third 표시 가능
- 프로필 featured 후보 또는 clip 포트폴리오에서 즉시 소비 가능

## 선택 편집 플로우
- trim
- spotlight
- zoom playback 관련 설정
- player info overlay
- lower third 표시 제어
- highlight range

하이라이트는 항상 강제되지 않으며, 사용자는 편집을 생략하고 clip을 그대로 소비할 수 있어야 한다.

## MVP 범위
- 짧은 원본 영상 업로드
- 업로드 직후 메타데이터 추출과 미리보기 생성
- 업로드 후 바로 재생 가능한 clip 저장
- spotlight와 zoom playback이 가능한 재생 경험
- player info overlay와 lower third 유지
- 필요 시 trim과 highlight range를 조정할 수 있는 선택 편집
- 결과 저장 후 프로필 반영
- 실패 시 재시도와 중단 복구 안내

## MVP 비범위
- 모든 clip에 하이라이트를 강제하는 흐름
- 전문 편집기 수준 타임라인
- 멀티트랙 오디오 편집
- 장면별 고급 자막 애니메이션
- 복잡한 전환 효과와 필터 마켓
- 협업 편집
- 여러 원본 영상을 한 프로젝트에 섞는 기능
- 자유형 스티커, 도형, 드로잉, 키프레임 편집
- BGM 자동 비트싱크
- 서버 렌더 기반 export를 core flow로 복귀시키는 작업

## 편집 기능 우선순위

### Core Playback
- spotlight
- zoom playback
- profile card
- lower third
- 업로드 직후 재생 가능 상태

### Optional Editing
- trim 시작/종료 조정
- highlight range 시작/종료 조정
- 대표 범위 확인
- player info overlay 조정

### Phase 2
- 서버 렌더 export
- 별도 결과물 엔티티
- clip 다중 조합 편집

## UX 원칙
- 업로드 전보다 업로드 후 행동이 더 단순해야 한다.
- 사용자는 업로드 직후 바로 재생 결과를 이해할 수 있어야 한다.
- spotlight와 zoom은 숨겨진 고급 효과가 아니라 이해 가능한 핵심 재생 보조여야 한다.
- 하이라이트는 기본값이 아니라 선택값으로 제시한다.
- 한 화면에서 한 가지 판단만 요구할 것.
- 저장 전에도 미리보기는 충분히 제공하되, 편집 옵션은 제한할 것.

## 필요한 UI/UX 화면과 목적

### 1. 업로드 시작 화면
- 목적: 짧은 clip 선택과 제한 안내
- 포함 요소: 파일 선택, 허용 규격, 업로드 시작 CTA, 최근 작업 복구 진입

### 2. 업로드 처리 화면
- 목적: 업로드와 메타데이터 준비를 명확히 전달
- 포함 요소: 단계형 진행 상태, 예상 대기, 실패 시 재시도

### 3. 업로드 후 즉시 재생 화면
- 목적: clip을 바로 재생하고 core playback 기능을 확인하게 함
- 포함 요소: video preview, spotlight/zoom 적용 상태, profile card, lower third

### 4. 선택 편집 화면
- 목적: 필요한 경우에만 trim, spotlight, zoom, overlay, highlight range를 조정
- 포함 요소: 프리뷰, 시작/끝 조정, overlay 토글, highlight range 제어

### 5. 저장 확인 화면
- 목적: 프로필 반영 위치와 저장 결과를 확인
- 포함 요소: 미리보기, draft 저장 상태, featured 후보 저장 여부, 태그 연결, 실패 복구 안내

### 6. 최근 작업 복구 진입
- 목적: single clip draft 또는 reel highlight draft를 다시 열어 이어서 편집
- 포함 요소: 최근 draft 요약, 복구 CTA, publish 전 상태 안내

## 화면 설계 원칙
- 기본 재생과 선택 편집을 분리한다.
- 편집을 건너뛰어도 clip 소비가 완료되도록 설계한다.
- 하이라이트 설정을 시작하지 않았다고 저장을 막지 않는다.
- 오버레이 설정은 독립적으로 유지하되 옵션 수를 적게 유지한다.

## 데이터 모델 관점에서 필요한 편집 결과
- 원본 영상 식별자
- `trim_start`
- `trim_end`
- `highlight_start`
- `highlight_end`
- `duration_sec`
- `spotlight_x`
- `spotlight_y`
- `freeze_at`
- `effects.trackingMode`
- `effects.trackingPoints`
- player info overlay 설정
- 프로필 반영 대상 정보
- draft/project 식별자
- draft 상태와 published 상태 구분 값

## 프로필 반영 규칙
- 저장된 clip은 선수 프로필의 clip 목록 또는 featured 후보에 연결된다.
- 하이라이트 범위를 설정해도 기본 엔티티는 clip이다.
- 프로필에서는 clip 재생을 우선 보여 주고, highlight range는 선택형 정보로 소비한다.

## 현재 구현과의 관계
- 현재 저장소의 살아 있는 메인 계약은 `clips` 메타데이터 기반 클라이언트 재생이다.
- 본 문서는 그 구조를 버리고 새 렌더 파이프라인으로 갈아타는 문서가 아니다.
- `render-worker/`와 `/api/render/*`는 즉시 core로 복귀시키지 않고 phase 2 판단 대상으로 둔다.

## 이번 단계에서 만들지 않을 것
- 방송용 수준의 화려한 패키지 에디터
- 세밀한 색보정
- 장면별 자막 애니메이션 편집기
- 고급 오디오 믹서
- 컷마다 별도 효과 프리셋을 쌓는 기능
- 데스크톱 편집툴 같은 긴 타임라인과 다중 트랙 인터페이스

## 지금 먼저 필요한 화면 3개
- 업로드 시작 화면
- 업로드 처리 화면
- 업로드 후 즉시 재생 및 선택 편집 진입 화면

## 나중에 미룰 화면 3개
- 서버 렌더 export 화면
- 다중 clip 조합 하이라이트 화면
- 배경음악 선택 화면
