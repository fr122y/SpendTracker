import { getLoginPath } from '../auth-redirect'

describe('getLoginPath', () => {
  it('returns to the requested page after sign-in', () => {
    expect(getLoginPath({ pathname: '/account', search: '' })).toBe(
      '/login?callbackUrl=%2Faccount'
    )
    expect(getLoginPath({ pathname: '/invite-x', search: '?a=1' })).toBe(
      '/login?callbackUrl=%2Finvite-x%3Fa%3D1'
    )
  })

  it('needs no callbackUrl for the dashboard', () => {
    expect(getLoginPath({ pathname: '/', search: '' })).toBe('/login')
  })
})
