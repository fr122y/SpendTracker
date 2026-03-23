'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProject as addProjectAction,
  deleteProject as deleteProjectAction,
  getProjects,
  queryKeys,
} from '@/shared/api'

import type { Project } from '@/shared/types'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: getProjects,
  })
}

export function useAddProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'color' | 'createdAt'>) =>
      addProjectAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProjectAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

interface ProjectState {
  projects: Project[]
  addProject: (project: Omit<Project, 'color' | 'createdAt'>) => void
  deleteProject: (id: string) => void
}

export function useProjectStore(): ProjectState
export function useProjectStore<T>(selector: (state: ProjectState) => T): T
export function useProjectStore<T>(selector?: (state: ProjectState) => T) {
  const { data: projects = [] } = useProjects()
  const addProject = useAddProject()
  const deleteProject = useDeleteProject()

  const state: ProjectState = {
    projects,
    addProject: (project) => {
      addProject.mutate({
        name: project.name,
        budget: project.budget,
      })
    },
    deleteProject: (id) => {
      deleteProject.mutate(id)
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
