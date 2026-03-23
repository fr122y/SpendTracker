'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, userSettings } from '@/shared/db'

export interface Settings {
  weeklyLimit: number
  salaryDay: number
  advanceDay: number
  salary: number
}

const DEFAULT_SETTINGS: Settings = {
  weeklyLimit: 10000,
  salaryDay: 10,
  advanceDay: 25,
  salary: 0,
}

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getSettings(): Promise<Settings> {
  const userId = await getUserId()

  const [row] = await db
    .select({
      weeklyLimit: userSettings.weeklyLimit,
      salaryDay: userSettings.salaryDay,
      advanceDay: userSettings.advanceDay,
      salary: userSettings.salary,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))

  return row ?? DEFAULT_SETTINGS
}

export async function updateSettings(data: Partial<Settings>): Promise<void> {
  const userId = await getUserId()

  await db.update(userSettings).set(data).where(eq(userSettings.userId, userId))
}
