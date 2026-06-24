# Task Run: T-024 Configure Resend account email secrets

Date: 2026-06-23

Branch: `task/T-024-configure-resend-email-secrets`

Issue: none

PR: #33

Merge commit: `af895c1`

## Summary

Prepared the owner-led production setup runbook for account email delivery.
The application code already reads `RESEND_API_KEY`, `ACCOUNT_EMAIL_FROM`, and
optionally `ACCOUNT_EMAIL_REPLY_TO` through the server-only account email
wrapper. This task must be completed by configuring Resend, DNS, and Vercel
secrets outside the repository.

## Decisions

- Sending domain: use `mail.<production-domain>` for account emails.
- Sender: use `SmartSpend <noreply@mail.<production-domain>>`.
- Reply-to: do not configure `ACCOUNT_EMAIL_REPLY_TO` for the first pass.
- Environments: configure Vercel `Preview` and `Production`.
- Preview smoke-test: use a branch-specific `APP_ORIGIN` that points to the
  selected preview deployment.
- Production links: use `APP_ORIGIN=https://<production-app-domain>`.
- API key: use the minimum practical Resend sending permission.

## Owner Setup Runbook

1. In Resend, create or select the SmartSpend account email project.
2. Add `mail.<production-domain>` as the account email sending domain.
3. Add the DNS records Resend provides for SPF and DKIM; configure DMARC for
   the same domain policy.
4. Wait until Resend shows the sending domain as verified.
5. Create a Resend API key with sending-only permissions where available.
6. In Vercel, add `RESEND_API_KEY` and `ACCOUNT_EMAIL_FROM` to Preview and
   Production. Do not add `NEXT_PUBLIC_*` email secret variables.
7. In Vercel, set `APP_ORIGIN` for Production to the canonical app URL.
8. For the preview smoke-test branch, set branch-specific `APP_ORIGIN` to the
   selected preview deployment URL.
9. Redeploy after environment variable changes so the new values are used.
10. Smoke-test through an existing account email UI flow: email verification or
    password reset.

## Verification

- PR #33 merged the repository runbook into `main`.
- Verified on 2026-06-24: `spendtracker.online` is connected to the Vercel
  `spend-tracker` project and serves the production app over HTTPS.
- Verified on 2026-06-24: Timeweb DNS publishes the Resend records for
  `mail.spendtracker.online`, and Resend reports the domain as verified.
- Verified on 2026-06-24: Vercel Production has `APP_ORIGIN`,
  `ACCOUNT_EMAIL_FROM`, and `RESEND_API_KEY` configured, then Production was
  redeployed.
- Smoke-test confirmed by owner on 2026-06-24: a real email verification
  message arrived from the deployed UI flow.
- Repository validation required for this runbook:
  `python3 scripts/validate_task_tracker.py`.

## Safety Notes

- Do not commit real API keys, DNS record values, mailbox credentials, or
  screenshots that reveal secrets.
- Keep `RESEND_API_KEY` server-side only.
- Do not add `ACCOUNT_EMAIL_REPLY_TO` unless a monitored support mailbox is
  ready.

## Acceptance Status

- Resend account/project exists: confirmed by owner.
- Sending subdomain verified: confirmed in Resend.
- DNS records configured: confirmed in Timeweb DNS.
- Resend API key stored only in secret storage: confirmed in Vercel
  Production env.
- Vercel env configured: confirmed for Production.
- No secret committed: satisfied by repository changes in this run.
- Real account email smoke-tested: confirmed by owner.
- Operational notes recorded without secrets: satisfied by this task-run
  report.

## Registry Update Requested

- Mark `T-024` done. Production account email delivery is configured and
  smoke-tested. Future Preview smoke-tests should use branch-specific
  `APP_ORIGIN` values instead of a global Preview value.
