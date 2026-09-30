'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { allocationBuckets, db, userSettings } from '@/shared/db'

import {
  percentageFromAmountKopecks,
  salaryRublesToKopecks,
} from './allocation-compat'

import type { AllocationBucket } from '@/shared/types'

const MAX_BUCKET_PERCENTAGE = Math.floor(Number.MAX_SAFE_INTEGER / 100)
type BucketPayload = Record<string, unknown>

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function isBucketPayload(value: unknown): value is BucketPayload {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasLegacyAmountBasis(buckets: unknown[]): boolean {
  return buckets.some(
    (bucket) => isBucketPayload(bucket) && bucket.basis === 'amount'
  )
}

function validateBuckets(buckets: AllocationBucket[]): void {
  const ids = new Set<string>()

  for (const bucket of buckets) {
    if (
      typeof bucket.id !== 'string' ||
      bucket.id.length > 128 ||
      (bucket.id.length > 0 && ids.has(bucket.id))
    ) {
      throw new Error('Invalid bucket id')
    }
    if (bucket.id) ids.add(bucket.id)

    if (typeof bucket.label !== 'string' || bucket.label.length > 100) {
      throw new Error('Invalid bucket label')
    }

    if (
      !Number.isFinite(bucket.percentage) ||
      bucket.percentage < 0 ||
      bucket.percentage > MAX_BUCKET_PERCENTAGE
    ) {
      throw new Error('Invalid bucket percentage')
    }
  }
}

async function getIncomeKopecks(userId: string): Promise<number> {
  const [settings] = await db
    .select({ salary: userSettings.salary })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))

  return salaryRublesToKopecks(settings?.salary ?? 0)
}

function normalizeBuckets(
  buckets: unknown,
  legacyIncomeKopecks: number
): AllocationBucket[] {
  if (!Array.isArray(buckets)) {
    throw new Error('Buckets must be an array')
  }

  return buckets.map((bucket) => {
    if (!isBucketPayload(bucket)) {
      throw new Error('Invalid bucket')
    }

    const hasBasis = Object.prototype.hasOwnProperty.call(bucket, 'basis')
    const hasAmount = Object.prototype.hasOwnProperty.call(
      bucket,
      'amountKopecks'
    )

    // Older clients sent only id, label, and percentage.
    if (!hasBasis && !hasAmount) {
      return {
        id: bucket.id,
        label: bucket.label,
        percentage: bucket.percentage,
      } as AllocationBucket
    }

    if (!hasBasis || !hasAmount) {
      throw new Error('Invalid legacy bucket payload')
    }

    if (bucket.basis === 'percentage' && bucket.amountKopecks === null) {
      return {
        id: bucket.id,
        label: bucket.label,
        percentage: bucket.percentage,
      } as AllocationBucket
    }

    if (bucket.basis === 'amount') {
      if (
        !Number.isSafeInteger(bucket.amountKopecks) ||
        (bucket.amountKopecks as number) < 0
      ) {
        throw new Error('Invalid legacy bucket amount')
      }

      return {
        id: bucket.id,
        label: bucket.label,
        percentage: percentageFromAmountKopecks(
          bucket.amountKopecks as number,
          legacyIncomeKopecks
        ),
      } as AllocationBucket
    }

    throw new Error('Invalid legacy bucket basis')
  })
}

export async function getBuckets(): Promise<AllocationBucket[]> {
  const userId = await getUserId()
  const rows = await db
    .select({
      id: allocationBuckets.id,
      label: allocationBuckets.label,
      percentage: allocationBuckets.percentage,
      basis: allocationBuckets.basis,
      amountKopecks: allocationBuckets.amountKopecks,
      salary: userSettings.salary,
    })
    .from(allocationBuckets)
    .leftJoin(userSettings, eq(allocationBuckets.userId, userSettings.userId))
    .where(eq(allocationBuckets.userId, userId))

  return rows.map((row) => {
    if (row.basis === 'amount') {
      const incomeKopecks = salaryRublesToKopecks(row.salary ?? 0)
      if (row.amountKopecks === null) {
        throw new Error('Legacy amount allocation has no stored amount')
      }

      return {
        id: row.id,
        label: row.label,
        percentage: percentageFromAmountKopecks(
          row.amountKopecks,
          incomeKopecks
        ),
      }
    }

    if (row.basis !== 'percentage') {
      throw new Error('Invalid allocation basis in storage')
    }

    return {
      id: row.id,
      label: row.label,
      percentage: row.percentage,
    }
  })
}

export async function updateBuckets(
  buckets: AllocationBucket[]
): Promise<void> {
  const userId = await getUserId()
  const needsLegacyAmountConversion =
    Array.isArray(buckets) && hasLegacyAmountBasis(buckets)
  const legacyIncomeKopecks = needsLegacyAmountConversion
    ? await getIncomeKopecks(userId)
    : 0
  const normalizedBuckets = normalizeBuckets(buckets, legacyIncomeKopecks)
  validateBuckets(normalizedBuckets)

  await db.transaction(async (tx) => {
    const existingLegacyAmounts = await tx
      .select({
        amountKopecks: allocationBuckets.amountKopecks,
        salary: userSettings.salary,
      })
      .from(allocationBuckets)
      .leftJoin(userSettings, eq(allocationBuckets.userId, userSettings.userId))
      .where(
        and(
          eq(allocationBuckets.userId, userId),
          eq(allocationBuckets.basis, 'amount')
        )
      )

    for (const bucket of existingLegacyAmounts) {
      if (bucket.amountKopecks === null) {
        throw new Error('Legacy amount allocation has no stored amount')
      }

      percentageFromAmountKopecks(
        bucket.amountKopecks,
        salaryRublesToKopecks(bucket.salary ?? 0)
      )
    }

    await tx
      .delete(allocationBuckets)
      .where(eq(allocationBuckets.userId, userId))

    if (normalizedBuckets.length === 0) return

    await tx.insert(allocationBuckets).values(
      normalizedBuckets.map((bucket) => ({
        id: bucket.id || crypto.randomUUID(),
        userId,
        label: bucket.label,
        percentage: bucket.percentage,
      }))
    )
  })
}
