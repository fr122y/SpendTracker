import NextAuth from 'next-auth'

import authConfig from '@/shared/auth/config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (pathname === '/login' && isLoggedIn) {
    return Response.redirect(new URL('/', req.nextUrl))
  }

  if (pathname !== '/login' && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
