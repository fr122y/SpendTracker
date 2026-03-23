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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }

      return token
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
      }

      return session
    },
  },
  events: {
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
