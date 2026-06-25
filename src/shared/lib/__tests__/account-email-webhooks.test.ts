const mockVerify = jest.fn()
const mockSuppressAccountEmailRecipient = jest.fn()
const mockNormalizeAccountEmailRecipient = jest.fn((email: string) =>
  email.trim().toLowerCase()
)
const mockEq = jest.fn((left: unknown, right: unknown) => ['eq', left, right])

const mockSelectLimit = jest.fn()
const mockSelectWhere = jest.fn(() => ({ limit: mockSelectLimit }))
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }))
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }))

const mockInsertReturning = jest.fn()
const mockOnConflictDoNothing = jest.fn(() => ({
  returning: mockInsertReturning,
}))
const mockInsertValues = jest.fn(() => ({
  onConflictDoNothing: mockOnConflictDoNothing,
}))
const mockInsert = jest.fn(() => ({ values: mockInsertValues }))

const mockUpdateWhere = jest.fn()
const mockUpdateSet = jest.fn(() => ({ where: mockUpdateWhere }))
const mockUpdate = jest.fn(() => ({ set: mockUpdateSet }))

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    webhooks: {
      verify: (...args: unknown[]) => mockVerify(...args),
    },
  })),
}))

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => mockEq(left, right),
}))

jest.mock('@/shared/db', () => ({
  accountEmailEvents: {
    id: 'accountEmailEvents.id',
    providerEventId: 'accountEmailEvents.providerEventId',
  },
  accountEmailMessages: {
    id: 'accountEmailMessages.id',
    providerMessageId: 'accountEmailMessages.providerMessageId',
  },
  db: {
    select: () => mockSelect(),
    insert: () => mockInsert(),
    update: () => mockUpdate(),
  },
}))

jest.mock('../account-email-suppression', () => ({
  normalizeAccountEmailRecipient: (...args: [string]) =>
    mockNormalizeAccountEmailRecipient(...args),
  suppressAccountEmailRecipient: (...args: unknown[]) =>
    mockSuppressAccountEmailRecipient(...args),
}))

import {
  AccountEmailWebhookError,
  processResendAccountEmailWebhook,
} from '../account-email-webhooks'

