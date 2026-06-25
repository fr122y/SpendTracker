# Account Email Production Checklist

Use this checklist before relying on account emails in Production or a Preview
environment.

## Sending Identity

- Resend domain is verified for account email sending:
  `mail.spendtracker.online`.
- Sender address uses the verified sending subdomain, for example:
  `SmartSpend <noreply@mail.spendtracker.online>`.
- `ACCOUNT_EMAIL_REPLY_TO` is configured only when a monitored support mailbox
  exists.

## DNS And Trust

- SPF record from Resend is published for the sending subdomain.
- DKIM record from Resend is published and verified.
- DMARC is published for the domain or sending subdomain.
- DNS changes are visible in Resend and the provider dashboard.

## Secrets And Environments

- `RESEND_API_KEY` is stored only in secret storage, never in the repository.
- The Resend API key uses the minimum practical sending permission.
- `RESEND_WEBHOOK_SECRET` is stored only in server-side secret storage.
- `ACCOUNT_EMAIL_FROM` is configured in Vercel for the target environment.
- `APP_ORIGIN` points to the exact app origin used in account email links.
- Production is redeployed after env var changes.
- Preview smoke-tests use branch-specific `APP_ORIGIN` when needed.

## Webhooks And Suppression

- Resend webhook URL points to:
  `https://spendtracker.online/api/webhooks/resend`.
- Resend webhook events enabled for account email delivery:
  - `email.sent`
  - `email.delivered`
  - `email.delivery_delayed`
  - `email.failed`
  - `email.bounced`
  - `email.complained`
  - `email.suppressed`
- The webhook signing secret from Resend is configured as
  `RESEND_WEBHOOK_SECRET` in Vercel for the target environment.
- `drizzle/0011_account_email_webhooks.sql` is applied before relying on
  webhook event persistence or suppression checks.
- Production is redeployed after adding `RESEND_WEBHOOK_SECRET`.

## Smoke Test

- Trigger email verification from the deployed UI.
- Trigger password reset from the deployed UI.
- Confirm both account emails appear in Resend email logs.
- Confirm the email body shows a readable button, fallback URL, expiry notice,
  and ignore-if-unrequested guidance.
- Check inbox, spam, and promotions tabs for Gmail or other strict mailbox
  providers.
- If a message lands in spam, mark it as not spam during manual QA and inspect
  Resend logs for delivery status once `T-022` webhooks exist.

## Current Limits

- Webhook events are stored for audit/debugging, but there is no admin UI for
  browsing delivery history or suppression records yet.
- Open/click tracking is intentionally not enabled for account emails.
