import 'server-only'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'

import {
  accounts,
  allocationBuckets,
  categories,
  db,
  layoutConfigs,
  sessions,
  userSettings,
  users,
  verificationTokens,
} from '@/shared/db'

import authConfig from './config'

import type { LayoutConfig } from '@/shared/types'

const DEFAULT_CATEGORIES = [
  { name: 'Продукты', emoji: '🛒' },
  { name: 'Транспорт', emoji: '🚕' },
  { name: 'Еда', emoji: '☕' },
  { name: 'Здоровье', emoji: '💊' },
  { name: 'Развлечения', emoji: '🎬' },
  { name: 'Другое', emoji: '📝' },
]

const DEFAULT_BUCKETS = [
  { label: 'Накопления', percentage: 20 },
  { label: 'Инвестиции', percentage: 10 },
]

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
        await tx.insert(categories).values(
          DEFAULT_CATEGORIES.map((category) => ({
            id: crypto.randomUUID(),
            userId,
            ...category,
          }))
        )

        await tx.insert(allocationBuckets).values(
          DEFAULT_BUCKETS.map((bucket) => ({
            id: crypto.randomUUID(),
            userId,
            ...bucket,
          }))
        )

        await tx.insert(userSettings).values({
          id: crypto.randomUUID(),
          userId,
          weeklyLimit: 10000,
          salaryDay: 10,
          advanceDay: 25,
          salary: 0,
        })

        await tx.insert(layoutConfigs).values({
          id: crypto.randomUUID(),
          userId,
          config: DEFAULT_LAYOUT,
        })
      })
    },
  },
})

export const { GET, POST } = handlers
