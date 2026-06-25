const mockProcessResendAccountEmailWebhook = jest.fn()

jest.mock('@/shared/lib/account-email-webhooks', () => {
  class AccountEmailWebhookError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(message)
      this.name = 'AccountEmailWebhookError'
    }
  }

  return {
    AccountEmailWebhookError,
    processResendAccountEmailWebhook: (...args: unknown[]) =>
      mockProcessResendAccountEmailWebhook(...args),
  }
})

import { AccountEmailWebhookError } from '@/shared/lib/account-email-webhooks'

import { POST } from '../route'

describe('Resend account email webhook route', () => {
  const OriginalResponse = global.Response

  class TestResponse {
    public readonly status: number
    private readonly body: string

    constructor(body: string, init?: ResponseInit) {
      this.body = body
      this.status = init?.status ?? 200
    }

    async json() {
      return JSON.parse(this.body)
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.Response = TestResponse as unknown as typeof Response
    mockProcessResendAccountEmailWebhook.mockResolvedValue({
      status: 'processed',
      type: 'email.delivered',
    })
  })

  afterAll(() => {
    global.Response = OriginalResponse
  })

  it('passes the raw request body and headers to the processor', async () => {
    const headers = new Headers({ 'svix-id': 'msg_123' })
    const response = await POST({
      text: async () => '{"type":"email.delivered"}',
      headers,
    } as Request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      status: 'processed',
      type: 'email.delivered',
    })
    expect(mockProcessResendAccountEmailWebhook).toHaveBeenCalledWith({
      payload: '{"type":"email.delivered"}',
      headers,
    })
  })

  it('rejects invalid webhooks', async () => {
    mockProcessResendAccountEmailWebhook.mockRejectedValueOnce(
      new AccountEmailWebhookError('signature_error', 'Invalid webhook')
    )

    const response = await POST({
      text: async () => '{"type":"email.delivered"}',
      headers: new Headers(),
    } as Request)

    expect(response.status).toBe(400)
  })
})
