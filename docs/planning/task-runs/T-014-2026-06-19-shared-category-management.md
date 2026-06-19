# Task Run: T-014 Manage shared budget categories

Date: 2026-06-19

Branch: `task/T-014-shared-category-management`

Issue: #TBD

PR: TBD

## Summary

Added user-facing management for shared budget categories in the existing
category widget. Shared budget members can view, add, edit, and archive active
categories for a selected shared budget. Editing a shared category updates the
category label and emoji on existing linked shared expenses.

## Scope

- Planned: shared category management UI, shared category server rules,
  cache invalidation, focused tests, tracker updates.
- Out of scope: restoring archived categories, owner-only category
  permissions, personal category editing.
- Write scope: category entity, manage-categories feature, shared category
  server actions, planning docs.

## Changes

- Added personal/shared category mode switching to the category manager.
- Added shared budget selection plus shared category add, edit, and archive
  flows.
- Kept category archival as soft-delete behavior for new shared expenses.
- Added duplicate active shared category name validation.
- Made shared category edits transactional and retroactive for existing
  linked shared expenses.
- Invalidated shared category, shared keyword mapping, and expense caches where
  category changes affect visible data.

## Files Touched

- `src/features/manage-categories/**`
- `src/entities/category/**`
- `src/shared/api/shared-category-actions.ts`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm test -- --runTestsByPath src/shared/api/__tests__/shared-category-actions.test.ts src/entities/category/__tests__/queries.optimistic.test.ts src/features/manage-categories/__tests__/CategoryManager.test.tsx`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: passed.
- Not run: manual browser QA.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: shared category edits now intentionally update
  linked shared expense labels; archive remains non-destructive.
- Tracker consistency checked: yes.
- Docs checked: planning docs and task-run updated.
- CI or PR status: local validation passed; PR pending.

## Follow-Ups

- None required for T-014.

## Open Questions

- None.

## Registry Update Requested

- Move `T-014` to `review` after PR is opened.
