import NextAuth from 'next-auth'

import authConfig from '@/shared/auth/config'
import { getLoginPath, getSafeCallbackUrl } from '@/shared/lib/auth-redirect'

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
    // A Server Action request cannot follow a redirect to an HTML page; a
    // plain 401 lets the client classify it as an expired session.
    if (req.headers.has('next-action')) {
      return new Response(null, { status: 401 })
    }
    return Response.redirect(new URL(getLoginPath(req.nextUrl), req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|api/webhooks/resend|_next/static|_next/image|favicon.ico).*)',
  ],
}
