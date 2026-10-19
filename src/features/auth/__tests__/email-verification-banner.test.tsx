import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockResendEmailVerification = jest.fn()

jest.mock('@/shared/api', () => ({
  resendEmailVerification: (...args: unknown[]) =>
    mockResendEmailVerification(...args),
}))

import {
  EMAIL_BANNER_DISMISSED_KEY,
  EmailVerificationBanner,
} from '@/features/auth/ui/email-verification-banner'

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.sessionStorage.clear()
    mockResendEmailVerification.mockResolvedValue({
      success: true,
      message: 'Мы отправили письмо для подтверждения email.',
    })
  })

  it('renders unverified email state', () => {
    render(<EmailVerificationBanner email="user@example.com" />)

    expect(screen.getByText('Подтвердите email')).toBeInTheDocument()
    expect(screen.getByText(/user@example.com/)).toBeInTheDocument()
  })

  it('resends verification email and shows success', async () => {
    const user = userEvent.setup()
    render(<EmailVerificationBanner email="user@example.com" />)

    await user.click(screen.getByRole('button', { name: 'Отправить ещё раз' }))

    expect(mockResendEmailVerification).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText('Мы отправили письмо для подтверждения email.')
    ).toBeInTheDocument()
  })

  it('shows resend errors', async () => {
    mockResendEmailVerification.mockResolvedValueOnce({
      success: false,
      error: 'Не удалось отправить письмо. Попробуйте ещё раз',
    })
    const user = userEvent.setup()
    render(<EmailVerificationBanner email="user@example.com" />)

    await user.click(screen.getByRole('button', { name: 'Отправить ещё раз' }))

    expect(
      await screen.findByText('Не удалось отправить письмо. Попробуйте ещё раз')
    ).toBeInTheDocument()
  })

  it('hides for the rest of the session when dismissed', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <EmailVerificationBanner email="user@example.com" />
    )

    await user.click(screen.getByRole('button', { name: 'Скрыть напоминание' }))

    expect(screen.queryByText('Подтвердите email')).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(EMAIL_BANNER_DISMISSED_KEY)).toBe('1')

    // A later page view in the same session keeps it hidden
    unmount()
    render(<EmailVerificationBanner email="user@example.com" />)
    expect(screen.queryByText('Подтвердите email')).not.toBeInTheDocument()
  })

  it('shows again in a new session', () => {
    window.sessionStorage.removeItem(EMAIL_BANNER_DISMISSED_KEY)

    render(<EmailVerificationBanner email="user@example.com" />)

    expect(screen.getByText('Подтвердите email')).toBeInTheDocument()
  })
})
