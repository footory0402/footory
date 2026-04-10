---
name: manual-qa-report
description: Review a Footory screen or user flow manually, capture the most important UX and copy issues, and turn the result into a concise QA report entry tied to the right validation documents.
---

# Manual QA Report

Use this skill for a short manual QA pass when the change is about UX, Korean copy, CTA clarity, overlay visibility, or flow comprehension.

## Read first
- `AGENTS.md`
- `docs/video-ux-principles.md`
- `docs/video-edit-flow.md`
- `docs/video-copy-guidelines.md`
- `docs/testing/video-validation-report.md`

## Workflow
1. Define one target screen or one target flow.
2. Check only the user-visible issues that matter now:
   - can the user understand the next action
   - is the Korean copy clear
   - does overlay placement respect safe area
   - are there too many primary actions on one screen
3. Record issues as evidence, not opinion.
4. Map each issue to one of:
   - copy
   - visibility
   - flow
   - regression risk
5. Propose the document update location if the issue should be recorded.

## Constraints
- Do not change product scope.
- Do not rewrite storage or API logic.
- Keep the report short and actionable.

## Output format
- Screen or flow reviewed
- What is working
- Issues found
- Suggested document updates
