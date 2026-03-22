#!/bin/bash
set -e

PASS=0
FAIL=0
ERRORS=""

check() {
  local name="$1" result="$2" detail="$3"
  if [ "$result" = "0" ]; then
    echo "✅ $name"; ((PASS++))
  else
    echo "❌ $name — $detail"; ((FAIL++))
    ERRORS="$ERRORS\n❌ $name: $detail"
  fi
}

echo "=== 영상 업로드 파이프라인 검증 ==="

# 1. 타입 체크
npx tsc --noEmit 2>/tmp/tsc-errors.txt
check "타입 체크 통과" "$?" "$(cat /tmp/tsc-errors.txt | head -5)"

# 2. 빌드
npx next build 2>/tmp/build-errors.txt
check "빌드 통과" "$?" "$(cat /tmp/build-errors.txt | tail -10)"

# 3. 업로드 관련 파일 존재
for f in \
  src/app/upload/page.tsx \
  src/components/upload/VideoSelector.tsx \
  src/lib/upload-service.ts \
  src/stores/upload-store.ts \
  src/app/api/upload/presign/route.ts \
  src/app/api/upload/multipart/route.ts \
  src/app/api/clips/route.ts; do
  [ -f "$f" ]
  check "파일 존재: $f" "$?" "파일 없음"
done

# 4. STALL_TIMEOUT 상수 제거 확인
! grep -q "STALL_TIMEOUT_MS" src/lib/upload-service.ts
check "STALL_TIMEOUT_MS 상수 제거됨" "$?" "아직 남아있음"

# 5. calcStallTimeout 함수 존재
grep -q "calcStallTimeout" src/lib/upload-service.ts
check "calcStallTimeout 함수 존재" "$?" "함수 없음"

# 6. Promise.allSettled 병렬화 적용
grep -q "Promise.allSettled" src/app/api/clips/route.ts
check "clips API 병렬화 적용됨" "$?" "Promise.allSettled 없음"

# 7. _future 폴더 격리 확인
for f in VideoTrimmer EffectsToggle SkillLabelPicker RenderProgress SpotlightPicker; do
  [ -f "src/components/video/_future/${f}.tsx" ]
  check "_future 격리: ${f}" "$?" "파일 없음"
done

# 8. 메인 업로드 경로에서 _future import 없음
! grep -r "_future" src/app/upload/ src/components/upload/ \
  src/lib/upload-service.ts src/stores/upload-store.ts 2>/dev/null
check "업로드 경로에 _future import 없음" "$?" "import 발견"

echo ""
echo "=== 결과: $PASS 통과 / $FAIL 실패 ==="
[ -n "$ERRORS" ] && echo -e "\n실패 상세:$ERRORS"
exit $FAIL
