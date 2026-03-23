import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignIn = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}))

import { CredentialsSignInForm } from '@/features/auth/ui/credentials-sign-in-form'

describe('CredentialsSignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    render(<CredentialsSignInForm />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument()
  })

  it('shows error on failed sign-in', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'CredentialsSignin', ok: false })

    const user = userEvent.setup()
    render(<CredentialsSignInForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Неверный email или пароль')
    ).toBeInTheDocument()
  })

  it('redirects to root on successful sign-in', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: true })

    const user = userEvent.setup()
    render(<CredentialsSignInForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('disables submit button while submitting', async () => {
    let resolveSignIn: (value: unknown) => void = () => {}
    mockSignIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve
        })
    )

    render(<CredentialsSignInForm />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Войти' }).closest('form')!
    )

    expect(screen.getByRole('button', { name: 'Вход...' })).toBeDisabled()

    resolveSignIn({ error: 'CredentialsSignin' })
    await screen.findByRole('button', { name: 'Войти' })
  })

  it('calls onSwitchToRegister when footer link clicked', async () => {
    const onSwitchToRegister = jest.fn()
    const user = userEvent.setup()

    render(<CredentialsSignInForm onSwitchToRegister={onSwitchToRegister} />)

    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(onSwitchToRegister).toHaveBeenCalledTimes(1)
  })
})
