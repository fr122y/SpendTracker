# Protected Operations

The operations on this page change live data, credentials, or the checks that
guard `main`. Each one runs only on a direct owner command for that exact
action in the current conversation. A task description, an earlier approval, or
a failing check is not such a command.

## Environments

| Environment                   | Database                         | Schema changes |
| ----------------------------- | -------------------------------- | -------------- |
| Local checkout (`.env.local`) | development (`spendtracker-dev`) | agent or owner |
| Vercel Preview, every branch  | development (`spendtracker-dev`) | agent or owner |
| Vercel Production (`main`)    | production                       | owner only     |

- The production connection string lives only in the Vercel Production
  environment and the GitHub `Production` environment. A checkout holds the
  development one. When a command asks for production credentials, stop.
- The development database was seeded from a production copy on 2026-10-12 and
  holds real account data. Keep its rows out of Pull Requests, logs, fixtures,
  and reports.
- Merging into `main` deploys to production automatically.

## Schema Changes

1. Write the migration in `drizzle/` and apply it to the development database
   with `npm run db:migrate`.
2. Verify the change on the Pull Request's Vercel Preview.
3. State in the Pull Request the exact pending migration filenames and whether
   the new code still works on the old schema.
4. The owner applies the migration to production by dispatching the
   `DB Migration` workflow and approving the `Production` environment, and
   decides its order relative to the merge.

## Owner-Only Operations

GitHub:

- merging a Pull Request, pushing to `main`, force-pushing any branch;
- branch protection, rulesets, and repository settings;
- secrets, variables, environments, and their reviewers;
- dispatching workflows and approving deployments.

Vercel:

- environment variables and project settings;
- production deploys, promotions, rollbacks, and domains.

Database:

- any command that reaches the production database;
- `npm run db:push` on any database, because it bypasses the migration ledger.

Checks:

- bypassing hooks with `--no-verify`;
- weakening or disabling a CI workflow, a hook, or the lint, type, test,
  commit-message, or OpenSpec configuration. A change to these files goes in
  its own Pull Request that names the check being changed and why.

The `protected-paths` check enforces this: it fails any Pull Request that
changes a file matched by `.github/protected-paths.txt`, or the `scripts` or
`lint-staged` values of `package.json`. It runs the base-branch version of the
workflow, the script, and the list, so a Pull Request cannot edit the check
that judges it. The owner merges such a Pull Request with the `Protect main`
ruleset bypass after confirming `verify` is green.

The `test-integrity` check runs the same way and fails a Pull Request that
weakens existing tests: it deletes a test file, adds a skip or only marker
(`.skip`, `.only`, `.todo`, `.failing`, `xit`, `fit`, and the like), or lowers
the number of test cases across the existing test files it changes. Modifying
tests is normal and passes. A legitimate removal goes in its own Pull Request,
which the owner merges with the `Protect main` ruleset bypass after confirming
`verify` is green.

The `e2e` check (workflow `.github/workflows/e2e.yml`) builds the Pull
Request's head commit with `next build`, serves it with `next start` on
`localhost:3000` inside the GitHub Actions runner, and runs the Playwright
specs listed in `.github/e2e-specs.txt` against it. It never calls a Vercel
deployment, so e2e traffic does not use the Vercel Hobby function quota (see
[Platform Settings](platform-settings.md#vercel)). It fails
when a listed spec is missing or any of its tests is skipped. That list is a
protected file with one exception: `protected-paths` passes a Pull Request
whose only protected change is additions to `.github/e2e-specs.txt`, where each
added line is blank, a `#` comment, or a new, not yet listed
`e2e/<name>.spec.ts` path that exists in the Pull Request head. The check reads
both versions of the list and the added specs through the REST API. Removing,
reordering, or editing a line, a rename or deletion of the list, or any other
protected path in the same Pull Request still goes through the owner's bypass.

The `e2e` runs are spread over three CI slots, each with its own test account
on the development database, so Pull Requests in different slots run in
parallel. The slot is the Pull Request number mod 3 (slot 0 for a commit
without an open Pull Request); runs in the same slot queue in the concurrency
group `e2e-slot-<n>` and are never cancelled by another Pull Request.
The slot accounts are CI-only: no person or local run uses them. Their
repository secrets, set by the owner:

| Slot | Secrets                                           |
| ---- | ------------------------------------------------- |
| 0    | `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`             |
| 1    | `E2E_USER_EMAIL_SLOT1`, `E2E_USER_PASSWORD_SLOT1` |
| 2    | `E2E_USER_EMAIL_SLOT2`, `E2E_USER_PASSWORD_SLOT2` |

The server under test reads two more repository secrets, shared by all
slots:

| Secret            | Value                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `CI_DATABASE_URL` | Pooler URL of the development database, the one the test accounts live in. Never production.  |
| `CI_AUTH_SECRET`  | A random value used only in CI (`openssl rand -base64 32`), not the production `AUTH_SECRET`. |

`AUTH_TRUST_HOST`, `AUTH_URL`, and `APP_ORIGIN` are constants in the workflow
(`http://localhost:3000`). Google sign-in, `RESEND_API_KEY`, `CRON_SECRET`, and
`RESEND_WEBHOOK_SECRET` are not set: the gated specs sign in with email and
password and do not send email. A run whose secrets are missing fails at the
`Require e2e secrets` step and names them.

A manual run (`workflow_dispatch`) tests any ref with the same secrets in a
chosen slot; see [E2E Tests](../../e2e/README.md#proof-runs-in-ci).

## When A Protected Operation Blocks The Task

Stop and report:

- which operation is needed and on which system;
- why the task needs it;
- what can be completed inside the rules without it.

Then wait for the owner's command. Finish the rest of the task that does not
depend on it.
