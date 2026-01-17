import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Project } from '@/shared/types'

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

interface ProjectState {
  projects: Project[]
  addProject: (project: Omit<Project, 'color' | 'createdAt'>) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],

      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              ...project,
              color: getRandomColor(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'smartspend-projects',
    }
  )
)
