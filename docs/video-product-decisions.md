# 영상 제품 결정사항

> Last synced: 2026-04-10
> 이 문서는 Footory 영상 제품의 현재 기준 결정을 잠그는 문서다. Prompt C 이전의 제품 판단, 문서 갱신, 구현 우선순위는 이 문서를 기준으로 맞춘다.

## 문서 목적
- 영상 기능의 기본 단위를 clip-first로 다시 고정한다.
- core flow, optional editing, phase 2를 분리해 범위 확장을 막는다.
- 기존 살아 있는 업로드/재생 아키텍처를 유지한 채 제품 기준을 다시 맞춘다.

## 잠긴 핵심 결정 7개

### 1. 기본 영상 단위는 Clip
- Footory의 기본 영상 단위는 하이라이트 완성본이 아니라 clip이다.
- 사용자는 짧은 영상을 빠르게 올리고, 올린 clip을 바로 재생하고, 필요할 때만 추가 편집을 적용한다.

### 2. Highlight는 선택형 편집 기능
- highlight는 모든 clip에 강제되는 기본 단계가 아니다.
- highlight range는 trim, spotlight, zoom, overlay와 함께 선택형 편집 기능으로 둔다.

### 3. Spotlight는 필수
- 축구 영상은 멀리서 찍힌 경우가 많으므로 주인공 식별 기능은 core다.
- `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.trackingMode`, `effects.trackingPoints` 소비 경로는 유지한다.

### 4. Zoom playback은 필수
- 재생 시점의 zoom은 선택 기능이 아니라 핵심 시청 경험이다.
- 클라이언트 재생 경로에서 spotlight와 함께 일관되게 동작해야 한다.

### 5. Profile card / lower third는 유지
- 선수 프로필 카드와 영상 하단 선수 정보는 Footory의 어필 장치다.
- 업로드와 재생 경험에서 제거 대상이 아니라 유지 대상이다.

### 6. Runtime playback은 clips metadata 기반
- core 재생은 별도 렌더 결과물을 전제하지 않는다.
- `clips` 메타데이터와 클라이언트 플레이어 조합으로 재생하는 현재 구조를 기준으로 삼는다.

### 7. Server render/export는 phase 2 또는 선택형 기능
- `render-worker/`, `/api/render/*`는 즉시 core flow로 복귀시키지 않는다.
- 서버 렌더와 export는 phase 2 또는 특정 선택형 기능으로 분리한다.

## Core Flow
1. 사용자가 짧은 영상을 선택한다.
2. 원본과 썸네일이 현재 저장 계약에 맞게 저장된다.
3. 업로드 직후 메타데이터와 기본 재생 정보가 준비된다.
4. 사용자는 clip을 바로 재생할 수 있다.
5. spotlight, zoom playback, profile card, lower third가 core 재생 경험을 이룬다.
6. 저장 결과는 기존 `clips` 메타데이터와 프로필 연결 구조 안에서 소비된다.

## Optional Editing Flow
1. 사용자는 필요할 때만 편집으로 들어간다.
2. 선택 편집 항목은 trim, spotlight, zoom playback 관련 설정, player info overlay, highlight range다.
3. highlight는 항상 강제되지 않으며, 대표 범위를 정해야 할 때만 설정한다.
4. 저장은 현재 살아 있는 `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `duration_sec` 계약을 우선 따른다.

## Phase 2
- 서버 렌더 기반 export
- 별도 결과물 엔티티 분리 저장
- 렌더 워커 재가동 또는 `/api/render/*` 메인 복귀
- 장기 보관용 고급 편집 드래프트와 복구 체계
- clip 여러 개를 조합하는 고급 하이라이트 제작

## 보존해야 하는 현재 아키텍처
- Cloudflare R2 원본/썸네일 저장 구조
- presign/direct-upload fallback
- `clips` 메타데이터 기반 클라이언트 재생
- `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `duration_sec` 중심 저장 계약
- `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.trackingMode`, `effects.trackingPoints` 소비 경로

## 이번 문서의 해석 원칙
- clip-first는 하이라이트 폐기가 아니라 기본 우선순위 재정렬이다.
- spotlight와 zoom playback은 하이라이트보다 아래 기능이 아니라 core playback 기능이다.
- render/export는 존재해도 core flow로 간주하지 않는다.
