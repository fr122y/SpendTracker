import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockResetPassword = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('@/shared/api', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}))

import { ResetPasswordForm } from '@/features/auth/ui/reset-password-form'

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects mismatched passwords without calling the server action', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm token="token-1" />)

    await user.type(screen.getByPlaceholderText('Новый пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Повторите пароль'),
      'password124'
    )
    await user.click(
      screen.getByRole('button', { name: 'Сохранить новый пароль' })
    )

    expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('redirects to login after a successful reset', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true })

    const user = userEvent.setup()
    render(<ResetPasswordForm token="token-1" />)

    await user.type(screen.getByPlaceholderText('Новый пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Повторите пароль'),
      'password123'
    )
    await user.click(
      screen.getByRole('button', { name: 'Сохранить новый пароль' })
    )

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'token-1',
        password: 'password123',
      })
      expect(mockPush).toHaveBeenCalledWith('/login?reset=success')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows server action errors and keeps the user on the form', async () => {
    mockResetPassword.mockResolvedValueOnce({
      success: false,
      error: 'Срок действия ссылки истёк',
    })

    const user = userEvent.setup()
    render(<ResetPasswordForm token="token-1" />)

    await user.type(screen.getByPlaceholderText('Новый пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Повторите пароль'),
      'password123'
    )
    await user.click(
      screen.getByRole('button', { name: 'Сохранить новый пароль' })
    )

    expect(
      await screen.findByText('Срок действия ссылки истёк')
    ).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('toggles new password visibility without clearing the value', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm token="token-1" />)

    const passwordInput = screen.getByPlaceholderText('Новый пароль')

    await user.type(passwordInput, 'password123')
    await user.click(
      screen.getByRole('button', { name: 'Показать новый пароль' })
    )

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(passwordInput).toHaveValue('password123')
  })
})
