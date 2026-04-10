---
name: docs-archive-classifier
description: Classify Footory documents into current, canonical, reference, and archive buckets, then suggest the smallest safe cleanup or archive move without changing product direction.
---

# Docs Archive Classifier

Use this skill when Footory docs have grown noisy and you need a small, evidence-based classification pass before cleanup.

## Read first
- `AGENTS.md`
- `docs/docs-classification.md`
- `docs/archive-plan.md`
- `docs/repo-recovery-plan.md`
- `docs/recovery-log.md`

## Workflow
1. Start from the documents named in the request. Do not scan the whole repo unless required.
2. For each document, classify it as one of:
   - current
   - canonical
   - reference
   - archive candidate
3. Explain the reason using actual call sites, current workflow value, or duplication evidence.
4. Separate:
   - safe to archive now
   - needs merge first
   - keep as current
5. If moving or deleting is requested, update the plan doc first.

## Constraints
- Do not delete large coupled areas in one pass.
- Do not archive canonical docs just because they are long.
- Prefer evidence from current usage over intuition.

## Output format
- Documents reviewed
- Classification result
- Safe next action
- Risks or blockers
