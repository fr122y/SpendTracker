import 'server-only'

export type AccountEmailTemplate = {
  subject: string
  text: string
  html: string
}

type PasswordResetTemplateInput = {
  resetUrl: string
  expiresInMinutes: number
}

type EmailVerificationTemplateInput = {
  verifyUrl: string
  expiresInHours: number
}

type AccountEmailLayoutInput = {
  preheader: string
  eyebrow: string
  title: string
  intro: string
  actionLabel: string
  actionUrl: string
  expiryText: string
  securityText: string
}

const BRAND_NAME = 'SmartSpend'
const SUPPORT_TEXT =
  'Это автоматическое письмо от SmartSpend. Мы никогда не попросим вас прислать пароль в ответном письме.'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function createTextEmail(input: AccountEmailLayoutInput): string {
  return [
    input.title,
    input.intro,
    `${input.actionLabel}: ${input.actionUrl}`,
    input.expiryText,
    input.securityText,
    SUPPORT_TEXT,
  ].join('\n\n')
}

function createHtmlEmail(input: AccountEmailLayoutInput): string {
  const preheader = escapeHtml(input.preheader)
  const eyebrow = escapeHtml(input.eyebrow)
  const title = escapeHtml(input.title)
  const intro = escapeHtml(input.intro)
  const actionLabel = escapeHtml(input.actionLabel)
  const actionUrl = escapeHtml(input.actionUrl)
  const expiryText = escapeHtml(input.expiryText)
  const securityText = escapeHtml(input.securityText)
  const supportText = escapeHtml(SUPPORT_TEXT)

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7f6;color:#17201c;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f7f6;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:collapse;background:#ffffff;border:1px solid #dfe7e3;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#0b1411;color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-size:18px;font-weight:700;letter-spacing:0.2px;">
                      <span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:#10b981;margin-right:10px;vertical-align:middle;"></span>${BRAND_NAME}
                    </td>
                    <td align="right" style="font-size:12px;color:#a7f3d0;text-transform:uppercase;letter-spacing:1.4px;">
                      ${eyebrow}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 30px;">
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;font-weight:700;">
                  ${title}
                </h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">
                  ${intro}
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 28px;">
                  <tr>
                    <td style="border-radius:12px;background:#10b981;">
                      <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:16px;line-height:1;font-weight:700;border-radius:12px;">
                        ${actionLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="padding:16px 18px;border-radius:14px;background:#ecfdf5;border:1px solid #bbf7d0;margin:0 0 22px;">
                  <p style="margin:0;font-size:14px;line-height:1.55;color:#166534;">
                    ${expiryText}
                  </p>
                </div>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#64748b;">
                  ${securityText}
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                  Если кнопка не открывается, скопируйте ссылку:
                </p>
                <p style="margin:0;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#0f766e;word-break:break-all;">
                  <a href="${actionUrl}" style="color:#0f766e;text-decoration:none;">${actionUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  ${supportText}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function createAccountEmail(
  input: AccountEmailLayoutInput
): AccountEmailTemplate {
  return {
    subject: input.title,
    text: createTextEmail(input),
    html: createHtmlEmail(input),
  }
}

export function createPasswordResetEmail(
  input: PasswordResetTemplateInput
): AccountEmailTemplate {
  return createAccountEmail({
    preheader:
      'Ссылка для сброса пароля SmartSpend. Действует ограниченное время.',
    eyebrow: 'Безопасность',
    title: 'Сброс пароля SmartSpend',
    intro:
      'Мы получили запрос на смену пароля для вашего аккаунта. Нажмите кнопку ниже и задайте новый пароль.',
    actionLabel: 'Задать новый пароль',
    actionUrl: input.resetUrl,
    expiryText: `Ссылка действует ${input.expiresInMinutes} минут. После этого нужно будет запросить новую ссылку.`,
    securityText:
      'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш текущий пароль не изменится.',
  })
}

export function createEmailVerificationEmail(
  input: EmailVerificationTemplateInput
): AccountEmailTemplate {
  return createAccountEmail({
    preheader:
      'Подтвердите email, чтобы завершить настройку аккаунта SmartSpend.',
    eyebrow: 'Подтверждение',
    title: 'Подтвердите email SmartSpend',
    intro:
      'Остался последний шаг: подтвердите этот email, чтобы мы знали, куда отправлять важные уведомления аккаунта.',
    actionLabel: 'Подтвердить email',
    actionUrl: input.verifyUrl,
    expiryText: `Ссылка действует ${input.expiresInHours} часа. Если она истечет, запросите новое письмо в приложении.`,
    securityText:
      'Если вы не создавали аккаунт SmartSpend, просто проигнорируйте это письмо. Никаких действий не требуется.',
  })
}
