import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { LayoutConfig, WidgetId } from '@/shared/types'

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

interface LayoutState {
  layoutConfig: LayoutConfig
  isEditMode: boolean
  toggleEditMode: () => void
  moveWidget: (
    widgetId: WidgetId,
    fromColumnId: string,
    toColumnId: string
  ) => void
  moveWidgetInColumn: (
    columnId: string,
    fromIndex: number,
    toIndex: number
  ) => void
  resizeColumn: (columnId: string, width: number) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutConfig: DEFAULT_LAYOUT,
      isEditMode: false,

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      moveWidget: (widgetId, fromColumnId, toColumnId) =>
        set((state) => {
          const newColumns = state.layoutConfig.columns.map((column) => {
            if (column.id === fromColumnId) {
              return {
                ...column,
                widgets: column.widgets.filter((w) => w !== widgetId),
              }
            }
            if (column.id === toColumnId) {
              return {
                ...column,
                widgets: [...column.widgets, widgetId],
              }
            }
            return column
          })

          return { layoutConfig: { columns: newColumns } }
        }),

      moveWidgetInColumn: (columnId, fromIndex, toIndex) =>
        set((state) => {
          const newColumns = state.layoutConfig.columns.map((column) => {
            if (column.id !== columnId) return column

            const newWidgets = [...column.widgets]
            const [removed] = newWidgets.splice(fromIndex, 1)
            newWidgets.splice(toIndex, 0, removed)

            return { ...column, widgets: newWidgets }
          })

          return { layoutConfig: { columns: newColumns } }
        }),

      resizeColumn: (columnId, width) =>
        set((state) => {
          const clampedWidth = Math.min(100, Math.max(0, width))
          const newColumns = state.layoutConfig.columns.map((column) =>
            column.id === columnId ? { ...column, width: clampedWidth } : column
          )

          return { layoutConfig: { columns: newColumns } }
        }),
    }),
    {
      name: 'smartspend-layout',
    }
  )
)
