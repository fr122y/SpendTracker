import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  useProjectStore,
  projectsAtom,
  addProject,
  deleteProject,
} from '../model/store'

import type { Project } from '@/shared/types'

const mockProject: Project = {
  id: 'project-1',
  name: 'Тестовый проект',
  budget: 50000,
  color: '#10b981',
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('useProjectStore', () => {
  beforeEach(() => {
    projectsAtom.set([])
  })

  describe('Initial State & API', () => {
    it('should initialize correctly and expose actions', () => {
      const { result } = renderHook(() => useProjectStore())

      expect(result.current.projects).toHaveLength(0)
      expect(typeof result.current.addProject).toBe('function')
      expect(typeof result.current.deleteProject).toBe('function')
    })
  })

  describe('addProject', () => {
    it('should add project with auto-generated fields and preserve order', async () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.addProject({
          id: 'p1',
          name: 'Проект А',
          budget: 10000,
        })
        result.current.addProject({
          id: 'p2',
          name: 'Проект Б',
          budget: 20000,
        })
      })

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2)
        expect(result.current.projects[0].name).toBe('Проект А')
        expect(result.current.projects[0].color).toMatch(/^#[0-9a-f]{6}$/i)
        expect(result.current.projects[0].createdAt).toBeDefined()
        expect(result.current.projects[1].name).toBe('Проект Б')
      })
    })

    it('should handle edge cases and generate unique colors', async () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.addProject({ id: 'e1', name: '', budget: 0 })
        for (let i = 0; i < 10; i++) {
          result.current.addProject({
            id: `p${i}`,
            name: `Проект ${i}`,
            budget: i * 1000,
          })
        }
      })

      await waitFor(() => {
        expect(result.current.projects[0].name).toBe('')
        expect(result.current.projects[0].budget).toBe(0)
        const colors = new Set(result.current.projects.map((p) => p.color))
        expect(colors.size).toBeGreaterThan(1)
      })
    })
  })

  describe('deleteProject', () => {
    beforeEach(() => {
      projectsAtom.set([
        { ...mockProject, id: 'p1', name: 'Проект 1', budget: 10000 },
        { ...mockProject, id: 'p2', name: 'Проект 2', budget: 20000 },
        { ...mockProject, id: 'p3', name: 'Проект 3', budget: 30000 },
      ])
    })

    it('should delete project and preserve remaining ones', async () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.deleteProject('p2')
      })

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2)
        expect(result.current.projects.map((p) => p.id)).toEqual(['p1', 'p3'])
      })
    })

    it('should gracefully handle edge cases', async () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.deleteProject('non-existent')
        result.current.deleteProject('p2')
        result.current.deleteProject('p2')
      })

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2)
      })

      projectsAtom.set([])
      const { result: emptyResult } = renderHook(() => useProjectStore())

      act(() => {
        emptyResult.current.deleteProject('any-id')
      })

      expect(emptyResult.current.projects).toHaveLength(0)
    })
  })

  describe('CRUD Integration', () => {
    it('should handle complete workflow: add, delete, add, clear', async () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.addProject({ id: 'p1', name: 'P1', budget: 1000 })
        result.current.addProject({ id: 'p2', name: 'P2', budget: 2000 })
        result.current.addProject({ id: 'p3', name: 'P3', budget: 3000 })
      })

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(3)
      })

      act(() => {
        result.current.deleteProject('p2')
      })

      await waitFor(() => {
        expect(result.current.projects.map((p) => p.id)).toEqual(['p1', 'p3'])
      })

      act(() => {
        result.current.addProject({ id: 'p4', name: 'P4', budget: 4000 })
      })

      await waitFor(() => {
        expect(result.current.projects[2].id).toBe('p4')
      })

      act(() => {
        result.current.deleteProject('p1')
        result.current.deleteProject('p3')
        result.current.deleteProject('p4')
      })

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(0)
      })
    })
  })

  describe('Direct Atom Access', () => {
    it('should synchronize direct atom operations with hook', async () => {
      wrap(addProject)({ id: 'd1', name: 'Direct', budget: 5000 })

      expect(projectsAtom()[0].name).toBe('Direct')

      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.addProject({ id: 'd2', name: 'Hook', budget: 10000 })
      })

      await waitFor(() => {
        const atomProjects = projectsAtom()
        expect(atomProjects).toHaveLength(2)
        expect(atomProjects[1].name).toBe('Hook')
      })

      wrap(deleteProject)('d1')
      expect(projectsAtom()).toHaveLength(1)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      projectsAtom.set([
        { ...mockProject, id: 'p1', name: 'P1', budget: 10000 },
        { ...mockProject, id: 'p2', name: 'P2', budget: 20000 },
      ])
    })

    it('should compute derived state and react to changes', async () => {
      const { result: derivedResult } = renderHook(() =>
        useProjectStore((state) => ({
          count: state.projects.length,
          total: state.projects.reduce((sum, p) => sum + p.budget, 0),
        }))
      )

      expect(derivedResult.current.count).toBe(2)
      expect(derivedResult.current.total).toBe(30000)

      const { result: storeResult } = renderHook(() => useProjectStore())

      act(() => {
        storeResult.current.addProject({ id: 'p3', name: 'P3', budget: 15000 })
      })

      await waitFor(() => {
        expect(derivedResult.current.count).toBe(3)
        expect(derivedResult.current.total).toBe(45000)
      })
    })

    it('should find specific project by id', () => {
      const { result } = renderHook(() =>
        useProjectStore((state) => state.projects.find((p) => p.id === 'p2'))
      )

      expect(result.current?.name).toBe('P2')
      expect(result.current?.budget).toBe(20000)
    })
  })

  describe('Hydration Safety', () => {
    it('should return empty array when atom is undefined during hydration', () => {
      // Simulate pre-hydration state where localStorage hasn't loaded yet
      // @ts-expect-error -- simulate pre-hydration undefined
      projectsAtom.set(undefined)

      const { result } = renderHook(() => useProjectStore())

      // Should return empty array, not undefined
      expect(result.current.projects).toBeDefined()
      expect(Array.isArray(result.current.projects)).toBe(true)
      expect(result.current.projects.length).toBe(0)
    })

    it('should not throw when calling reduce on projects during hydration', () => {
      // Simulate pre-hydration state
      // @ts-expect-error -- simulate pre-hydration undefined
      projectsAtom.set(undefined)

      const { result } = renderHook(() => useProjectStore())

      // This should not throw "Cannot read properties of undefined (reading 'reduce')"
      expect(() => {
        result.current.projects.reduce((sum, p) => sum + p.budget, 0)
      }).not.toThrow()

      // Result should be 0 for empty array
      const total = result.current.projects.reduce(
        (sum, p) => sum + p.budget,
        0
      )
      expect(total).toBe(0)
    })

    it('should handle array methods safely when atom is undefined', () => {
      // @ts-expect-error -- simulate pre-hydration undefined
      projectsAtom.set(undefined)

      const { result } = renderHook(() => useProjectStore())

      // All array methods should work without throwing
      expect(() => result.current.projects.map((p) => p.id)).not.toThrow()
      expect(() =>
        result.current.projects.filter((p) => p.budget > 0)
      ).not.toThrow()
      expect(() =>
        result.current.projects.find((p) => p.id === 'test')
      ).not.toThrow()

      expect(result.current.projects.map((p) => p.id)).toEqual([])
      expect(result.current.projects.filter((p) => p.budget > 0)).toEqual([])
      expect(
        result.current.projects.find((p) => p.id === 'test')
      ).toBeUndefined()
    })
  })
})
