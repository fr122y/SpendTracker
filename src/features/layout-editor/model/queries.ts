'use client'

import { wrap } from '@reatom/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getLayoutConfig, queryKeys, updateLayoutConfig } from '@/shared/api'

import { resetEditMode, useEditMode } from './edit-mode-store'

import type { LayoutConfig, WidgetId } from '@/shared/types'

export const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    {
      id: 'col-1',
      width: 33,
      widgets: ['CALENDAR', 'EXPENSE_LOG', 'CATEGORIES'],
    },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS', 'PROJECTS'] },
    {
      id: 'col-3',
      width: 34,
      widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'SETTINGS'],
    },
  ],
}

export function useLayoutConfig() {
  return useQuery({
    queryKey: queryKeys.layout.all,
    queryFn: getLayoutConfig,
  })
}

export function useUpdateLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: LayoutConfig) => updateLayoutConfig(config),
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.layout.all })
      const previous = queryClient.getQueryData<LayoutConfig>(
        queryKeys.layout.all
      )
      queryClient.setQueryData(queryKeys.layout.all, newConfig)
      return { previous }
    },
    onError: (_error, _newConfig, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.layout.all, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.layout.all })
    },
  })
}

interface LayoutState {
  layoutConfig: LayoutConfig
  isLoading: boolean
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

export function useLayoutStore(): LayoutState
export function useLayoutStore<T>(selector: (state: LayoutState) => T): T
export function useLayoutStore<T>(selector?: (state: LayoutState) => T) {
  const { data: layoutConfig = DEFAULT_LAYOUT, isLoading } = useLayoutConfig()
  const updateLayout = useUpdateLayout()
  const { isEditMode, toggleEditMode } = useEditMode()

  const moveWidget = (
    widgetId: WidgetId,
    fromColumnId: string,
    toColumnId: string
  ) => {
    const newColumns = layoutConfig.columns.map((column) => {
      if (column.id === fromColumnId) {
        return {
          ...column,
          widgets: column.widgets.filter((widget) => widget !== widgetId),
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

    updateLayout.mutate({ columns: newColumns })
  }

  const moveWidgetInColumn = (
    columnId: string,
    fromIndex: number,
    toIndex: number
  ) => {
    const newColumns = layoutConfig.columns.map((column) => {
      if (column.id !== columnId) {
        return column
      }

      const newWidgets = [...column.widgets]
      const [removed] = newWidgets.splice(fromIndex, 1)
      newWidgets.splice(toIndex, 0, removed)

      return { ...column, widgets: newWidgets }
    })

    updateLayout.mutate({ columns: newColumns })
  }

  const resizeColumn = (columnId: string, width: number) => {
    const clampedWidth = Math.min(100, Math.max(0, width))

    const newColumns = layoutConfig.columns.map((column) =>
      column.id === columnId ? { ...column, width: clampedWidth } : column
    )

    updateLayout.mutate({ columns: newColumns })
  }

  const state: LayoutState = {
    layoutConfig,
    isLoading,
    isEditMode,
    toggleEditMode,
    moveWidget,
    moveWidgetInColumn,
    resizeColumn,
  }

  if (selector) {
    return selector(state)
  }

  return state
}

export function resetLayoutStore() {
  // Backward-compat helper for tests that previously reset local state.
  wrap(resetEditMode)()
}
