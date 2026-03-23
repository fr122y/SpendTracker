import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useProjectStore } from '../model/queries'

import type { Project } from '@/shared/types'

let projects: Project[] = []

jest.mock('@/shared/api', () => ({
  queryKeys: {
    expenses: { all: ['expenses'] },
    projects: { all: ['projects'] },
  },
  getProjects: jest.fn(async () => projects),
  addProject: jest.fn(
    async (project: Omit<Project, 'id' | 'color' | 'createdAt'>) => {
      const nextProject: Project = {
        ...project,
        color: `#${(projects.length + 1).toString(16).padStart(6, '0')}`,
        createdAt: new Date().toISOString(),
        id: `project-${projects.length + 1}`,
      }
      projects = [...projects, nextProject]
      return nextProject
    }
  ),
  deleteProject: jest.fn(async (id: string) => {
    projects = projects.filter((project) => project.id !== id)
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useProjectStore', () => {
  beforeEach(() => {
    projects = []
    jest.clearAllMocks()
  })

  it('creates and removes projects through the query-backed store', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useProjectStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(0)
    })

    act(() => {
      result.current.addProject({
        id: 'unused-local-id',
        name: 'Проект А',
        budget: 10000,
      })
    })

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].name).toBe('Проект А')
      expect(result.current.projects[0].color).toMatch(/^#/)
      expect(result.current.projects[0].createdAt).toBeDefined()
    })

    act(() => {
      result.current.deleteProject(result.current.projects[0].id)
    })

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(0)
    })
  })
})
