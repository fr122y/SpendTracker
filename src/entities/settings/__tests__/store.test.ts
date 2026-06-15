import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useSettingsStore } from '../model/queries'

import type { Settings } from '@/shared/api/settings-actions'

let settings: Settings = {
  weeklyLimit: 10000,
  weeklyLimits: [{ effectiveWeekStart: '1970-01-05', amount: 10000 }],
  salaryDay: 10,
  advanceDay: 25,
  salary: 0,
}

jest.mock('@/shared/api', () => ({
  queryKeys: { settings: { all: ['settings'] } },
  getSettings: jest.fn(async () => settings),
  setWeeklyLimitForWeek: jest.fn(
    async (effectiveWeekStart: string, amount: number) => {
      settings = {
        ...settings,
        weeklyLimits: [
          ...settings.weeklyLimits.filter(
            (limit) => limit.effectiveWeekStart !== effectiveWeekStart
          ),
          { effectiveWeekStart, amount },
        ].sort((a, b) =>
          a.effectiveWeekStart.localeCompare(b.effectiveWeekStart)
        ),
      }
    }
  ),
  updateSettings: jest.fn(async (partial: Partial<Settings>) => {
    settings = { ...settings, ...partial }
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

describe('useSettingsStore', () => {
  beforeEach(() => {
    settings = {
      weeklyLimit: 10000,
      weeklyLimits: [{ effectiveWeekStart: '1970-01-05', amount: 10000 }],
      salaryDay: 10,
      advanceDay: 25,
      salary: 0,
    }
    jest.clearAllMocks()
  })

  it('exposes the current settings and update actions', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useSettingsStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.weeklyLimit).toBe(10000)
      expect(result.current.salaryDay).toBe(10)
      expect(result.current.advanceDay).toBe(25)
      expect(result.current.salary).toBe(0)
    })

    act(() => {
      result.current.setWeeklyLimit(15000)
      result.current.setSalaryDay(12)
      result.current.setAdvanceDay(20)
      result.current.setSalary(75000)
    })

    await waitFor(() => {
      expect(result.current.weeklyLimit).toBe(15000)
      expect(result.current.salaryDay).toBe(12)
      expect(result.current.advanceDay).toBe(20)
      expect(result.current.salary).toBe(75000)
    })
  })

  it('returns historical weekly limits for selected dates', async () => {
    settings = {
      ...settings,
      weeklyLimit: 2500,
      weeklyLimits: [
        { effectiveWeekStart: '1970-01-05', amount: 6500 },
        { effectiveWeekStart: '2026-06-15', amount: 2500 },
      ],
    }

    const wrapper = createWrapper()
    const { result } = renderHook(() => useSettingsStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.getWeeklyLimitForDate(new Date('2026-06-10'))).toBe(
        6500
      )
      expect(result.current.getWeeklyLimitForDate(new Date('2026-06-17'))).toBe(
        2500
      )
      expect(result.current.getWeeklyLimitForDate(new Date('2026-07-01'))).toBe(
        2500
      )
    })
  })

  it('sets a weekly limit from the selected week', async () => {
    const { setWeeklyLimitForWeek } = await import('@/shared/api')
    const wrapper = createWrapper()
    const { result } = renderHook(() => useSettingsStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.weeklyLimit).toBe(10000)
    })

    act(() => {
      result.current.setWeeklyLimitForDate(new Date('2026-06-17'), 2500)
    })

    await waitFor(() => {
      expect(setWeeklyLimitForWeek).toHaveBeenCalledWith('2026-06-15', 2500)
      expect(result.current.getWeeklyLimitForDate(new Date('2026-06-10'))).toBe(
        10000
      )
      expect(result.current.getWeeklyLimitForDate(new Date('2026-06-17'))).toBe(
        2500
      )
    })
  })
})
