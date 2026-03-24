import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useAddProject, useDeleteProject } from '../model/queries'

import type { Expense, Project } from '@/shared/types'

let shouldRejectAdd = false
let shouldRejectDelete = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    expenses: { all: ['expenses'] },
    projects: { all: ['projects'] },
  },
  getProjects: jest.fn(),
  addProject: jest.fn(async () => {
    if (shouldRejectAdd) {
      throw new Error('add failed')
    }
  }),
  deleteProject: jest.fn(async () => {
    if (shouldRejectDelete) {
      throw new Error('delete failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'Проект А',
    budget: 10000,
    color: '#10b981',
    createdAt: '2026-03-20T10:00:00.000Z',
  },
]

const initialExpenses: Expense[] = [
  {
    id: 'e1',
    description: 'Обед',
    amount: 700,
    date: '2026-03-20',
    category: 'Еда',
    emoji: '🍔',
    projectId: 'p1',
  },
  {
    id: 'e2',
    description: 'Такси',
    amount: 300,
    date: '2026-03-20',
    category: 'Транспорт',
    emoji: '🚕',
  },
]

describe('project optimistic mutations', () => {
  beforeEach(() => {
    shouldRejectAdd = false
    shouldRejectDelete = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('adds project optimistically with temp id and fallback color', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['projects'], initialProjects)

    const { result } = renderHook(() => useAddProject(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ name: 'Проект B', budget: 20000 })
    })

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<Project[]>(['projects'])
      expect(optimistic).toHaveLength(2)
      expect(optimistic?.[1].id).toMatch(/^temp-/)
      expect(optimistic?.[1].color).toBe('#94a3b8')
      expect(optimistic?.[1].createdAt).toBeDefined()
    })
  })

  it('rolls back cascade delete on error for projects and expenses', async () => {
    shouldRejectDelete = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    queryClient.setQueryData(['projects'], initialProjects)
    queryClient.setQueryData(['expenses'], initialExpenses)

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('p1')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['projects'])).toEqual(initialProjects)
      expect(queryClient.getQueryData(['expenses'])).toEqual(initialExpenses)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] })
    })
  })
})
