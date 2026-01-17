import { create } from 'zustand'

interface SessionState {
  selectedDate: Date
  viewDate: Date
  setSelectedDate: (date: Date) => void
  setViewDate: (date: Date) => void
  nextMonth: () => void
  prevMonth: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedDate: new Date(),
  viewDate: new Date(),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setViewDate: (viewDate) => set({ viewDate }),

  nextMonth: () =>
    set((state) => ({
      viewDate: new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth() + 1,
        1
      ),
    })),

  prevMonth: () =>
    set((state) => ({
      viewDate: new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth() - 1,
        1
      ),
    })),
}))
