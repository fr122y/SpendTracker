'use server'

import { asc, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, userSettings, weeklyBudgetLimits } from '@/shared/db'
import {
  getEffectiveWeeklyLimit,
  getWeekBoundaries,
  type WeeklyLimitSetting,
} from '@/shared/lib/finance-selectors'

export interface Settings {
  weeklyLimit: number
  weeklyLimits: WeeklyLimitSetting[]
  salaryDay: number
  advanceDay: number
  salary: number
}

const BASELINE_WEEK_START = '1970-01-05'

const DEFAULT_SETTINGS: Settings = {
  weeklyLimit: 10000,
  weeklyLimits: [{ effectiveWeekStart: BASELINE_WEEK_START, amount: 10000 }],
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

  if (!row) {
    return DEFAULT_SETTINGS
  }

  const persistedWeeklyLimits = await db
    .select({
      effectiveWeekStart: weeklyBudgetLimits.effectiveWeekStart,
      amount: weeklyBudgetLimits.amount,
    })
    .from(weeklyBudgetLimits)
    .where(eq(weeklyBudgetLimits.userId, userId))
    .orderBy(asc(weeklyBudgetLimits.effectiveWeekStart))

  const weeklyLimits =
    persistedWeeklyLimits.length > 0
      ? persistedWeeklyLimits
      : [{ effectiveWeekStart: BASELINE_WEEK_START, amount: row.weeklyLimit }]

  return {
    ...row,
    weeklyLimit: getEffectiveWeeklyLimit(
      weeklyLimits,
      new Date(),
      row.weeklyLimit
    ),
    weeklyLimits,
  }
}

export async function updateSettings(data: Partial<Settings>): Promise<void> {
  const userId = await getUserId()
  const { weeklyLimit, weeklyLimits, ...settingsData } = data
  void weeklyLimits

  if (Object.keys(settingsData).length > 0) {
    await db
      .update(userSettings)
      .set(settingsData)
      .where(eq(userSettings.userId, userId))
  }

  if (weeklyLimit !== undefined) {
    const effectiveWeekStart = getWeekBoundaries(new Date()).start
    await setWeeklyLimitForWeek(effectiveWeekStart, weeklyLimit)
  }
}

export async function setWeeklyLimitForWeek(
  effectiveWeekStart: string,
  amount: number
): Promise<void> {
  const userId = await getUserId()

  await db
    .insert(weeklyBudgetLimits)
    .values({
      id: crypto.randomUUID(),
      userId,
      effectiveWeekStart,
      amount,
    })
    .onConflictDoUpdate({
      target: [
        weeklyBudgetLimits.userId,
        weeklyBudgetLimits.effectiveWeekStart,
      ],
      set: { amount },
    })
}
