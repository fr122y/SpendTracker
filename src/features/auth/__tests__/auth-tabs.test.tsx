import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignInSwitch = jest.fn()
const mockRegisterSwitch = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}))

jest.mock('@/features/auth/ui/credentials-sign-in-form', () => ({
  CredentialsSignInForm: ({
    onSwitchToRegister,
  }: {
    onSwitchToRegister?: () => void
  }) => (
    <div>
      <p>signin-form</p>
      <button
        type="button"
        onClick={() => {
          mockSignInSwitch()
          onSwitchToRegister?.()
        }}
      >
        switch-to-register
      </button>
    </div>
  ),
}))

jest.mock('@/features/auth/ui/register-form', () => ({
  RegisterForm: ({ onSwitchToSignIn }: { onSwitchToSignIn?: () => void }) => (
    <div>
      <p>register-form</p>
      <button
        type="button"
        onClick={() => {
          mockRegisterSwitch()
          onSwitchToSignIn?.()
        }}
      >
        switch-to-signin
      </button>
    </div>
  ),
}))

jest.mock('@/features/auth/ui/sign-in-button', () => ({
  SignInButton: () => <button type="button">google-button</button>,
}))

import { AuthTabs } from '@/features/auth/ui/auth-tabs'

describe('AuthTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows sign-in tab as active by default', () => {
    render(<AuthTabs />)

    expect(screen.getByRole('button', { name: 'Вход' })).toHaveClass(
      'text-emerald-400'
    )
    expect(screen.getByText('signin-form')).toBeInTheDocument()
  })

  it('switches to register form when register tab clicked', async () => {
    const user = userEvent.setup()
    render(<AuthTabs />)

    await user.click(screen.getByRole('button', { name: 'Регистрация' }))

    expect(screen.getByText('register-form')).toBeInTheDocument()
  })

  it('always keeps google sign-in button visible', async () => {
    const user = userEvent.setup()
    render(<AuthTabs />)

    expect(
      screen.getByRole('button', { name: 'google-button' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Регистрация' }))
    expect(
      screen.getByRole('button', { name: 'google-button' })
    ).toBeInTheDocument()
  })

  it('switches from sign-in child callback to register', async () => {
    const user = userEvent.setup()
    render(<AuthTabs />)

    await user.click(screen.getByRole('button', { name: 'switch-to-register' }))

    expect(mockSignInSwitch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('register-form')).toBeInTheDocument()
  })

  it('switches from register child callback to sign-in', async () => {
    const user = userEvent.setup()
    render(<AuthTabs />)
    await user.click(screen.getByRole('button', { name: 'Регистрация' }))
    await user.click(screen.getByRole('button', { name: 'switch-to-signin' }))

    expect(mockRegisterSwitch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('signin-form')).toBeInTheDocument()
  })
})
