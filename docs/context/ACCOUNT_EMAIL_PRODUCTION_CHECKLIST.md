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
- `ACCOUNT_EMAIL_FROM` is configured in Vercel for the target environment.
- `APP_ORIGIN` points to the exact app origin used in account email links.
- Production is redeployed after env var changes.
- Preview smoke-tests use branch-specific `APP_ORIGIN` when needed.

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

- The application currently records provider `sent` after Resend accepts the
  message.
- Final delivery outcomes such as delivered, bounced, complained, or suppressed
  require `T-022` Resend webhook handling.
