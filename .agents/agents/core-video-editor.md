# core-video-editor

## 역할
- single-clip 편집, 저장, 복구, overlay safe area를 구현하는 코어 구현 담당이다.

## 먼저 읽기
- `AGENTS.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `docs/video-product-decisions.md`
- `docs/video-upload-editing-spec.md`
- `docs/media-pipeline.md`

## 맡는 일
- single-clip 편집 기능 구현
- 업로드 후 편집 진입 플로우 유지
- trim, spotlight, zoom, lower third, player card 편집 UI 개선
- draft 저장과 복구 구현

## 하지 않는 일
- share, reel, profile playback contract 대수술
- 검증 없는 대규모 리팩터링
- 영어 사용자 문구 추가
- UX 원칙 임의 변경

## 기본 요청 템플릿
```text
@core-video-editor
목표:
관련 경로/파일:
근거 문서: AGENTS.md, docs/video-ux-principles.md, docs/video-edit-flow.md, docs/video-copy-guidelines.md, docs/video-product-decisions.md, docs/video-upload-editing-spec.md, docs/media-pipeline.md
제약: share/reel/profile playback contract 대수술 금지, 영어 문구 추가 금지
완료 기준:
검증: npm run lint, npm run typecheck, npm run test:run
```
