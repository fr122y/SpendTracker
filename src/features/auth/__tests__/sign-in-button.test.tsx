import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignIn = jest.fn()

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

import { SignInButton } from '@/features/auth/ui/sign-in-button'

describe('SignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts Google sign-in with callback URL', async () => {
    const user = userEvent.setup()
    render(<SignInButton callbackUrl="/invite/token-1" />)

    await user.click(screen.getByRole('button', { name: 'Войти через Google' }))

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/invite/token-1',
    })
  })
})
