# Task Run: T-020 Normalize money math input precision

Date: 2026-06-22

Branch: `task/T-020-money-math-precision`

Issue: #TBD

PR: #27

## Summary

Normalized evaluated `MathInput` values so simple calculations do not surface
floating-point tails in money and percentage inputs. Evaluated values now round
to at most two decimal places, whole-number results display without trailing
zeroes, and the numeric callback receives the same normalized value.

## Scope

- Planned: shared math input precision normalization, regression tests,
  tracker updates.
- Out of scope: changing expression parsing, locale decimal output, persisted
  storage precision, or broader currency formatting.
- Write scope: `src/shared/ui/**`, `docs/planning/**`.

## Changes

- Added evaluated value normalization in `MathInput` after min/max clamping.
- Preserved raw typing behavior and invalid-expression behavior.
- Added regression tests for floating-point tails, two-decimal rounding,
  whole-number display, plain decimal normalization, and negative zero.

## Files Touched

- `src/shared/ui/math-input.tsx`
- `src/shared/ui/__tests__/math-input.test.tsx`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm test -- src/shared/ui/__tests__/math-input.test.tsx`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: Passed.
- Not run: Playwright e2e; this is covered by focused component regression
  tests plus full unit/integration validation.

## Review Checkpoint

- Scope checked: Yes, changes are limited to the shared math input, focused
  tests, and planning docs.
- Acceptance criteria checked: Yes.
- Regression risk checked: Yes; expression parsing and app-specific form
  handlers were not changed.
- Tracker consistency checked: Yes, task tracker validation passed.
- Docs checked: Yes.
- CI or PR status: PR #27 merged with merge commit `862670b`.

## Follow-Ups

- None.

## Open Questions

- None.

## Registry Update Requested

- `T-020` moved to `done` after PR #27 merged.
