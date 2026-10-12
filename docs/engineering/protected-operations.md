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

## When A Protected Operation Blocks The Task

Stop and report:

- which operation is needed and on which system;
- why the task needs it;
- what can be completed inside the rules without it.

Then wait for the owner's command. Finish the rest of the task that does not
depend on it.
