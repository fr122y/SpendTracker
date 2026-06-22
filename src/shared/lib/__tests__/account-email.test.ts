jest.mock('resend', () => {
  const send = jest.fn()
  const Resend = jest.fn(() => ({
    emails: {
      send,
    },
  }))

  return { Resend, __mocks: { send } }
})

import {
  AccountEmailError,
  sendAccountEmail,
  type SendAccountEmailInput,
} from '../account-email'

describe('sendAccountEmail', () => {
  const originalEnv = process.env
  const originalConsoleInfo = console.info
  const resendModule = jest.requireMock('resend') as {
    Resend: jest.Mock
    __mocks: {
      send: jest.Mock
    }
  }

  const baseInput: SendAccountEmailInput = {
    type: 'auth.reset_password',
    to: 'user@example.com',
    subject: 'Reset your password',
    text: 'Reset link',
    html: '<p>Reset link</p>',
    idempotencyKey: 'auth.reset_password:user-1:token-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      RESEND_API_KEY: 're_test',
      ACCOUNT_EMAIL_FROM: 'SmartSpend <noreply@mail.example.com>',
      ACCOUNT_EMAIL_REPLY_TO: 'support@example.com',
    }
    console.info = jest.fn()
    resendModule.__mocks.send.mockResolvedValue({
      data: { id: 'email-1' },
      error: null,
      headers: null,
    })
  })

  afterAll(() => {
    process.env = originalEnv
    console.info = originalConsoleInfo
  })

  it('sends account email through Resend with idempotency key', async () => {
    const result = await sendAccountEmail(baseInput)

    expect(resendModule.Resend).toHaveBeenCalledWith('re_test')
    expect(resendModule.__mocks.send).toHaveBeenCalledWith(
      {
        from: 'SmartSpend <noreply@mail.example.com>',
        to: 'user@example.com',
        subject: 'Reset your password',
        text: 'Reset link',
        html: '<p>Reset link</p>',
        replyTo: 'support@example.com',
      },
      { idempotencyKey: 'auth.reset_password:user-1:token-1' }
    )
    expect(result).toEqual({
      status: 'sent',
      provider: 'resend',
      providerMessageId: 'email-1',
    })
  })

  it('uses input replyTo over environment fallback', async () => {
    await sendAccountEmail({
      ...baseInput,
      replyTo: 'security@example.com',
    })

    expect(resendModule.__mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'security@example.com',
      }),
      expect.any(Object)
    )
  })

  it('omits replyTo when neither input nor environment provides it', async () => {
    delete process.env.ACCOUNT_EMAIL_REPLY_TO

    await sendAccountEmail(baseInput)

    expect(resendModule.__mocks.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ replyTo: expect.anything() }),
      expect.any(Object)
    )
  })

  it('returns dev_logged in non-production without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY

    const result = await sendAccountEmail(baseInput)

    expect(result).toEqual({ status: 'dev_logged', provider: 'console' })
    expect(resendModule.Resend).not.toHaveBeenCalled()
    expect(console.info).toHaveBeenCalledWith('[account-email:dev]', {
      type: 'auth.reset_password',
      to: 'user@example.com',
      subject: 'Reset your password',
      idempotencyKey: 'auth.reset_password:user-1:token-1',
    })
  })

  it('throws configuration_error in production without RESEND_API_KEY', async () => {
    process.env = { ...process.env, NODE_ENV: 'production' }
    delete process.env.RESEND_API_KEY

    await expect(sendAccountEmail(baseInput)).rejects.toMatchObject({
      code: 'configuration_error',
      message: 'RESEND_API_KEY is required to send account emails',
    })
    expect(resendModule.Resend).not.toHaveBeenCalled()
  })

  it('throws configuration_error for real send without ACCOUNT_EMAIL_FROM', async () => {
    delete process.env.ACCOUNT_EMAIL_FROM

    await expect(sendAccountEmail(baseInput)).rejects.toMatchObject({
      code: 'configuration_error',
      message: 'ACCOUNT_EMAIL_FROM is required to send account emails',
    })
    expect(resendModule.Resend).not.toHaveBeenCalled()
  })

  it('throws invalid_input for empty required fields', async () => {
    await expect(
      sendAccountEmail({ ...baseInput, subject: '   ' })
    ).rejects.toMatchObject({
      code: 'invalid_input',
      message: 'Account email subject is required',
    })
    expect(resendModule.Resend).not.toHaveBeenCalled()
  })

  it('throws invalid_input for idempotency keys over 256 chars', async () => {
    await expect(
      sendAccountEmail({ ...baseInput, idempotencyKey: 'x'.repeat(257) })
    ).rejects.toMatchObject({
      code: 'invalid_input',
      message: 'Account email idempotencyKey must be at most 256 characters',
    })
    expect(resendModule.Resend).not.toHaveBeenCalled()
  })

  it('throws invalid_input for unsupported account email types', async () => {
    await expect(
      sendAccountEmail({
        ...baseInput,
        type: 'marketing.digest' as SendAccountEmailInput['type'],
      })
    ).rejects.toMatchObject({
      code: 'invalid_input',
      message: 'Unsupported account email type: marketing.digest',
    })
    expect(resendModule.Resend).not.toHaveBeenCalled()
  })

  it('throws provider_error when Resend returns an error', async () => {
    resendModule.__mocks.send.mockResolvedValue({
      data: null,
      error: {
        name: 'rate_limit_exceeded',
        message: 'Too many requests',
        statusCode: 429,
      },
      headers: null,
    })

    await expect(sendAccountEmail(baseInput)).rejects.toMatchObject({
      code: 'provider_error',
      message: 'Too many requests',
    })
  })

  it('throws provider_error when Resend throws', async () => {
    resendModule.__mocks.send.mockRejectedValue(new Error('Network timeout'))

    await expect(sendAccountEmail(baseInput)).rejects.toMatchObject({
      code: 'provider_error',
      message: 'Network timeout',
    })
  })

  it('throws provider_error when Resend returns success without id', async () => {
    resendModule.__mocks.send.mockResolvedValue({
      data: {},
      error: null,
      headers: null,
    })

    await expect(sendAccountEmail(baseInput)).rejects.toMatchObject({
      code: 'provider_error',
      message: 'Resend did not return an account email message id',
    })
  })

  it('uses AccountEmailError for normalized failures', async () => {
    await expect(
      sendAccountEmail({ ...baseInput, to: '' })
    ).rejects.toBeInstanceOf(AccountEmailError)
  })
})
