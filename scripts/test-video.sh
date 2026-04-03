#!/bin/bash
# ───────────────────────────────────────────────────
# 영상 업로드/편집/재생 E2E 테스트 실행 스크립트
#
# 사용법:
#   ./scripts/test-video.sh /path/to/video.mp4           # 업로드 플로우 테스트
#   ./scripts/test-video.sh /path/to/video.mp4 --all     # 전체 테스트 (업로드+플레이어+카드)
#   ./scripts/test-video.sh --player                      # 플레이어만 테스트
#   ./scripts/test-video.sh --card                        # 카드 에디터만 테스트
#   ./scripts/test-video.sh /path/to/video.mp4 --headed   # 브라우저 표시 모드
# ───────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

VIDEO_FILE=""
RUN_UPLOAD=false
RUN_PLAYER=false
RUN_CARD=false
HEADED=""
EXTRA_ARGS=""

# 인자 파싱
for arg in "$@"; do
  case "$arg" in
    --all)
      RUN_UPLOAD=true
      RUN_PLAYER=true
      RUN_CARD=true
      ;;
    --player)
      RUN_PLAYER=true
      ;;
    --card)
      RUN_CARD=true
      ;;
    --headed)
      HEADED="--headed"
      ;;
    --debug)
      HEADED="--headed --debug"
      ;;
    --*)
      EXTRA_ARGS="$EXTRA_ARGS $arg"
      ;;
    *)
      if [ -f "$arg" ]; then
        VIDEO_FILE="$(cd "$(dirname "$arg")" && pwd)/$(basename "$arg")"
        RUN_UPLOAD=true
      else
        echo "❌ 파일을 찾을 수 없습니다: $arg"
        exit 1
      fi
      ;;
  esac
done

# 기본값: 아무 플래그도 없으면 영상 파일 필수
if ! $RUN_UPLOAD && ! $RUN_PLAYER && ! $RUN_CARD; then
  echo "사용법:"
  echo "  ./scripts/test-video.sh <영상파일>           업로드 플로우 테스트"
  echo "  ./scripts/test-video.sh <영상파일> --all     전체 테스트"
  echo "  ./scripts/test-video.sh --player             플레이어 테스트"
  echo "  ./scripts/test-video.sh --card               카드 에디터 테스트"
  echo "  --headed                                     브라우저 표시 모드"
  echo "  --debug                                      디버그 모드"
  exit 0
fi

RESULTS_DIR="$PROJECT_DIR/test-results/video-screenshots"
mkdir -p "$RESULTS_DIR"

echo ""
echo "🎬 Footory 영상 테스트"
echo "────────────────────────"
if [ -n "$VIDEO_FILE" ]; then
  FILE_SIZE=$(du -h "$VIDEO_FILE" | cut -f1)
  echo "📁 영상: $VIDEO_FILE ($FILE_SIZE)"
fi
echo "📸 스크린샷: $RESULTS_DIR"
echo ""

TEST_FILES=""

if $RUN_UPLOAD; then
  if [ -z "$VIDEO_FILE" ]; then
    echo "❌ 업로드 테스트에는 영상 파일이 필요합니다"
    exit 1
  fi
  TEST_FILES="$TEST_FILES tests/e2e/video/video-upload-flow.spec.ts"
fi

if $RUN_PLAYER; then
  TEST_FILES="$TEST_FILES tests/e2e/video/video-player.spec.ts"
fi

if $RUN_CARD; then
  TEST_FILES="$TEST_FILES tests/e2e/video/profile-card-editor.spec.ts"
fi

# Playwright 실행
VIDEO_FILE="$VIDEO_FILE" npx playwright test \
  $TEST_FILES \
  --project="iPhone 15" \
  $HEADED \
  $EXTRA_ARGS

echo ""
echo "✅ 테스트 완료!"
echo "📸 스크린샷 확인: open $RESULTS_DIR"
echo "📊 리포트 확인: npx playwright show-report"
