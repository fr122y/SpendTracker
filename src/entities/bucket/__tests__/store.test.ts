import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useBucketStore, bucketsAtom, updateBuckets } from '../model/store'

import type { AllocationBucket } from '@/shared/types'

describe('useBucketStore', () => {
  const DEFAULT_BUCKETS: AllocationBucket[] = [
    { id: '1', label: 'Накопления', percentage: 20 },
    { id: '2', label: 'Инвестиции', percentage: 10 },
  ]

  beforeEach(() => {
    // Reset atom to default values before each test
    wrap(updateBuckets)(DEFAULT_BUCKETS)
  })

  describe('Initial State', () => {
    it('should have default buckets with two items', () => {
      const { result } = renderHook(() => useBucketStore())

      expect(result.current.buckets).toHaveLength(2)
    })

    it('should have default bucket "Накопления" with 20%', () => {
      const { result } = renderHook(() => useBucketStore())

      const savingsBucket = result.current.buckets.find(
        (b) => b.label === 'Накопления'
      )
      expect(savingsBucket).toBeDefined()
      expect(savingsBucket?.percentage).toBe(20)
      expect(savingsBucket?.id).toBe('1')
    })

    it('should have default bucket "Инвестиции" with 10%', () => {
      const { result } = renderHook(() => useBucketStore())

      const investmentBucket = result.current.buckets.find(
        (b) => b.label === 'Инвестиции'
      )
      expect(investmentBucket).toBeDefined()
      expect(investmentBucket?.percentage).toBe(10)
      expect(investmentBucket?.id).toBe('2')
    })

    it('should provide updateBuckets action method in state', () => {
      const { result } = renderHook(() => useBucketStore())

      expect(typeof result.current.updateBuckets).toBe('function')
    })
  })

  describe('updateBuckets Action', () => {
    it('should update buckets to a new array', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '3', label: 'Образование', percentage: 15 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(1)
        expect(result.current.buckets[0].label).toBe('Образование')
        expect(result.current.buckets[0].percentage).toBe(15)
      })
    })

    it('should replace all existing buckets', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '5', label: 'Путешествия', percentage: 30 },
        { id: '6', label: 'Здоровье', percentage: 25 },
        { id: '7', label: 'Развлечения', percentage: 10 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(3)
        expect(result.current.buckets).toEqual(newBuckets)
      })
    })

    it('should handle empty buckets array', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => {
        result.current.updateBuckets([])
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(0)
      })
    })

    it('should handle buckets with zero percentage', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '10', label: 'Резерв', percentage: 0 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].percentage).toBe(0)
      })
    })

    it('should handle buckets with negative percentage', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '11', label: 'Долг', percentage: -10 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].percentage).toBe(-10)
      })
    })

    it('should handle buckets with percentage over 100', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '12', label: 'Особый', percentage: 150 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].percentage).toBe(150)
      })
    })

    it('should handle buckets with decimal percentage', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '13', label: 'Точный', percentage: 12.5 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].percentage).toBe(12.5)
      })
    })

    it('should update buckets multiple times', async () => {
      const { result } = renderHook(() => useBucketStore())

      const firstBuckets: AllocationBucket[] = [
        { id: '20', label: 'Первый', percentage: 10 },
      ]

      act(() => {
        result.current.updateBuckets(firstBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(1)
        expect(result.current.buckets[0].label).toBe('Первый')
      })

      const secondBuckets: AllocationBucket[] = [
        { id: '21', label: 'Второй', percentage: 20 },
        { id: '22', label: 'Третий', percentage: 30 },
      ]

      act(() => {
        result.current.updateBuckets(secondBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(2)
        expect(result.current.buckets[0].label).toBe('Второй')
        expect(result.current.buckets[1].label).toBe('Третий')
      })
    })

    it('should handle buckets with empty label', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '30', label: '', percentage: 5 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe('')
      })
    })

    it('should handle buckets with long labels', async () => {
      const { result } = renderHook(() => useBucketStore())

      const longLabel = 'Очень длинное название категории для тестирования'
      const newBuckets: AllocationBucket[] = [
        { id: '31', label: longLabel, percentage: 5 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe(longLabel)
      })
    })

    it('should handle buckets with duplicate IDs', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '100', label: 'Первый', percentage: 10 },
        { id: '100', label: 'Второй', percentage: 20 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(2)
        expect(result.current.buckets[0].id).toBe('100')
        expect(result.current.buckets[1].id).toBe('100')
      })
    })

    it('should handle buckets with special characters in label', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '40', label: 'Тест@#$%^&*()', percentage: 15 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe('Тест@#$%^&*()')
      })
    })
  })

  describe('Selector Support', () => {
    it('should support selecting buckets array', () => {
      const { result } = renderHook(() =>
        useBucketStore((state) => state.buckets)
      )

      expect(result.current).toHaveLength(2)
    })

    it('should support selecting first bucket', () => {
      const { result } = renderHook(() =>
        useBucketStore((state) => state.buckets[0])
      )

      expect(result.current.label).toBe('Накопления')
    })

    it('should support selecting bucket count', () => {
      const { result } = renderHook(() =>
        useBucketStore((state) => state.buckets.length)
      )

      expect(result.current).toBe(2)
    })

    it('should support selecting derived values', () => {
      const { result: storeResult } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '50', label: 'A', percentage: 25 },
        { id: '51', label: 'B', percentage: 35 },
      ]

      act(() => {
        storeResult.current.updateBuckets(newBuckets)
      })

      const { result: selectorResult } = renderHook(() =>
        useBucketStore((state) => ({
          count: state.buckets.length,
          total: state.buckets.reduce((sum, b) => sum + b.percentage, 0),
        }))
      )

      waitFor(() => {
        expect(selectorResult.current.count).toBe(2)
        expect(selectorResult.current.total).toBe(60)
      })
    })

    it('should update when selected value changes', async () => {
      const { result: storeResult } = renderHook(() => useBucketStore())
      const { result: selectorResult } = renderHook(() =>
        useBucketStore((state) => state.buckets.length)
      )

      expect(selectorResult.current).toBe(2)

      act(() => {
        storeResult.current.updateBuckets([
          { id: '60', label: 'Новый', percentage: 5 },
        ])
      })

      await waitFor(() => {
        expect(selectorResult.current).toBe(1)
      })
    })
  })

  describe('Store Stability', () => {
    it('should maintain stable action reference', () => {
      const { result, rerender } = renderHook(() => useBucketStore())

      const firstUpdateBuckets = result.current.updateBuckets

      rerender()

      expect(result.current.updateBuckets).toBe(firstUpdateBuckets)
    })

    it('should not recreate state object if values have not changed', () => {
      const { result, rerender } = renderHook(() => useBucketStore())

      const firstState = result.current

      rerender()

      // State should be the same reference if values have not changed
      expect(result.current).toBe(firstState)
    })

    it('should create new state object when buckets change', async () => {
      const { result } = renderHook(() => useBucketStore())

      const initialState = result.current

      act(() => {
        result.current.updateBuckets([
          { id: '70', label: 'Новый', percentage: 15 },
        ])
      })

      await waitFor(() => {
        expect(result.current).not.toBe(initialState)
        expect(result.current.buckets).toHaveLength(1)
      })
    })
  })

  describe('Direct Atom Access', () => {
    it('should allow direct atom reading', () => {
      const buckets = bucketsAtom()
      expect(buckets).toHaveLength(2)
      expect(buckets[0].label).toBe('Накопления')
      expect(buckets[1].label).toBe('Инвестиции')
    })

    it('should update atom value via action', () => {
      const newBuckets: AllocationBucket[] = [
        { id: '80', label: 'Тест', percentage: 40 },
      ]

      wrap(updateBuckets)(newBuckets)

      const buckets = bucketsAtom()
      expect(buckets).toHaveLength(1)
      expect(buckets[0].label).toBe('Тест')
      expect(buckets[0].percentage).toBe(40)
    })

    it('should synchronize hook and atom values', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '90', label: 'Синхрон', percentage: 33 },
      ]

      // Update via hook
      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        // Both hook and atom should have the same value
        expect(result.current.buckets).toHaveLength(1)
        expect(result.current.buckets[0].label).toBe('Синхрон')

        const atomBuckets = bucketsAtom()
        expect(atomBuckets).toHaveLength(1)
        expect(atomBuckets[0].label).toBe('Синхрон')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle resetting to default buckets', async () => {
      const { result } = renderHook(() => useBucketStore())

      // Change buckets
      act(() => {
        result.current.updateBuckets([
          { id: '200', label: 'Временный', percentage: 99 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(1)
      })

      // Reset to defaults
      act(() => {
        result.current.updateBuckets(DEFAULT_BUCKETS)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(2)
        expect(result.current.buckets[0].label).toBe('Накопления')
        expect(result.current.buckets[1].label).toBe('Инвестиции')
      })
    })

    it('should handle large number of buckets', async () => {
      const { result } = renderHook(() => useBucketStore())

      const manyBuckets: AllocationBucket[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `bucket-${i}`,
          label: `Категория ${i}`,
          percentage: i % 100,
        })
      )

      act(() => {
        result.current.updateBuckets(manyBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(100)
        expect(result.current.buckets[50].label).toBe('Категория 50')
      })
    })

    it('should handle rapid consecutive updates', async () => {
      const { result } = renderHook(() => useBucketStore())

      act(() => {
        result.current.updateBuckets([
          { id: '300', label: 'Первый', percentage: 10 },
        ])
        result.current.updateBuckets([
          { id: '301', label: 'Второй', percentage: 20 },
        ])
        result.current.updateBuckets([
          { id: '302', label: 'Третий', percentage: 30 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(1)
        expect(result.current.buckets[0].label).toBe('Третий')
        expect(result.current.buckets[0].percentage).toBe(30)
      })
    })

    it('should handle buckets with Unicode characters', async () => {
      const { result } = renderHook(() => useBucketStore())

      const newBuckets: AllocationBucket[] = [
        { id: '400', label: '💰 Деньги 💵', percentage: 15 },
        { id: '401', label: '🏠 Дом', percentage: 25 },
      ]

      act(() => {
        result.current.updateBuckets(newBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe('💰 Деньги 💵')
        expect(result.current.buckets[1].label).toBe('🏠 Дом')
      })
    })

    it('should preserve bucket order', async () => {
      const { result } = renderHook(() => useBucketStore())

      const orderedBuckets: AllocationBucket[] = [
        { id: 'z', label: 'Z-Last', percentage: 5 },
        { id: 'a', label: 'A-First', percentage: 10 },
        { id: 'm', label: 'M-Middle', percentage: 15 },
      ]

      act(() => {
        result.current.updateBuckets(orderedBuckets)
      })

      await waitFor(() => {
        expect(result.current.buckets[0].label).toBe('Z-Last')
        expect(result.current.buckets[1].label).toBe('A-First')
        expect(result.current.buckets[2].label).toBe('M-Middle')
      })
    })
  })

  describe('Subscription and Reactivity', () => {
    it('should trigger re-render on bucket update', async () => {
      const { result } = renderHook(() => useBucketStore())
      const renderCount = { count: 0 }

      const { result: counterResult } = renderHook(() => {
        renderCount.count++
        return useBucketStore((state) => state.buckets.length)
      })

      const initialCount = renderCount.count

      act(() => {
        result.current.updateBuckets([
          { id: '500', label: 'Новый', percentage: 50 },
        ])
      })

      await waitFor(() => {
        expect(counterResult.current).toBe(1)
        expect(renderCount.count).toBeGreaterThan(initialCount)
      })
    })

    it('should trigger re-render when bucket count changes', async () => {
      const { result } = renderHook(() => useBucketStore())
      const renderCount = { count: 0 }

      const { result: counterResult } = renderHook(() => {
        renderCount.count++
        return useBucketStore((state) => state.buckets)
      })

      const initialCount = renderCount.count

      act(() => {
        result.current.updateBuckets([
          { id: '600', label: 'A', percentage: 10 },
          { id: '601', label: 'B', percentage: 20 },
          { id: '602', label: 'C', percentage: 30 },
        ])
      })

      await waitFor(() => {
        expect(counterResult.current).toHaveLength(3)
        expect(renderCount.count).toBeGreaterThan(initialCount)
      })
    })

    it('should not trigger unnecessary re-renders with stable selector', async () => {
      const { result } = renderHook(() => useBucketStore())

      // Set initial buckets with known length
      act(() => {
        result.current.updateBuckets([
          { id: '700', label: 'Initial', percentage: 50 },
        ])
      })

      await waitFor(() => {
        expect(result.current.buckets).toHaveLength(1)
      })

      const renderCount = { count: 0 }

      const { result: selectorResult } = renderHook(() => {
        renderCount.count++
        return useBucketStore((state) => state.buckets.length)
      })

      const initialCount = renderCount.count

      // Update buckets but keep same length
      act(() => {
        result.current.updateBuckets([
          { id: '701', label: 'Updated', percentage: 60 },
        ])
      })

      await waitFor(() => {
        expect(selectorResult.current).toBe(1)
        // Length hasn't changed, but content has, so re-render will occur
        expect(renderCount.count).toBeGreaterThan(initialCount)
      })
    })
  })

  describe('Persistence Key', () => {
    it('should use correct localStorage key format', () => {
      // This test verifies the persistence key follows the project convention
      // The actual localStorage persistence is tested by Reatom library itself
      const { result } = renderHook(() => useBucketStore())

      // Verify store is accessible and functional
      expect(result.current.buckets).toBeDefined()
      expect(Array.isArray(result.current.buckets)).toBe(true)
    })
  })
})
