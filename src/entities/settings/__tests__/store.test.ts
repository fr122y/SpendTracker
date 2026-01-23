import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  useSettingsStore,
  weeklyLimitAtom,
  salaryDayAtom,
  advanceDayAtom,
  setWeeklyLimit,
  setSalaryDay,
  setAdvanceDay,
} from '../model/store'

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset atoms to default values before each test
    wrap(setWeeklyLimit)(10000)
    wrap(setSalaryDay)(10)
    wrap(setAdvanceDay)(25)
  })

  describe('Initial State', () => {
    it('should have default weekly limit of 10000', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(result.current.weeklyLimit).toBe(10000)
    })

    it('should have default salary day of 10', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(result.current.salaryDay).toBe(10)
    })

    it('should have default advance day of 25', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(result.current.advanceDay).toBe(25)
    })

    it('should provide all action methods in state', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(typeof result.current.setWeeklyLimit).toBe('function')
      expect(typeof result.current.setSalaryDay).toBe('function')
      expect(typeof result.current.setAdvanceDay).toBe('function')
    })
  })

  describe('setWeeklyLimit Action', () => {
    it('should update weekly limit to a new value', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(15000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(15000)
      })
    })

    it('should update weekly limit to zero', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(0)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(0)
      })
    })

    it('should handle negative weekly limit values', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(-5000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(-5000)
      })
    })

    it('should handle very large weekly limit values', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(1000000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(1000000)
      })
    })

    it('should update weekly limit multiple times', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(20000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(20000)
      })

      act(() => {
        result.current.setWeeklyLimit(5000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(5000)
      })
    })
  })

  describe('setSalaryDay Action', () => {
    it('should update salary day to a new value', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(15)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(15)
      })
    })

    it('should update salary day to minimum day (1)', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(1)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(1)
      })
    })

    it('should update salary day to maximum day (31)', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(31)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(31)
      })
    })

    it('should handle day value of 0', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(0)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(0)
      })
    })

    it('should handle day value beyond 31', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(40)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(40)
      })
    })
  })

  describe('setAdvanceDay Action', () => {
    it('should update advance day to a new value', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(20)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(20)
      })
    })

    it('should update advance day to minimum day (1)', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(1)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(1)
      })
    })

    it('should update advance day to maximum day (31)', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(31)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(31)
      })
    })

    it('should handle day value of 0', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(0)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(0)
      })
    })
  })

  describe('Multiple Actions Interaction', () => {
    it('should handle updating all settings in sequence', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(50000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(50000)
      })

      act(() => {
        result.current.setSalaryDay(5)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(5)
      })

      act(() => {
        result.current.setAdvanceDay(20)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(20)
      })

      // Verify all values are persisted correctly
      expect(result.current.weeklyLimit).toBe(50000)
      expect(result.current.salaryDay).toBe(5)
      expect(result.current.advanceDay).toBe(20)
    })

    it('should handle updating the same setting multiple times rapidly', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(20000)
        result.current.setWeeklyLimit(30000)
        result.current.setWeeklyLimit(40000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(40000)
      })
    })

    it('should handle concurrent updates to different settings', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(60000)
        result.current.setSalaryDay(28)
        result.current.setAdvanceDay(14)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(60000)
        expect(result.current.salaryDay).toBe(28)
        expect(result.current.advanceDay).toBe(14)
      })
    })
  })

  describe('Selector Support', () => {
    it('should support selecting specific state properties', () => {
      const { result } = renderHook(() =>
        useSettingsStore((state) => state.weeklyLimit)
      )

      expect(result.current).toBe(10000)
    })

    it('should support selecting derived values', () => {
      const { result: storeResult } = renderHook(() => useSettingsStore())

      act(() => {
        storeResult.current.setWeeklyLimit(12000)
        storeResult.current.setSalaryDay(5)
      })

      const { result: selectorResult } = renderHook(() =>
        useSettingsStore((state) => ({
          limit: state.weeklyLimit,
          day: state.salaryDay,
        }))
      )

      waitFor(() => {
        expect(selectorResult.current.limit).toBe(12000)
        expect(selectorResult.current.day).toBe(5)
      })
    })

    it('should update when selected value changes', async () => {
      const { result: storeResult } = renderHook(() => useSettingsStore())
      const { result: selectorResult } = renderHook(() =>
        useSettingsStore((state) => state.salaryDay)
      )

      expect(selectorResult.current).toBe(10)

      act(() => {
        storeResult.current.setSalaryDay(22)
      })

      await waitFor(() => {
        expect(selectorResult.current).toBe(22)
      })
    })
  })

  describe('Store Stability', () => {
    it('should maintain stable action references', () => {
      const { result, rerender } = renderHook(() => useSettingsStore())

      const firstSetWeeklyLimit = result.current.setWeeklyLimit
      const firstSetSalaryDay = result.current.setSalaryDay
      const firstSetAdvanceDay = result.current.setAdvanceDay

      rerender()

      expect(result.current.setWeeklyLimit).toBe(firstSetWeeklyLimit)
      expect(result.current.setSalaryDay).toBe(firstSetSalaryDay)
      expect(result.current.setAdvanceDay).toBe(firstSetAdvanceDay)
    })

    it('should not recreate state object if values have not changed', () => {
      const { result, rerender } = renderHook(() => useSettingsStore())

      const firstState = result.current

      rerender()

      // State should be the same reference if values haven't changed
      expect(result.current).toBe(firstState)
    })

    it('should create new state object when values change', async () => {
      const { result } = renderHook(() => useSettingsStore())

      const initialState = result.current

      act(() => {
        result.current.setWeeklyLimit(99999)
      })

      await waitFor(() => {
        expect(result.current).not.toBe(initialState)
        expect(result.current.weeklyLimit).toBe(99999)
      })
    })
  })

  describe('Direct Atom Access', () => {
    it('should allow direct atom reading', () => {
      expect(weeklyLimitAtom()).toBe(10000)
      expect(salaryDayAtom()).toBe(10)
      expect(advanceDayAtom()).toBe(25)
    })

    it('should update atom value via action', () => {
      wrap(setWeeklyLimit)(75000)
      expect(weeklyLimitAtom()).toBe(75000)

      wrap(setSalaryDay)(12)
      expect(salaryDayAtom()).toBe(12)

      wrap(setAdvanceDay)(18)
      expect(advanceDayAtom()).toBe(18)
    })

    it('should synchronize hook and atom values', async () => {
      const { result } = renderHook(() => useSettingsStore())

      // Update via hook
      act(() => {
        result.current.setWeeklyLimit(33333)
      })

      await waitFor(() => {
        // Both hook and atom should have the same value
        expect(result.current.weeklyLimit).toBe(33333)
        expect(weeklyLimitAtom()).toBe(33333)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle decimal values for weekly limit', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(12345.67)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(12345.67)
      })
    })

    it('should handle negative salary day', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(-5)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(-5)
      })
    })

    it('should handle resetting to default values', async () => {
      const { result } = renderHook(() => useSettingsStore())

      // Change values
      act(() => {
        result.current.setWeeklyLimit(99999)
        result.current.setSalaryDay(22)
        result.current.setAdvanceDay(11)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(99999)
      })

      // Reset to defaults
      act(() => {
        result.current.setWeeklyLimit(10000)
        result.current.setSalaryDay(10)
        result.current.setAdvanceDay(25)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(10000)
        expect(result.current.salaryDay).toBe(10)
        expect(result.current.advanceDay).toBe(25)
      })
    })
  })

  describe('Subscription and Reactivity', () => {
    it('should trigger re-render on weekly limit change', async () => {
      const { result } = renderHook(() => useSettingsStore())
      const initialRenderCount = { count: 0 }

      const { result: counterResult } = renderHook(() => {
        initialRenderCount.count++
        return useSettingsStore((state) => state.weeklyLimit)
      })

      const initialCount = initialRenderCount.count

      act(() => {
        result.current.setWeeklyLimit(88888)
      })

      await waitFor(() => {
        expect(counterResult.current).toBe(88888)
        expect(initialRenderCount.count).toBeGreaterThan(initialCount)
      })
    })

    it('should trigger re-render on salary day change', async () => {
      const { result } = renderHook(() => useSettingsStore())
      const renderCount = { count: 0 }

      const { result: counterResult } = renderHook(() => {
        renderCount.count++
        return useSettingsStore((state) => state.salaryDay)
      })

      const initialCount = renderCount.count

      act(() => {
        result.current.setSalaryDay(17)
      })

      await waitFor(() => {
        expect(counterResult.current).toBe(17)
        expect(renderCount.count).toBeGreaterThan(initialCount)
      })
    })

    it('should trigger re-render on advance day change', async () => {
      const { result } = renderHook(() => useSettingsStore())
      const renderCount = { count: 0 }

      const { result: counterResult } = renderHook(() => {
        renderCount.count++
        return useSettingsStore((state) => state.advanceDay)
      })

      const initialCount = renderCount.count

      act(() => {
        result.current.setAdvanceDay(7)
      })

      await waitFor(() => {
        expect(counterResult.current).toBe(7)
        expect(renderCount.count).toBeGreaterThan(initialCount)
      })
    })
  })
})
