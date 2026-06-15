import NextAuth from 'next-auth'

import authConfig from '@/shared/auth/config'
import { getSafeCallbackUrl } from '@/shared/lib/auth-redirect'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isInvitePage = pathname.startsWith('/invite/')

  if (pathname === '/login' && isLoggedIn) {
    const callbackUrl = getSafeCallbackUrl(
      req.nextUrl.searchParams.get('callbackUrl')
    )

    return Response.redirect(new URL(callbackUrl, req.nextUrl))
  }

  if (pathname !== '/login' && !isInvitePage && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
