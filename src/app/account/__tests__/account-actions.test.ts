const mockSignOut = jest.fn()

jest.mock('@/shared/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

import { signOutCurrentUser } from '../actions'

describe('signOutCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signs out and redirects to login', async () => {
    await signOutCurrentUser()

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })
})
