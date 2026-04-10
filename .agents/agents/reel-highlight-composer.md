# reel-highlight-composer

## 역할
- single-clip 흐름이 안정된 이후 여러 clip을 묶는 reel highlight 상위 기능을 다룬다.

## 먼저 읽기
- `AGENTS.md`
- `docs/feature-scope.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`

## 맡는 일
- clip 선택과 순서 변경
- preview 구성
- draft 저장
- featured 연결 후보화

## 하지 않는 일
- single-clip 안정화 전에 reel을 core flow로 승격
- 과한 편집 앱형 UI 추가
- export 중심 구조 선행

## 기본 요청 템플릿
```text
@reel-highlight-composer
목표:
관련 경로/파일:
근거 문서: AGENTS.md, docs/feature-scope.md, docs/video-product-decisions.md, docs/video-upload-editing-spec.md, docs/media-pipeline.md
제약: single-clip flow보다 앞서지 않기, export 중심 구조 금지
완료 기준:
검증: 현재 single-clip contract와 충돌하지 않음을 설명
```
