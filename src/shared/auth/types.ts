import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
    /** Session id, revoked on sign-out. */
    sid?: string
    /** The user's session version when the token was issued or adopted. */
    sv?: number
    /** When the session was last checked against the database (ms). */
    checkedAt?: number
  }
}

export {}
