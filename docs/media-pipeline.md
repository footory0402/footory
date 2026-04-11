# 미디어 파이프라인 사양

> Last synced: 2026-04-10

## 문서 목적
- 영상 업로드부터 clip 재생, 선택 편집 저장, 프로필 연결까지의 미디어 파이프라인 기준을 정리한다.
- 이 문서는 구현 세부 기술 선택 문서라기보다, 어떤 데이터를 언제 만들고 무엇을 유지해야 하는지에 대한 기준 문서다.
- 현재 살아 있는 아키텍처를 보존하면서 core flow와 phase 2를 분리한다.

## 기본 원칙
- 원본 영상은 항상 보존한다.
- Cloudflare R2 원본/썸네일 저장 구조와 presign/direct-upload fallback을 유지한다.
- 기본 소비 단위는 렌더 결과물이 아니라 clip이다.
- 런타임 재생은 `clips` 메타데이터 기반 클라이언트 재생을 기준으로 한다.
- `trim_start`, `trim_end`, `highlight_start`, `highlight_end`, `duration_sec` 중심 저장 계약을 유지한다.
- `spotlight_x`, `spotlight_y`, `freeze_at`, `effects.trackingMode`, `effects.trackingPoints` 소비 경로를 유지한다.
- 실패와 재시도, 중단 복구를 기본 흐름으로 포함한다.

## Core Flow 단계
1. 원본 업로드 준비
2. Cloudflare R2 원본 저장
3. 메타데이터 추출과 썸네일 준비
4. `clips` 레코드 저장
5. 업로드 직후 clip 재생
6. 선택 편집이 있을 경우 메타데이터 갱신
7. 프로필 featured 또는 태그 포트폴리오 연결
8. draft/project 저장 및 재진입 복구

## 1. 원본 업로드 준비
- 사용자가 선택한 짧은 영상은 업로드 전에 형식, 길이, 용량 검사를 거친다.
- 업로드는 presign 기반 직접 업로드를 기본으로 하고, direct-upload fallback 경로를 유지한다.
- multipart 경로가 남아 있어도 현재 core 기준은 아니다.

### 준비 단계에서 유지할 값
- owner_id
- uploaded_by
- 파일명
- 파일 크기
- 콘텐츠 타입
- 업로드 시작 시각
- 업로드 상태

## 2. Cloudflare R2 원본 저장
- 사용자가 선택한 원본 영상은 가장 먼저 변경 없이 저장한다.
- 원본은 이후 재생, 재편집, 문제 추적의 기준이므로 덮어쓰지 않는다.
- 원본과 썸네일 저장 구조는 현재 R2 키 체계와 공개 URL 조합 방식을 유지한다.

### 유지할 구조
- 원본 저장 키
- 썸네일 저장 키
- presigned URL 발급
- direct upload fallback
- 필요 시 multipart fallback

### 현재 유지 중인 키 규칙
- 원본 영상 키: `originals/{userId}/{clipId}.{ext}`
- 썸네일 키: `thumbnails/{userId}/{clipId}.jpg`
- render/raw 계열 키: `raw/{userId}/...`
- 현재 업로드 API는 사용자 소유 prefix 밖의 키를 허용하지 않는다.
- `highlights/` 같은 별도 결과물 prefix는 현재 core upload contract의 기본값이 아니다.

### 현재 유지 중인 presign/public URL 규칙
- 원본 업로드 presigned URL은 현재 1시간 기준으로 발급한다.
- 썸네일 업로드 presigned URL은 현재 10분 기준으로 발급한다.
- 공개 재생 URL은 R2 public URL 조합을 기준으로 만든다.
- 모바일 브라우저 호환성을 위해 presigned PUT 서명에는 `ContentLength`를 포함하지 않는다.

## 3. 메타데이터 추출과 썸네일 준비
- 업로드가 완료되면 영상 기본 메타데이터를 추출한다.
- 메타데이터 추출은 clip 재생과 선택 편집의 기준이 된다.
- 첫 썸네일 또는 대표 프레임 썸네일을 준비한다.

### 추출 대상
- duration
- width
- height
- frame_rate
- audio 유무
- rotation 또는 orientation

### 목적
- 업로드 직후 재생 가능 상태 확보
- trim과 highlight range 기준 확보
- spotlight와 zoom playback 계산 기준 확보

## 4. `clips` 레코드 저장
- core 저장 계약은 별도 결과물 엔티티보다 `clips` 메타데이터 저장을 우선한다.
- 업로드 직후 재생에 필요한 값이 준비되면 clip은 바로 소비 가능 상태여야 한다.
- 클라이언트 재생 경로가 읽는 값은 이 단계에서 일관되게 유지해야 한다.

### 반드시 유지할 저장 계약
- `video_url`
- `thumbnail_url`
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

## 5. 업로드 직후 clip 재생
- 프로필, 공유, 릴 등 런타임 재생은 별도 서버 렌더 없이 동작할 수 있어야 한다.
- core 재생은 clip URL과 메타데이터를 클라이언트에서 조합하는 방식으로 본다.
- spotlight와 zoom playback은 이 재생 단계의 핵심 기능이다.
- profile card와 lower third는 이 재생 단계에서 함께 소비되는 정보 장치다.

## 6. 선택 편집 메타데이터 갱신
- 사용자가 필요할 때만 trim, spotlight, zoom 관련 설정, overlay, highlight range를 수정한다.
- 선택 편집은 현재 살아 있는 `clips` 메타데이터 갱신 구조를 우선 따른다.
- highlight는 항상 필수 단계가 아니며, 값이 비어 있어도 clip 재생은 가능해야 한다.
- 이번 단계의 확대 재생은 시간축 추적이 아니라 단일 spotlight 지점 기준의 고정 확대를 우선한다.

