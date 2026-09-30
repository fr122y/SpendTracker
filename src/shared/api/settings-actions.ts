'use server'

import { and, asc, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  allocationBuckets,
  db,
  userSettings,
  weeklyBudgetLimits,
} from '@/shared/db'
import {
  getEffectiveWeeklyLimit,
  getWeekBoundaries,
  type WeeklyLimitSetting,
} from '@/shared/lib/finance-selectors'

import {
  percentageFromAmountKopecks,
  salaryRublesToKopecks,
} from './allocation-compat'

import type { db as dbType } from '@/shared/db'

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

type SettingsTransaction = Parameters<
  Parameters<typeof dbType.transaction>[0]
>[0]

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

  if (settingsData.salary !== undefined) {
    await db.transaction(async (tx) => {
      const [currentSettings] = await tx
        .select({ salary: userSettings.salary })
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .for('update')

      await convertLegacyAmountBuckets(
        tx,
        userId,
        currentSettings?.salary ?? 0,
        settingsData.salary as number
      )

      await tx
        .update(userSettings)
        .set(settingsData)
        .where(eq(userSettings.userId, userId))
    })
  } else if (Object.keys(settingsData).length > 0) {
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

async function convertLegacyAmountBuckets(
  tx: SettingsTransaction,
  userId: string,
  currentSalaryRubles: number,
  nextSalaryRubles: number
): Promise<void> {
  const legacyBuckets = await tx
    .select({
      id: allocationBuckets.id,
      amountKopecks: allocationBuckets.amountKopecks,
    })
    .from(allocationBuckets)
    .where(
      and(
        eq(allocationBuckets.userId, userId),
        eq(allocationBuckets.basis, 'amount')
      )
    )

  if (legacyBuckets.length === 0) return

  const currentIncomeKopecks = salaryRublesToKopecks(currentSalaryRubles)
  const incomeKopecks =
    currentIncomeKopecks > 0
      ? currentIncomeKopecks
      : salaryRublesToKopecks(nextSalaryRubles)

  for (const bucket of legacyBuckets) {
    if (bucket.amountKopecks === null) {
      throw new Error('Legacy amount allocation has no stored amount')
    }

    const percentage = percentageFromAmountKopecks(
      bucket.amountKopecks,
      incomeKopecks
    )

    await tx
      .update(allocationBuckets)
      .set({
        percentage,
        basis: 'percentage',
        amountKopecks: null,
      })
      .where(
        and(
          eq(allocationBuckets.id, bucket.id),
          eq(allocationBuckets.userId, userId),
          eq(allocationBuckets.basis, 'amount')
        )
      )
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
