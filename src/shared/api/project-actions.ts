'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, expenses, projects } from '@/shared/db'

import type { Project } from '@/shared/types'

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getProjects(): Promise<Project[]> {
  const userId = await getUserId()

  return db
    .select({
      id: projects.id,
      name: projects.name,
      budget: projects.budget,
      color: projects.color,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
}

export async function addProject(
  data: Omit<Project, 'id' | 'color' | 'createdAt'>
): Promise<Project> {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const createdAt = new Date().toISOString()

  await db.insert(projects).values({
    id,
    userId,
    name: data.name,
    budget: data.budget,
    color,
    createdAt,
  })

  return {
    id,
    name: data.name,
    budget: data.budget,
    color,
    createdAt,
  }
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await getUserId()

  await db.transaction(async (tx) => {
    await tx
      .delete(expenses)
      .where(and(eq(expenses.projectId, id), eq(expenses.userId, userId)))

    await tx
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  })
}
