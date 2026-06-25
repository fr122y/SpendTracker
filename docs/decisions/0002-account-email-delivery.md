# 0002. Account Email Delivery

Date: 2026-06-22

## Status

Accepted

## Context

SmartSpend Tracker needs account emails for credentials password reset and
email verification. The application is deployed on Vercel, uses Auth.js for
authentication, and keeps backend integrations in server-only code.

The first email change should unblock account flows without taking on a full
email platform implementation such as outbox persistence, webhooks, bounce
handling, or template management.

## Decision

Use Resend as the account email provider through a server-only shared wrapper.
The wrapper accepts typed account email payloads with text and HTML bodies plus
an idempotency key. It returns normalized results and errors so account flows do
not depend on raw provider responses.

Use plain TypeScript account email templates for the current password reset and
email verification messages instead of adding React Email. The current account
email surface is small, and plain templates keep dependencies, build behavior,
and tests simple while still allowing reusable text and inline-CSS HTML output.

Production sends require:

- `RESEND_API_KEY`
- `ACCOUNT_EMAIL_FROM`
- optional `ACCOUNT_EMAIL_REPLY_TO`

Local development and tests may run without `RESEND_API_KEY`; in that case the
wrapper logs a safe preview and returns a dev result instead of sending mail.

Production operations must verify a sending domain or subdomain before real
sends. Prefer a dedicated account email sender such as
`SmartSpend <noreply@mail.example.com>` and configure SPF, DKIM, and DMARC
outside the application code.

## Consequences

- Forgot-password and email-verification tasks can call one stable server-only
  email interface.
- Provider secrets stay out of client code and `NEXT_PUBLIC_*` variables.
- Idempotency is part of the contract now, so retries or an outbox can be added
  later without changing callers.
- Email outbox and retries can process the same typed payloads without knowing
  how templates are rendered.
- Resend webhooks and suppression lists remain separate follow-up tasks.