### 선택 편집에서 다루는 값
- `trim_start`
- `trim_end`
- `highlight_start`
- `highlight_end`
- `spotlight_x`
- `spotlight_y`
- `freeze_at`
- `effects.trackingMode`
- `effects.trackingPoints`
- overlay 관련 표시 값

### 확대 재생 해석 원칙
- 현재 저장 계약에 `effects.trackingMode`, `effects.trackingPoints`가 남아 있어도 이번 단계의 사용자 편집은 이를 노출하지 않는다.
- single clip 편집에서 확대 재생은 `spotlight_x`, `spotlight_y`, `freeze_at`, `focusZoom` 조합으로 충분히 설명 가능해야 한다.
- 재생 중 수동 패닝은 core playback 기준이 아니다. 편집에서 정한 구도를 재생에서 안정적으로 보여주는 쪽을 우선한다.
- 추적형 확대가 필요해 보여도 이번 단계에서는 phase 2 또는 별도 판단 대상으로 남긴다.

## 7. 프로필 연결
- 저장된 clip은 프로필 clip 목록, `featured_clips`, `clip_tags` 구조 안에서 소비된다.
- 기본 엔티티는 clip이며, highlight range가 있어도 별도 결과물 엔티티를 기본값으로 두지 않는다.
- profile 연결은 업로드 후 즉시 반영 가능한 구조를 우선한다.

## 8. draft/project 저장과 재진입 복구
- publish 전 편집 상태는 `clips`, `highlights`에 바로 덮어쓰지 않고 별도 draft/project 레이어에 저장한다.
- single clip draft는 published clip playback metadata와 분리된 편집 payload로 보관한다.
- reel highlight draft도 같은 project 레이어에서 저장하고, publish 시점에만 `highlights` 엔티티를 만든다.
- 재진입 시 최근 draft를 다시 열 수 있어야 하며, 복구 후 publish 전까지는 draft 상태를 유지한다.

## 실패, 재시도, 중단 복구

### 업로드 실패
- 같은 clip 저장 흐름 안에서 재시도 가능해야 한다.
- presign 실패 시 direct-upload fallback 경로를 유지한다.
- 현재 direct-upload fallback은 `originals/`, `thumbnails/`, `raw/` prefix를 허용한다.
- 서버 프록시 경로는 폴백으로만 유지하고, 기본 경로는 브라우저에서 R2로 직접 올리는 방식이다.

### 메타데이터 또는 썸네일 준비 실패
- 원본이 저장되어 있으면 백그라운드 재시도 큐에 넣을 수 있어야 한다.
- 사용자는 "처리 중" 상태를 이해할 수 있어야 한다.

### 선택 편집 실패
- 기존 clip 재생 가능 상태를 깨지 않아야 한다.
- 편집값 저장 실패는 clip 자체의 소비 불가와 분리해서 다룬다.

### 사용자 중단
- 업로드 완료 이후라면 최소한 clip 재생 진입은 가능해야 한다.
- single clip draft와 reel draft는 최근 저장 상태를 복구할 수 있어야 한다.

## 현재 운영 제약
- multipart 경로는 살아 있지만 current core path는 아니다.
- 현재 코드 기준 multipart 진입 임계값은 `50MB`다.
- multipart 파트 크기는 `5MB` 미만으로 내리지 않는다. R2 최소 파트 크기 제약 때문이다.
- Vercel 함수 하드캡 때문에 multipart complete 경로는 환경에 따라 불안정할 수 있으므로, 단일 presigned PUT과 direct-upload fallback을 계속 유지한다.
- 업로드 요청은 Service Worker 간섭을 줄이기 위해 `cache: "no-store"` 우회 fetch를 사용한다.
- 긴 업로드 구간에서는 브라우저가 지원할 때만 screen wake lock을 요청하고, 실패해도 업로드 자체를 막지는 않는다.

## 상태 모델
- `uploading`
- `uploaded`
- `metadata_ready`
- `thumbnail_ready`
- `playable`
- `edit_saved`
- `draft_saved`
- `published`
- `failed`

## 관찰 가능성
- 각 단계는 상태 전이와 시간 기록을 남겨야 한다.
- 최소한 다음 값은 운영에서 볼 수 있어야 한다.
- clip_id
- owner_id
- current_status
- last_error_code
- retry_count
- source_key
- thumbnail_key

## Phase 2로 분리하는 것
- `render-worker/` 중심 서버 렌더
- `/api/render/*` 메인 복귀
- 별도 결과물 엔티티 분리 저장
- clip 여러 개를 조합하는 고급 하이라이트 제작
- `rendered_url`, `raw_key`, `render_jobs` 중심 결과물 파이프라인의 core 복귀

## 이번 단계에서 만들지 않을 것
- 여러 출력 포맷을 한 번에 생성하는 복잡한 배치 렌더
- 장면별 효과 파라미터를 무한히 저장하는 설계
- 사용자별 커스텀 렌더 템플릿 마켓
- 오디오 믹싱 전용 파이프라인
- 프로 편집툴 수준의 타임라인 이벤트 로그

## Footory 기준 결론
- 파이프라인의 core는 R2 원본 저장, `clips` 메타데이터 저장, 업로드 직후 재생, 선택 편집 메타데이터 갱신, 프로필 연결이다.
- spotlight와 zoom playback은 core playback 기능으로 파이프라인 기준에 포함된다.
- 서버 렌더와 export는 살아 있는 코드가 있어도 phase 2로 분리해 다뤄야 한다.
