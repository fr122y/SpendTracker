'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { allocationBuckets, db } from '@/shared/db'

import type { AllocationBucket } from '@/shared/types'

// Keep percentage hundredths safely representable by the UI's arithmetic.
const MAX_BUCKET_PERCENTAGE = Math.floor(Number.MAX_SAFE_INTEGER / 100)

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function normalizeBuckets(buckets: unknown): AllocationBucket[] {
  if (!Array.isArray(buckets)) {
    throw new Error('Buckets must be an array')
  }

  return buckets.map((bucket) => {
    if (!bucket || typeof bucket !== 'object') {
      throw new Error('Invalid bucket')
    }

    const hasBasis = Object.prototype.hasOwnProperty.call(bucket, 'basis')
    const hasAmount = Object.prototype.hasOwnProperty.call(
      bucket,
      'amountKopecks'
    )
    if (!hasBasis && !hasAmount) {
      return {
        ...bucket,
        basis: 'percentage',
        amountKopecks: null,
      } as AllocationBucket
    }

    return bucket as AllocationBucket
  })
}

function validateBuckets(buckets: AllocationBucket[]): void {
  const ids = new Set<string>()

  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== 'object') {
      throw new Error('Invalid bucket')
    }

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

    if (bucket.basis !== 'percentage' && bucket.basis !== 'amount') {
      throw new Error('Invalid bucket basis')
    }

    if (
      !Number.isFinite(bucket.percentage) ||
      bucket.percentage < 0 ||
      bucket.percentage > MAX_BUCKET_PERCENTAGE
    ) {
      throw new Error('Invalid bucket percentage')
    }

    if (bucket.basis === 'amount') {
      if (
        !Number.isSafeInteger(bucket.amountKopecks) ||
        (bucket.amountKopecks as number) < 0
      ) {
        throw new Error('Invalid bucket amount')
      }
    } else if (bucket.amountKopecks !== null) {
      throw new Error('Percentage buckets cannot store an amount')
    }
  }
}

export async function getBuckets(): Promise<AllocationBucket[]> {
  const userId = await getUserId()

  return db
    .select({
      id: allocationBuckets.id,
      label: allocationBuckets.label,
      basis: allocationBuckets.basis,
      percentage: allocationBuckets.percentage,
      amountKopecks: allocationBuckets.amountKopecks,
    })
    .from(allocationBuckets)
    .where(eq(allocationBuckets.userId, userId))
}

export async function updateBuckets(
  buckets: AllocationBucket[]
): Promise<void> {
  const userId = await getUserId()
  const normalizedBuckets = normalizeBuckets(buckets)
  validateBuckets(normalizedBuckets)

  await db.transaction(async (tx) => {
    await tx
      .delete(allocationBuckets)
      .where(eq(allocationBuckets.userId, userId))

    if (normalizedBuckets.length === 0) return

    await tx.insert(allocationBuckets).values(
      normalizedBuckets.map((bucket) => ({
        id: bucket.id || crypto.randomUUID(),
        userId,
        label: bucket.label,
        basis: bucket.basis,
        percentage: bucket.percentage,
        amountKopecks: bucket.amountKopecks,
      }))
    )
  })
}
