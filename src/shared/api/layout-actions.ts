'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, layoutConfigs } from '@/shared/db'
import {
  DEFAULT_LAYOUT,
  isLayoutEqual,
  normalizeLayoutConfig,
} from '@/shared/lib'

import type { LayoutConfig } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getLayoutConfig(): Promise<LayoutConfig> {
  const userId = await getUserId()

  const [row] = await db
    .select({ config: layoutConfigs.config })
    .from(layoutConfigs)
    .where(eq(layoutConfigs.userId, userId))

  const normalized = normalizeLayoutConfig(row?.config ?? DEFAULT_LAYOUT)

  // Auto-heal outdated layouts in DB so missing widgets appear for users.
  if (row?.config && !isLayoutEqual(row.config, normalized)) {
    await db
      .update(layoutConfigs)
      .set({ config: normalized })
      .where(eq(layoutConfigs.userId, userId))
  }

  return normalized
}

export async function updateLayoutConfig(config: LayoutConfig): Promise<void> {
  const userId = await getUserId()
  const normalized = normalizeLayoutConfig(config)

  await db
    .update(layoutConfigs)
    .set({ config: normalized })
    .where(eq(layoutConfigs.userId, userId))
}
