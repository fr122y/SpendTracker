import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  useSettingsStore,
  setWeeklyLimit,
  setSalaryDay,
  setAdvanceDay,
  setSalary,
} from '../model/store'

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset atoms to default values before each test
    wrap(setWeeklyLimit)(10000)
    wrap(setSalaryDay)(10)
    wrap(setAdvanceDay)(25)
    wrap(setSalary)(0)
  })

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useSettingsStore())

      expect(result.current.weeklyLimit).toBe(10000)
      expect(result.current.salaryDay).toBe(10)
      expect(result.current.advanceDay).toBe(25)
      expect(result.current.salary).toBe(0)
    })
  })

  describe('Weekly Limit Updates', () => {
    it('should update weekly limit', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(15000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(15000)
      })
    })

    it('should handle zero weekly limit', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(0)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(0)
      })
    })

    it('should update weekly limit multiple times', async () => {
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
  })

  describe('Salary Day Updates', () => {
    it('should update salary day', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(15)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(15)
      })
    })

    it('should handle boundary values for salary day', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalaryDay(1)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(1)
      })

      act(() => {
        result.current.setSalaryDay(31)
      })

      await waitFor(() => {
        expect(result.current.salaryDay).toBe(31)
      })
    })
  })

  describe('Advance Day Updates', () => {
    it('should update advance day', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(20)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(20)
      })
    })

    it('should handle boundary values for advance day', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAdvanceDay(1)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(1)
      })

      act(() => {
        result.current.setAdvanceDay(31)
      })

      await waitFor(() => {
        expect(result.current.advanceDay).toBe(31)
      })
    })
  })

  describe('Salary Updates', () => {
    it('should update salary', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalary(100000)
      })

      await waitFor(() => {
        expect(result.current.salary).toBe(100000)
      })
    })

    it('should handle resetting salary to zero', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalary(50000)
      })

      await waitFor(() => {
        expect(result.current.salary).toBe(50000)
      })

      act(() => {
        result.current.setSalary(0)
      })

      await waitFor(() => {
        expect(result.current.salary).toBe(0)
      })
    })

    it('should handle decimal salary values', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSalary(75000.5)
      })

      await waitFor(() => {
        expect(result.current.salary).toBe(75000.5)
      })
    })
  })

  describe('Multiple Settings Updates', () => {
    it('should handle updating all settings sequentially', async () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setWeeklyLimit(50000)
        result.current.setSalaryDay(5)
        result.current.setAdvanceDay(20)
        result.current.setSalary(100000)
      })

      await waitFor(() => {
        expect(result.current.weeklyLimit).toBe(50000)
        expect(result.current.salaryDay).toBe(5)
        expect(result.current.advanceDay).toBe(20)
        expect(result.current.salary).toBe(100000)
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
})
