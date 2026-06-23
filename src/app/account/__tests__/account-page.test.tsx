import { render, screen } from '@testing-library/react'

const mockAuth = jest.fn()
const mockGetAccountProfile = jest.fn()
const mockRedirect = jest.fn()

jest.mock('@/shared/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  getAccountProfile: (...args: unknown[]) => mockGetAccountProfile(...args),
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

jest.mock('../actions', () => ({
  signOutCurrentUser: jest.fn(),
}))

import AccountPage from '../page'

describe('AccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockGetAccountProfile.mockResolvedValue({
      id: 'user-1',
      name: 'Ilya',
      email: 'ilya@example.com',
      provider: 'Credentials',
    })
  })

  it('renders current account information', async () => {
    render(await AccountPage())

    expect(
      screen.getByRole('heading', { name: 'Личный кабинет' })
    ).toBeInTheDocument()
    expect(screen.getByText('Ilya')).toBeInTheDocument()
    expect(screen.getByText('ilya@example.com')).toBeInTheDocument()
    expect(screen.getByText('Credentials')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('redirects logged-out users to login', async () => {
    mockAuth.mockResolvedValueOnce(null)

    await expect(AccountPage()).rejects.toThrow('NEXT_REDIRECT:/login')

    expect(mockRedirect).toHaveBeenCalledWith('/login')
    expect(mockGetAccountProfile).not.toHaveBeenCalled()
  })

  it('redirects when account profile is missing', async () => {
    mockGetAccountProfile.mockResolvedValueOnce(null)

    await expect(AccountPage()).rejects.toThrow('NEXT_REDIRECT:/login')

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
