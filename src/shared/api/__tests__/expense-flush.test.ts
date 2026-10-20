import { auth } from '@/shared/auth'

import { deleteExpenseForUser } from '../expense-delete'
import {
  flushExpenseDeletes,
  MAX_FLUSH_EXPENSE_IDS,
  type FlushRequest,
} from '../expense-flush'

jest.mock('@/shared/auth', () => ({ auth: jest.fn() }))
jest.mock('../expense-delete', () => ({ deleteExpenseForUser: jest.fn() }))

const mockAuth = auth as unknown as jest.Mock
const mockDelete = deleteExpenseForUser as jest.Mock

const OWN = '11111111-1111-4111-8111-111111111111'
const FOREIGN = '22222222-2222-4222-8222-222222222222'
const PROJECT = '33333333-3333-4333-8333-333333333333'

function request(
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' }
): FlushRequest {
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    url: 'https://app.example/api/expenses/flush-deletes',
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => JSON.parse(raw),
  }
}

describe('flushExpenseDeletes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDelete.mockImplementation(async (id: string) => {
      if (id === FOREIGN) throw new Error('Expense not found')
      if (id === PROJECT) return { status: 'project_cash_negative' }
      return { status: 'deleted' }
    })
  })

  it('rejects a request without a session', async () => {
    mockAuth.mockResolvedValue(null)
    const response = await flushExpenseDeletes(request({ ids: [OWN] }))
    expect(response.status).toBe(401)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('rejects a cross-origin request', async () => {
    const response = await flushExpenseDeletes(
      request(
        { ids: [OWN] },
        {
          'content-type': 'application/json',
          origin: 'https://evil.example',
        }
      )
    )
    expect(response.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('accepts a same-origin request', async () => {
    const response = await flushExpenseDeletes(
      request(
        { ids: [OWN] },
        { 'content-type': 'application/json', origin: 'https://app.example' }
      )
    )
    expect(response.status).toBe(200)
  })

  it('rejects a body that is not JSON', async () => {
    expect(
      (
        await flushExpenseDeletes(
          request('ids', { 'content-type': 'text/plain' })
        )
      ).status
    ).toBe(415)
    expect((await flushExpenseDeletes(request('{'))).status).toBe(400)
    expect((await flushExpenseDeletes(request({ ids: 'x' }))).status).toBe(400)
    expect((await flushExpenseDeletes(request({ ids: [1] }))).status).toBe(400)
    expect(
      (
        await flushExpenseDeletes(
          request({ ids: Array(MAX_FLUSH_EXPENSE_IDS + 1).fill(OWN) })
        )
      ).status
    ).toBe(400)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes own expenses and skips temporary, malformed, foreign, and guarded ids', async () => {
    const response = await flushExpenseDeletes(
      request({ ids: [OWN, 'temp-1', 'not-a-uuid', FOREIGN, PROJECT, OWN] })
    )
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      deleted: [OWN],
      skipped: ['temp-1', 'not-a-uuid', FOREIGN, PROJECT],
    })
    expect(mockDelete).toHaveBeenCalledTimes(3)
    expect(mockDelete).toHaveBeenCalledWith(OWN, 'user-1')
    expect(mockDelete).not.toHaveBeenCalledWith('temp-1', expect.anything())
  })

  it('is safe to repeat', async () => {
    const first = await flushExpenseDeletes(request({ ids: [OWN] }))
    const second = await flushExpenseDeletes(request({ ids: [OWN] }))
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(second.body).toEqual({
      deleted: [OWN],
      skipped: [],
    })
  })
})
