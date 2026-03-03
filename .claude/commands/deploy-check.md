Vercel 배포 전 아래 항목을 확인해줘:
1. npm run build 실행해서 에러 없는지
2. .env.local 환경변수가 모두 있는지 (.env.example과 비교)
3. TypeScript 타입 에러 없는지 (npx tsc --noEmit)
4. 콘솔 에러/경고 없는지
5. 모바일 뷰포트(430px)에서 레이아웃 깨지지 않는지
6. OG 메타 태그가 설정됐는지
결과를 ✅/❌로 표시해줘.
