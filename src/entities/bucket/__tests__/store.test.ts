import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useBucketStore, updateBuckets, bucketsAtom } from '../model/store'

import type { AllocationBucket } from '@/shared/types'

describe('useBucketStore', () => {
  const DEFAULT_BUCKETS: AllocationBucket[] = [
    { id: '1', label: 'Накопления', percentage: 20 },
    { id: '2', label: 'Инвестиции', percentage: 10 },
  ]

  beforeEach(() => {
    wrap(updateBuckets)(DEFAULT_BUCKETS)
  })

  describe('Initial State', () => {
    it('should have default buckets', () => {
      const { result } = renderHook(() => useBucketStore())

      expect(result.current.buckets).toHaveLength(2)
      expect(result.current.buckets[0]).toEqual({
        id: '1',
        label: 'Накопления',
        percentage: 20,
      })
      expect(result.current.buckets[1]).toEqual({
        id: '2',
        label: 'Инвестиции',
        percentage: 10,
      })
    })
  })

  describe('CRUD Operations', () => {
    it('should update buckets with new array', async () => {
      const { result } = renderHook(() => useBucketStore())
      const newBuckets: AllocationBucket[] = [
        { id: '3', label: 'Образование', percentage: 15 },
      ]

      act(() => result.current.updateBuckets(newBuckets))

      await waitFor(() => {
        expect(result.current.buckets).toEqual(newBuckets)
      })
    })

    it('should replace all existing buckets', async () => {
      const { result } = renderHook(() => useBucketStore())
      const newBuckets: AllocationBucket[] = [
        { id: '5', label: 'Путешествия', percentage: 30 },
        { id: '6', label: 'Здоровье', percentage: 25 },
      ]

      act(() => result.current.updateBuckets(newBuckets))

      await waitFor(() => {
        expect(result.current.buckets).toEqual(newBuckets)
      })
    })

    it('should allow empty buckets array', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => result.current.updateBuckets([]))

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(0)
      })
    })

    it('should handle multiple sequential updates', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => {
        result.current.updateBuckets([
          { id: '20', label: 'Первый', percentage: 10 },
        ])
      })

      await waitFor(() => expect(result.current.buckets).toHaveLength(1))

      act(() => {
        result.current.updateBuckets([
          { id: '21', label: 'Второй', percentage: 20 },
          { id: '22', label: 'Третий', percentage: 30 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(2)
        expect(result.current.buckets[0].label).toBe('Второй')
      })
    })
  })

  describe('Business Logic', () => {
    it('should accept various percentage values', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => {
        result.current.updateBuckets([
          { id: '10', label: 'Резерв', percentage: 0 },
          { id: '13', label: 'Точный', percentage: 12.5 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets[0].percentage).toBe(0)
        expect(result.current.buckets[1].percentage).toBe(12.5)
      })
    })

    it('should preserve bucket order', async () => {
      const { result } = renderHook(() => useBucketStore())
      const orderedBuckets: AllocationBucket[] = [
        { id: 'z', label: 'Z-Last', percentage: 5 },
        { id: 'a', label: 'A-First', percentage: 10 },
      ]

      act(() => result.current.updateBuckets(orderedBuckets))

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe('Z-Last')
        expect(result.current.buckets[1].label).toBe('A-First')
      })
    })

    it('should calculate total percentage across buckets', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => {
        result.current.updateBuckets([
          { id: '50', label: 'A', percentage: 25 },
          { id: '51', label: 'B', percentage: 35 },
        ])
      })

      await waitFor(() => {
        const total = result.current.buckets.reduce(
          (sum, b) => sum + b.percentage,
          0
        )
        expect(total).toBe(60)
      })
    })
  })

  describe('React Integration', () => {
    it('should provide store API and trigger component updates', async () => {
      const { result } = renderHook(() => useBucketStore())

      expect(result.current.buckets).toBeDefined()
      expect(typeof result.current.updateBuckets).toBe('function')

      const initialBuckets = result.current.buckets

      act(() => {
        result.current.updateBuckets([
          { id: '99', label: 'Новый', percentage: 50 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets).not.toEqual(initialBuckets)
        expect(result.current.buckets[0].label).toBe('Новый')
      })
    })
  })

  describe('Hydration Safety', () => {
    it('should return empty array when atom is undefined during hydration', () => {
      // Simulate pre-hydration state where localStorage hasn't loaded yet
      // @ts-expect-error -- simulate pre-hydration undefined
      bucketsAtom.set(undefined)

      const { result } = renderHook(() => useBucketStore())

      // Should return empty array, not undefined
      expect(result.current.buckets).toBeDefined()
      expect(Array.isArray(result.current.buckets)).toBe(true)
      expect(result.current.buckets.length).toBe(0)
    })

    it('should not throw when calling reduce on buckets during hydration', () => {
      // Simulate pre-hydration state
      // @ts-expect-error -- simulate pre-hydration undefined
      bucketsAtom.set(undefined)

      const { result } = renderHook(() => useBucketStore())

      // This should not throw "Cannot read properties of undefined (reading 'reduce')"
      expect(() => {
        result.current.buckets.reduce((sum, b) => sum + b.percentage, 0)
      }).not.toThrow()

      // Result should be 0 for empty array
      const total = result.current.buckets.reduce(
        (sum, b) => sum + b.percentage,
        0
      )
      expect(total).toBe(0)
    })

    it('should handle array methods safely when atom is undefined', () => {
      // @ts-expect-error -- simulate pre-hydration undefined
      bucketsAtom.set(undefined)

      const { result } = renderHook(() => useBucketStore())

      // All array methods should work without throwing
      expect(() => result.current.buckets.map((b) => b.id)).not.toThrow()
      expect(() =>
        result.current.buckets.filter((b) => b.percentage > 0)
      ).not.toThrow()
      expect(() =>
        result.current.buckets.find((b) => b.id === 'test')
      ).not.toThrow()

      expect(result.current.buckets.map((b) => b.id)).toEqual([])
      expect(result.current.buckets.filter((b) => b.percentage > 0)).toEqual([])
      expect(
        result.current.buckets.find((b) => b.id === 'test')
      ).toBeUndefined()
    })
  })
})
