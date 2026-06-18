# Code Review

Before finishing non-trivial work, review the full diff against the target
branch.

## Correctness

- The original task or approved exception is solved.
- No unrelated behavior changed.
- Errors and edge cases are handled intentionally.
- Client and server contracts stay aligned.
- There are no obvious race conditions, stale state issues, or repeated
  requests.

## Task Boundaries

- Every changed file belongs to the task or approved exception.
- There is no unrelated refactoring or formatting churn.
- No debug code is left behind.
- New abstractions solve a current problem.
- Follow-up work is captured outside the diff.

## Types And Contracts

- Type checks are not bypassed with unnecessary `any`, assertions, or
  suppressions.
- Validation schemas and API types match behavior.
- Nullable and optional values are handled deliberately.

## Security

- Auth and authorization semantics are preserved or explicitly changed.
- User input is validated or escaped where needed.
- Secrets and tokens are not exposed.
- Sensitive data is not logged.
- Dependency changes are justified and reviewed.

## Tests

- Regression tests cover bug causes when reasonable.
- Tests assert observable behavior.
- Assertions are not weakened only to make tests pass.
- Removed tests are justified by an intentional contract change.

## Performance And Reliability

- Avoid repeated expensive work and unnecessary network calls.
- Bound loops, retries, and background work.
- Keep dependency and bundle growth intentional.
- Clean up resources, subscriptions, timers, and handles.
- Cache invalidation behavior is deliberate.

## Process

- Pull Request title and body follow `docs/engineering/change-request.md`.
- Task tracker, project log, task-run report, ADRs, and open questions were
  updated when required.
- `python3 scripts/validate_task_tracker.py` was run when tracker files
  changed.
