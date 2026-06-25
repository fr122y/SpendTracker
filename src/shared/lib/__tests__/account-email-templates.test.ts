import {
  createEmailVerificationEmail,
  createPasswordResetEmail,
} from '../account-email-templates'

describe('account email templates', () => {
  it('renders a password reset email with HTML, text, expiry, and fallback URL', () => {
    const resetUrl =
      'https://spendtracker.online/reset-password/token?next=/account&lang=ru'

    const email = createPasswordResetEmail({
      resetUrl,
      expiresInMinutes: 15,
    })

    expect(email.subject).toBe('Сброс пароля SmartSpend')
    expect(email.text).toContain('Задать новый пароль')
    expect(email.text).toContain(resetUrl)
    expect(email.text).toContain('Ссылка действует 15 минут')
    expect(email.text).toContain('Ваш текущий пароль не изменится')
    expect(email.html).toContain('<!doctype html>')
    expect(email.html).toContain('Задать новый пароль')
    expect(email.html).toContain('Ссылка действует 15 минут')
    expect(email.html).toContain(
      'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо'
    )
    expect(email.html).toContain(
      'https://spendtracker.online/reset-password/token?next=/account&amp;lang=ru'
    )
    expect(email.html).not.toContain('undefined')
    expect(email.html).not.toContain('null')
  })

  it('renders an email verification email with HTML, text, expiry, and fallback URL', () => {
    const verifyUrl =
      'https://spendtracker.online/verify-email/token?source=email&step=verify'

    const email = createEmailVerificationEmail({
      verifyUrl,
      expiresInHours: 24,
    })

    expect(email.subject).toBe('Подтвердите email SmartSpend')
    expect(email.text).toContain('Подтвердить email')
    expect(email.text).toContain(verifyUrl)
    expect(email.text).toContain('Ссылка действует 24 часа')
    expect(email.text).toContain('Если вы не создавали аккаунт SmartSpend')
    expect(email.html).toContain('<!doctype html>')
    expect(email.html).toContain('Подтвердить email')
    expect(email.html).toContain('Ссылка действует 24 часа')
    expect(email.html).toContain(
      'Если вы не создавали аккаунт SmartSpend, просто проигнорируйте это письмо'
    )
    expect(email.html).toContain(
      'https://spendtracker.online/verify-email/token?source=email&amp;step=verify'
    )
    expect(email.html).not.toContain('undefined')
    expect(email.html).not.toContain('null')
  })

  it('escapes user-controlled URLs in HTML output', () => {
    const email = createPasswordResetEmail({
      resetUrl: 'https://example.com/reset?token=<bad>"value"&next=/',
      expiresInMinutes: 15,
    })

    expect(email.text).toContain(
      'https://example.com/reset?token=<bad>"value"&next=/'
    )
    expect(email.html).toContain(
      'https://example.com/reset?token=&lt;bad&gt;&quot;value&quot;&amp;next=/'
    )
    expect(email.html).not.toContain('<bad>')
  })
})
