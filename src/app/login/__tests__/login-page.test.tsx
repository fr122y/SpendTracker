import { render, screen } from '@testing-library/react'

const mockAuthFresh = jest.fn()
const mockRedirect = jest.fn()

jest.mock('@/shared/auth', () => ({
  authFresh: (...args: unknown[]) => mockAuthFresh(...args),
}))

jest.mock('@/features/auth', () => ({
  AuthTabs: () => <form aria-label="Вход" />,
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

import LoginPage from '../page'

const params = (callbackUrl?: string) => ({
  searchParams: Promise.resolve(callbackUrl ? { callbackUrl } : {}),
})

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
  })

  it('shows the form when the session was rejected', async () => {
    mockAuthFresh.mockResolvedValue(null)

    render(await LoginPage(params('/account')))

    expect(screen.getByRole('form', { name: 'Вход' })).toBeInTheDocument()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('sends a signed-in user to the safe callback page', async () => {
    mockAuthFresh.mockResolvedValue({ user: { id: 'user-1' } })

    await expect(LoginPage(params('/account'))).rejects.toThrow(
      'NEXT_REDIRECT:/account'
    )
  })

  it('ignores an external callback url', async () => {
    mockAuthFresh.mockResolvedValue({ user: { id: 'user-1' } })

    await expect(LoginPage(params('//evil.example'))).rejects.toThrow(
      'NEXT_REDIRECT:/'
    )
  })
})
