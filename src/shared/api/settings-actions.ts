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
  isValidWeeklyLimitAmount,
  isWeekStartDate,
  type WeeklyLimitSetting,
} from '@/shared/lib/finance-selectors'
import { isValidMoneyAmount } from '@/shared/lib/money-amount'
import { isValidPaydayDay } from '@/shared/lib/payday'

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

const WEEKLY_LIMIT_AMOUNT_ERROR = 'Лимит должен быть больше 0'
const WEEK_START_ERROR =
  'Начало недели должно быть понедельником в формате ГГГГ-ММ-ДД'

function assertWeeklyLimitInput(
  effectiveWeekStart: unknown,
  amount: unknown
): void {
  if (!isWeekStartDate(effectiveWeekStart)) {
    throw new Error(WEEK_START_ERROR)
  }
  if (!isValidWeeklyLimitAmount(amount)) {
    throw new Error(WEEKLY_LIMIT_AMOUNT_ERROR)
  }
}

export interface UpdateSettingsInput extends Partial<Settings> {
  /**
   * Client-local Monday (`YYYY-MM-DD`) of the week a new `weeklyLimit`
   * applies to. Required with `weeklyLimit`: the server does not derive the
   * week from its own clock.
   */
  weeklyLimitWeekStart?: string
}

export async function updateSettings(data: UpdateSettingsInput): Promise<void> {
  const userId = await getUserId()
  const { weeklyLimit, weeklyLimits, weeklyLimitWeekStart, ...settingsData } =
    data
  void weeklyLimits

  if (weeklyLimit !== undefined) {
    assertWeeklyLimitInput(weeklyLimitWeekStart, weeklyLimit)
  }

  for (const key of ['salaryDay', 'advanceDay'] as const) {
    if (key in settingsData && !isValidPaydayDay(settingsData[key])) {
      throw new Error('День зарплаты и аванса должен быть от 1 до 31')
    }
  }

  if (
    settingsData.salary !== undefined &&
    !isValidMoneyAmount(settingsData.salary, { allowZero: true })
  ) {
    throw new Error('Доход должен быть от 0 до 100 000 000 ₽')
  }

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

  if (weeklyLimit !== undefined && weeklyLimitWeekStart !== undefined) {
    await setWeeklyLimitForWeek(weeklyLimitWeekStart, weeklyLimit)
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
  assertWeeklyLimitInput(effectiveWeekStart, amount)

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
