import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

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

const EMPTY_PROJECTS: Project[] = []

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

// Atoms with persistence
export const projectsAtom = atom<Project[]>([], 'projectsAtom').extend(
  withLocalStorage('smartspend-projects')
)

// Actions
export const addProject = action(
  (project: Omit<Project, 'color' | 'createdAt'>) => {
    const current = projectsAtom() ?? []
    projectsAtom.set([
      ...current,
      {
        ...project,
        color: getRandomColor(),
        createdAt: new Date().toISOString(),
      },
    ])
  },
  'addProject'
)

export const deleteProject = action((id: string) => {
  const current = projectsAtom() ?? []
  projectsAtom.set(current.filter((p) => p.id !== id))
}, 'deleteProject')

// Store state type
interface ProjectState {
  projects: Project[]
  addProject: (project: Omit<Project, 'color' | 'createdAt'>) => void
  deleteProject: (id: string) => void
}

// Action wrappers (stable references)
const actionAddProject = (project: Omit<Project, 'color' | 'createdAt'>) =>
  wrap(addProject)(project)
const actionDeleteProject = (id: string) => wrap(deleteProject)(id)

// Cached state for useSyncExternalStore
let cachedState: ProjectState | null = null
let cachedProjects: Project[] | undefined

const getState = (): ProjectState => {
  // Fallback to stable empty array during hydration when localStorage hasn't loaded yet
  const projects = projectsAtom() ?? EMPTY_PROJECTS

  if (cachedState === null || cachedProjects !== projects) {
    cachedProjects = projects
    cachedState = {
      projects,
      addProject: actionAddProject,
      deleteProject: actionDeleteProject,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  return projectsAtom.subscribe(callback)
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useProjectStore(): ProjectState
export function useProjectStore<T>(selector: (state: ProjectState) => T): T
export function useProjectStore<T>(selector?: (state: ProjectState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
