'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { allocationBuckets, db } from '@/shared/db'

import type { AllocationBucket } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getBuckets(): Promise<AllocationBucket[]> {
  const userId = await getUserId()

  return db
    .select({
      id: allocationBuckets.id,
      label: allocationBuckets.label,
      percentage: allocationBuckets.percentage,
    })
    .from(allocationBuckets)
    .where(eq(allocationBuckets.userId, userId))
}

export async function updateBuckets(
  buckets: AllocationBucket[]
): Promise<void> {
  const userId = await getUserId()

  await db.transaction(async (tx) => {
    await tx
      .delete(allocationBuckets)
      .where(eq(allocationBuckets.userId, userId))

    if (buckets.length === 0) return

    await tx.insert(allocationBuckets).values(
      buckets.map((bucket) => ({
        id: bucket.id || crypto.randomUUID(),
        userId,
        label: bucket.label,
        percentage: bucket.percentage,
      }))
    )
  })
}
