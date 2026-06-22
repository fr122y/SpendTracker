import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockRequestPasswordReset = jest.fn()

jest.mock('@/shared/api', () => ({
  requestPasswordReset: (...args: unknown[]) =>
    mockRequestPasswordReset(...args),
}))

import { ForgotPasswordForm } from '@/features/auth/ui/forgot-password-form'

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requests a password reset and shows neutral success', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({
      success: true,
      message:
        'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.',
    })

    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Отправить ссылку' }))

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
      })
    })
    expect(
      screen.getByText(
        'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.'
      )
    ).toBeInTheDocument()
  })

  it('shows validation errors returned by the server action', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({
      success: false,
      error: 'Некорректный email',
    })

    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'invalid@example')
    await user.click(screen.getByRole('button', { name: 'Отправить ссылку' }))

    expect(await screen.findByText('Некорректный email')).toBeInTheDocument()
  })

  it('links back to login', () => {
    render(<ForgotPasswordForm />)

    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute(
      'href',
      '/login'
    )
  })
})
