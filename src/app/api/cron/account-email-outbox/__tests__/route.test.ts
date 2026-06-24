const mockProcessAccountEmailOutbox = jest.fn()

jest.mock('@/shared/lib/account-email-outbox', () => ({
  processAccountEmailOutbox: () => mockProcessAccountEmailOutbox(),
}))

import { GET } from '../route'

describe('account email outbox cron route', () => {
  const originalEnv = process.env
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
    process.env = { ...originalEnv, CRON_SECRET: 'secret' }
    mockProcessAccountEmailOutbox.mockResolvedValue({
      processed: 1,
      sent: 1,
      retried: 0,
      failed: 0,
      skipped: 0,
    })
  })

  afterAll(() => {
    process.env = originalEnv
    global.Response = OriginalResponse
  })

  it('rejects requests without the cron secret', async () => {
    const response = await GET({
      headers: new Headers(),
    } as Request)

    expect(response.status).toBe(401)
    expect(mockProcessAccountEmailOutbox).not.toHaveBeenCalled()
  })

  it('processes the outbox with a valid cron secret', async () => {
    const response = await GET({
      headers: new Headers({ authorization: 'Bearer secret' }),
    } as Request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      processed: 1,
      sent: 1,
      retried: 0,
      failed: 0,
      skipped: 0,
    })
  })
})
