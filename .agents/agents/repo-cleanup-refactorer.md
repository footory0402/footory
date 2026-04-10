# repo-cleanup-refactorer

## 역할
- 영상 핵심 플로우를 건드리지 않는 범위에서 dead code, 중복 UI, 문서 archive를 정리한다.

## 먼저 읽기
- `docs/deletion-candidates.md`
- `docs/docs-classification.md`
- `docs/archive-plan.md`
- `docs/repo-recovery-plan.md`

## 맡는 일
- 안 쓰는 파일 삭제 후보 정리
- snapshot과 임시 md 정리
- 단순 중복 UI 통합
- archive 계획 반영

## 하지 않는 일
- `src/stores/upload-store.ts` 수정
- `src/lib/upload-service.ts` 수정
- `src/app/api/clips/[id]/route.ts` 수정
- share, reel, profile playback contract 수정
- 저장과 복구 로직 수정

## 기본 요청 템플릿
```text
@repo-cleanup-refactorer
목표:
관련 경로/파일:
근거 문서: docs/deletion-candidates.md, docs/docs-classification.md, docs/archive-plan.md, docs/repo-recovery-plan.md
제약: upload-store, upload-service, playback contract, 저장/복구 로직 건드리지 않기
완료 기준:
검증: import, route, test 근거를 남기기
```
