import { render, screen } from '@testing-library/react'

const mockVerifyEmail = jest.fn()

jest.mock('@/shared/api', () => ({
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
}))

import VerifyEmailPage from '../page'

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyEmail.mockResolvedValue('success')
  })

  it('verifies the token and shows success state', async () => {
    render(
      await VerifyEmailPage({
        params: Promise.resolve({ token: 'token-1' }),
      })
    )

    expect(mockVerifyEmail).toHaveBeenCalledWith('token-1')
    expect(screen.getByText('Email подтверждён')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Вернуться в приложение' })
    ).toHaveAttribute('href', '/')
  })

  it('shows expired state', async () => {
    mockVerifyEmail.mockResolvedValueOnce('expired')

    render(
      await VerifyEmailPage({
        params: Promise.resolve({ token: 'expired-token' }),
      })
    )

    expect(screen.getByText('Ссылка устарела')).toBeInTheDocument()
  })
})
