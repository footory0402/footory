---
name: playwright-smoke-check
description: Run Footory Playwright smoke checks for upload, edit, save, re-entry, and publish flows, then summarize what passed, what failed, and what should be updated in the validation report.
---

# Playwright Smoke Check

Use this skill when a Footory change needs a short Playwright validation round instead of a full exploratory QA pass.

## Read first
- `AGENTS.md`
- `docs/testing/video-highlight-acceptance.md`
- `docs/testing/playwright-scenarios.md`
- `docs/testing/video-validation-report.md`
- `docs/release-readiness.md`

## Workflow
1. Confirm the exact user flow being checked. Keep it to one flow group such as upload to edit or edit to publish.
2. Prefer the smallest Playwright command that proves the target flow. Use existing scripts from `package.json`.
3. Run the required baseline checks when the change touched code:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:run`
4. Run the matching Playwright scenario or smoke subset.
5. Summarize:
   - what command ran
   - what passed
   - what failed or was skipped
   - what should change in `docs/testing/video-validation-report.md`

## Constraints
- Do not invent new scope or new product behavior.
- Do not mark unrun tests as passed.
- If environment blocks execution, say exactly what was missing.

## Output format
- Target flow
- Commands run
- Result summary
- Follow-up doc update points
