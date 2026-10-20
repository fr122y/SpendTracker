const mockAuthFresh = jest.fn()
const mockRedirect = jest.fn()
const mockEmailStatus = jest.fn()

jest.mock('@/shared/auth', () => ({
  authFresh: (...args: unknown[]) => mockAuthFresh(...args),
}))

jest.mock('@/shared/api', () => ({
  getCurrentEmailVerificationStatus: (...args: unknown[]) =>
    mockEmailStatus(...args),
}))

jest.mock('@/_pages/dashboard', () => ({
  DashboardDynamic: () => null,
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

import Home from '../page'

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
    mockEmailStatus.mockResolvedValue({ requiresVerification: false })
  })

  it('sends an ended session to the login page', async () => {
    mockAuthFresh.mockResolvedValue(null)

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockEmailStatus).not.toHaveBeenCalled()
  })

  it('renders the dashboard for an active session', async () => {
    mockAuthFresh.mockResolvedValue({ user: { id: 'user-1' } })

    await expect(Home()).resolves.toBeTruthy()
  })
})
