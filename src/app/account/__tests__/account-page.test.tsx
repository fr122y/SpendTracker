import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockAuth = jest.fn()
const mockGetAccountProfile = jest.fn()
const mockRedirect = jest.fn()
const mockUpdateAccountName = jest.fn()
const mockRefresh = jest.fn()

jest.mock('@/features/auth', () => ({
  PasswordInput: ({ placeholder }: { placeholder: string }) => (
    <input placeholder={placeholder} readOnly />
  ),
}))

jest.mock('@/shared/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  getAccountProfile: (...args: unknown[]) => mockGetAccountProfile(...args),
}))

jest.mock('../actions', () => ({
  signOutCurrentUser: jest.fn(),
  updateAccountName: (...args: unknown[]) => mockUpdateAccountName(...args),
  changeAccountPassword: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  useRouter: () => ({ refresh: mockRefresh }),
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
      provider: 'Email и пароль',
      hasPassword: true,
    })
  })

  it('renders current account information', async () => {
    render(await AccountPage())

    expect(
      screen.getByRole('heading', { name: 'Личный кабинет' })
    ).toBeInTheDocument()
    expect(screen.getByText('Ilya')).toBeInTheDocument()
    expect(screen.getByText('ilya@example.com')).toBeInTheDocument()
    expect(screen.getByText('Email и пароль')).toBeInTheDocument()
    expect(screen.getByText('Аккаунт')).toBeInTheDocument()
    expect(screen.queryByText('Account')).not.toBeInTheDocument()
    expect(screen.getByText(/вернёт вас на страницу входа/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ilya')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Текущий пароль')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Новый пароль')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Повторите новый пароль')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('shows the saved name in the summary without a reload', async () => {
    mockUpdateAccountName.mockResolvedValueOnce({ success: true })
    render(await AccountPage())

    fireEvent.change(screen.getByDisplayValue('Ilya'), {
      target: { value: '  Новое имя  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить имя' }))

    await waitFor(() =>
      expect(screen.getByText('Имя сохранено')).toBeInTheDocument()
    )
    expect(mockUpdateAccountName).toHaveBeenCalledWith({
      name: '  Новое имя  ',
    })
    expect(
      screen.getByText('Новое имя', { selector: 'dd' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Ilya', { selector: 'dd' })).toBeNull()
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('hides the password form for accounts without a password', async () => {
    mockGetAccountProfile.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Ilya',
      email: 'ilya@example.com',
      provider: 'Google',
      hasPassword: false,
    })

    render(await AccountPage())

    expect(screen.queryByPlaceholderText('Текущий пароль')).toBeNull()
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
