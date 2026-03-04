코드 리팩토링을 진행해줘. 아래 순서대로.

## Step 1: 중복 제거
- src/components/ 전체를 스캔해서 3곳 이상 반복되는 패턴 찾기
- 공통 컴포넌트나 유틸 함수로 추출
- 추출 전/후 코드 보여주고 적용

## Step 2: 타입 정리
- 모든 컴포넌트의 props 타입을 src/lib/types.ts에 통합
- any 타입을 구체적 타입으로 교체
- Supabase 테이블과 매칭되는 타입 확인

## Step 3: 상수 정리
- 하드코딩된 컬러값 → Tailwind 클래스 또는 CSS 변수로
- 하드코딩된 문자열 → constants.ts로
- 매직 넘버 → 이름 있는 상수로

## Step 4: 컴포넌트 분리
- 150줄 넘는 컴포넌트를 찾아서 분리 제안
- 분리 후에도 기존 동작이 유지되는지 확인

## Step 5: 성능 최적화
- 불필요한 re-render 방지 (React.memo, useMemo, useCallback)
- 인라인 스타일 객체 → 컴포넌트 밖으로 추출
- 이미지/영상 lazy loading 확인

변경하는 모든 파일의 변경 내역을 정리해줘.
리팩토링 후 npm run build가 통과하는지 확인해줘.