describe('account email webhooks', () => {
  const originalEnv = process.env
  const now = new Date('2026-06-25T10:00:00.000Z')
  const headers = new Headers({
    'svix-id': 'msg_123',
    'svix-timestamp': '1792922400',
    'svix-signature': 'v1,signature',
  })
  const deliveredEvent = {
    type: 'email.delivered',
    created_at: '2026-06-25T09:59:00.000Z',
    data: {
      created_at: '2026-06-25T09:58:00.000Z',
      email_id: 'resend-email-1',
      from: 'SmartSpend <noreply@mail.spendtracker.online>',
      to: ['USER@example.com'],
      subject: 'Verify email',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      RESEND_WEBHOOK_SECRET: 'whsec_test',
    }
    mockVerify.mockReturnValue(deliveredEvent)
    mockSelectLimit.mockResolvedValue([{ id: 'message-1' }])
    mockInsertReturning.mockResolvedValue([{ id: 'event-1' }])
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSuppressAccountEmailRecipient.mockResolvedValue(undefined)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('verifies the raw payload and stores delivered events', async () => {
    const result = await processResendAccountEmailWebhook({
      payload: '{"type":"email.delivered"}',
      headers,
      now,
    })

    expect(result).toEqual({
      status: 'processed',
      type: 'email.delivered',
    })
    expect(mockVerify).toHaveBeenCalledWith({
      payload: '{"type":"email.delivered"}',
      headers: {
        id: 'msg_123',
        timestamp: '1792922400',
        signature: 'v1,signature',
      },
      webhookSecret: 'whsec_test',
    })
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'resend',
        providerEventId: 'msg_123',
        type: 'email.delivered',
        providerMessageId: 'resend-email-1',
        recipientEmail: 'user@example.com',
        accountEmailMessageId: 'message-1',
        payloadJson: deliveredEvent,
        reason: null,
        createdAt: new Date('2026-06-25T09:59:00.000Z'),
        receivedAt: now,
      })
    )
    expect(mockUpdateSet).toHaveBeenCalledWith({
      status: 'delivered',
      lastError: null,
      updatedAt: now,
    })
    expect(mockSuppressAccountEmailRecipient).not.toHaveBeenCalled()
  })

  it('stores failed reasons and updates message status', async () => {
    mockVerify.mockReturnValueOnce({
      ...deliveredEvent,
      type: 'email.failed',
      data: {
        ...deliveredEvent.data,
        failed: { reason: 'Invalid recipient' },
      },
    })

    const result = await processResendAccountEmailWebhook({
      payload: '{"type":"email.failed"}',
      headers,
      now,
    })

    expect(result.status).toBe('processed')
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'email.failed',
        reason: 'Invalid recipient',
      })
    )
    expect(mockUpdateSet).toHaveBeenCalledWith({
      status: 'failed',
      lastError: 'Invalid recipient',
      updatedAt: now,
    })
  })

  it('adds bounced recipients to suppression list', async () => {
    mockVerify.mockReturnValueOnce({
      ...deliveredEvent,
      type: 'email.bounced',
      data: {
        ...deliveredEvent.data,
        bounce: {
          message: 'Mailbox unavailable',
          subType: 'General',
          type: 'Permanent',
        },
      },
    })

    await processResendAccountEmailWebhook({
      payload: '{"type":"email.bounced"}',
      headers,
      now,
    })

    expect(mockUpdateSet).toHaveBeenCalledWith({
      status: 'bounced',
      lastError: 'Mailbox unavailable',
      updatedAt: now,
    })
    expect(mockSuppressAccountEmailRecipient).toHaveBeenCalledWith({
      email: 'user@example.com',
      reason: 'bounced',
      source: 'resend_webhook',
      providerMessageId: 'resend-email-1',
      now,
    })
  })

  it('adds complained recipients to suppression list', async () => {
    mockVerify.mockReturnValueOnce({
      ...deliveredEvent,
      type: 'email.complained',
    })

    await processResendAccountEmailWebhook({
      payload: '{"type":"email.complained"}',
      headers,
      now,
    })

    expect(mockUpdateSet).toHaveBeenCalledWith({
      status: 'complained',
      lastError: 'Recipient marked the email as spam',
      updatedAt: now,
    })
    expect(mockSuppressAccountEmailRecipient).toHaveBeenCalledWith({
      email: 'user@example.com',
      reason: 'complained',
      source: 'resend_webhook',
      providerMessageId: 'resend-email-1',
      now,
    })
  })

  it('adds provider-suppressed recipients to suppression list', async () => {
    mockVerify.mockReturnValueOnce({
      ...deliveredEvent,
      type: 'email.suppressed',
      data: {
        ...deliveredEvent.data,
        suppressed: {
          message: 'Recipient is suppressed',
          type: 'manual',
        },
      },
    })

    await processResendAccountEmailWebhook({
      payload: '{"type":"email.suppressed"}',
      headers,
      now,
    })

    expect(mockUpdateSet).toHaveBeenCalledWith({
      status: 'suppressed',
      lastError: 'Recipient is suppressed',
      updatedAt: now,
    })
    expect(mockSuppressAccountEmailRecipient).toHaveBeenCalledWith({
      email: 'user@example.com',
      reason: 'suppressed',
      source: 'resend_webhook',
      providerMessageId: 'resend-email-1',
      now,
    })
  })

  it('ignores duplicate webhook deliveries', async () => {
    mockInsertReturning.mockResolvedValueOnce([])

    const result = await processResendAccountEmailWebhook({
      payload: '{"type":"email.delivered"}',
      headers,
      now,
    })

    expect(result).toEqual({
      status: 'duplicate',
      type: 'email.delivered',
    })
    expect(mockUpdateSet).not.toHaveBeenCalled()
    expect(mockSuppressAccountEmailRecipient).not.toHaveBeenCalled()
  })

  it('ignores unsupported verified events', async () => {
    mockVerify.mockReturnValueOnce({
      ...deliveredEvent,
      type: 'email.opened',
    })

    const result = await processResendAccountEmailWebhook({
      payload: '{"type":"email.opened"}',
      headers,
      now,
    })

    expect(result).toEqual({
      status: 'ignored',
      type: 'email.opened',
    })
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('rejects invalid signatures without writing data', async () => {
    mockVerify.mockImplementationOnce(() => {
      throw new Error('invalid signature')
    })

    await expect(
      processResendAccountEmailWebhook({
        payload: '{"type":"email.delivered"}',
        headers,
        now,
      })
    ).rejects.toBeInstanceOf(AccountEmailWebhookError)

    expect(mockInsertValues).not.toHaveBeenCalled()
    expect(mockUpdateSet).not.toHaveBeenCalled()
  })
})
