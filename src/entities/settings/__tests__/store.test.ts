import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useSettingsStore } from '../model/queries'

import type { Settings } from '@/shared/api/settings-actions'

let settings: Settings = {
  weeklyLimit: 10000,
  salaryDay: 10,
  advanceDay: 25,
  salary: 0,
}

jest.mock('@/shared/api', () => ({
  queryKeys: { settings: { all: ['settings'] } },
  getSettings: jest.fn(async () => settings),
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
})
