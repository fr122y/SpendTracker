import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  weeklyLimit: number
  salaryDay: number
  advanceDay: number
  setWeeklyLimit: (limit: number) => void
  setSalaryDay: (day: number) => void
  setAdvanceDay: (day: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weeklyLimit: 10000,
      salaryDay: 10,
      advanceDay: 25,

      setWeeklyLimit: (weeklyLimit) => set({ weeklyLimit }),
      setSalaryDay: (salaryDay) => set({ salaryDay }),
      setAdvanceDay: (advanceDay) => set({ advanceDay }),
    }),
    {
      name: 'smartspend-settings',
    }
  )
)
