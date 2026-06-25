import NextAuth from 'next-auth'

import authConfig from '@/shared/auth/config'
import { getSafeCallbackUrl } from '@/shared/lib/auth-redirect'

const { auth } = NextAuth(authConfig)

function isPublicAuthRoute(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password/') ||
    pathname.startsWith('/verify-email/') ||
    pathname.startsWith('/invite/')
  )
}

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (pathname === '/login' && isLoggedIn) {
    const callbackUrl = getSafeCallbackUrl(
      req.nextUrl.searchParams.get('callbackUrl')
    )

    return Response.redirect(new URL(callbackUrl, req.nextUrl))
  }

  if (!isPublicAuthRoute(pathname) && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
