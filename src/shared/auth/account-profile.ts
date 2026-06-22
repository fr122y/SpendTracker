import 'server-only'

import { eq } from 'drizzle-orm'

import { accounts, db, users } from '@/shared/db'

export interface AccountProfile {
  id: string
  name: string | null
  email: string | null
  provider: string
}

function formatProvider(provider: string | null, hasPassword: boolean) {
  if (hasPassword) {
    return 'Credentials'
  }

  if (provider === 'google') {
    return 'Google'
  }

  return provider ?? 'Неизвестно'
}

export async function getAccountProfile(
  userId: string
): Promise<AccountProfile | null> {
  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      password: users.password,
      provider: accounts.provider,
    })
    .from(users)
    .leftJoin(accounts, eq(accounts.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1)

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    provider: formatProvider(profile.provider, Boolean(profile.password)),
  }
}
