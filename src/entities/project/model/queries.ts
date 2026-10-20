'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProject as addProjectAction,
  deleteProject as deleteProjectAction,
  getProjects,
  queryKeys,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'
import {
  createTempId,
  isPendingIdLostError,
  replaceRecordId,
  resolveId,
  trackPendingId,
} from '@/shared/lib/pending-ids'

import type { Expense, Project } from '@/shared/types'

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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all })
      const previous = queryClient.getQueryData<Project[]>(
        queryKeys.projects.all
      )
      const optimisticProject: Project = {
        id: createTempId(),
        name: data.name,
        budget: data.budget,
        color: '#94a3b8',
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData(
        queryKeys.projects.all,
        (old: Project[] = []) => [...old, optimisticProject]
      )
      const pending = trackPendingId(optimisticProject.id)
      return { previous, tempId: optimisticProject.id, pending }
    },
    onSuccess: (project, _data, context) => {
      const storedId = project?.id ?? context.tempId
      queryClient.setQueryData<Project[]>(queryKeys.projects.all, (old) =>
        replaceRecordId(old, context.tempId, storedId)
      )
      context.pending.resolve(storedId)
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKeys.projects.all, context?.previous)
      context?.pending.reject()
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => deleteProjectAction(await resolveId(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all })

      const previousProjects = queryClient.getQueryData<Project[]>(
        queryKeys.projects.all
      )
      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.all
      )

      queryClient.setQueryData(queryKeys.projects.all, (old: Project[] = []) =>
        old.filter((project) => project.id !== id)
      )
      queryClient.setQueryData(queryKeys.expenses.all, (old: Expense[] = []) =>
        old.filter((expense) => expense.projectId !== id)
      )

      return { previousProjects, previousExpenses }
    },
    onError: (error, _id, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(
        queryKeys.projects.all,
        context?.previousProjects
      )
      queryClient.setQueryData(
        queryKeys.expenses.all,
        context?.previousExpenses
      )
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  addProject: (project: Omit<Project, 'color' | 'createdAt'>) => void
  deleteProject: (id: string) => void
}

export function useProjectStore(): ProjectState
export function useProjectStore<T>(selector: (state: ProjectState) => T): T
export function useProjectStore<T>(selector?: (state: ProjectState) => T) {
  const { data: projects = [], isLoading } = useProjects()
  const addProject = useAddProject()
  const deleteProject = useDeleteProject()

  const state: ProjectState = {
    projects,
    isLoading,
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
