import 'server-only'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

import { accounts, db, sessions, users, verificationTokens } from '@/shared/db'

import authConfig from './config'
import { seedUserDefaults } from './seed-defaults'
import {
  forgetUserSessionChecks,
  issueSessionClaims,
  revokeSession,
  validateSessionToken,
  withSessionCheck,
} from './session-revocation'

import type { Session } from 'next-auth'

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string'
            ? credentials.email.trim().toLowerCase()
            : ''
        const password =
          typeof credentials?.password === 'string' ? credentials.password : ''

        if (!email || !password) {
          return null
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user?.password) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== 'google') {
        return true
      }

      const email = typeof profile?.email === 'string' ? profile.email : ''

      if (!email) {
        return true
      }

      const normalizedEmail = email.trim().toLowerCase()
      const [existingUser] = await db
        .select({ id: users.id, password: users.password })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      // Prevent auto-linking for credentials-created users.
      if (existingUser?.password) {
        return '/login?error=UseCredentialsSignIn'
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      // Sign-in: a new session id and the user's current session version.
      if (user?.id) {
        return issueSessionClaims(token, user.id)
      }

      // Account page name change refreshes the JWT through `unstable_update`.
      if (trigger === 'update' && typeof session?.user?.name === 'string') {
        token.name = session.user.name
      }

      // Node runtime only: the edge middleware uses `config.ts` without this
      // callback. `null` ends the session (signed out or password changed).
      return validateSessionToken(token)
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
      }

      return session
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message) {
        await revokeSession(message.token)
      }
    },
    async createUser({ user }) {
      const userId = user.id

      if (!userId) {
        throw new Error('Missing user id during auth seeding')
      }

      await db.transaction(async (tx) => {
        await seedUserDefaults(tx, userId)
      })
    },
  },
})

export const { GET, POST } = handlers

/**
 * `auth()` that checks the session against the database now, without the
 * re-check window. For sensitive pages and actions.
 */
export function authFresh(): Promise<Session | null> {
  return withSessionCheck('force', () => auth())
}

/**
 * After the user's session version was bumped (password change), keeps the
 * current browser signed in: its token adopts the new version. Every other
 * token of the user stops working.
 */
export async function keepCurrentSessionAfterVersionBump(
  userId: string
): Promise<void> {
  forgetUserSessionChecks(userId)
  await withSessionCheck('adopt-version', () => unstable_update({}))
}

export { forgetUserSessionChecks } from './session-revocation'
export { nextSessionVersion } from './session-store'

export { getAccountProfile, type AccountProfile } from './account-profile'
