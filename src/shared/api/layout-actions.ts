'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, layoutConfigs } from '@/shared/db'

import type { LayoutConfig } from '@/shared/types'

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

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

  return row?.config ?? DEFAULT_LAYOUT
}

export async function updateLayoutConfig(config: LayoutConfig): Promise<void> {
  const userId = await getUserId()

  await db
    .update(layoutConfigs)
    .set({ config })
    .where(eq(layoutConfigs.userId, userId))
}
