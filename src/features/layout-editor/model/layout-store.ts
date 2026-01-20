import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

import type { LayoutConfig, WidgetId } from '@/shared/types'

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

// Atoms - layoutConfig is persisted, isEditMode is NOT
export const layoutConfigAtom = atom(DEFAULT_LAYOUT, 'layoutConfigAtom').extend(
  withLocalStorage('smartspend-layout')
)

export const isEditModeAtom = atom(false, 'isEditModeAtom')

// Actions
export const toggleEditMode = action(() => {
  isEditModeAtom.set(!isEditModeAtom())
}, 'toggleEditMode')

export const moveWidget = action(
  (widgetId: WidgetId, fromColumnId: string, toColumnId: string) => {
    const config = layoutConfigAtom() ?? DEFAULT_LAYOUT
    const newColumns = config.columns.map((column) => {
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

    layoutConfigAtom.set({ columns: newColumns })
  },
  'moveWidget'
)

export const moveWidgetInColumn = action(
  (columnId: string, fromIndex: number, toIndex: number) => {
    const config = layoutConfigAtom() ?? DEFAULT_LAYOUT
    const newColumns = config.columns.map((column) => {
      if (column.id !== columnId) return column

      const newWidgets = [...column.widgets]
      const [removed] = newWidgets.splice(fromIndex, 1)
      newWidgets.splice(toIndex, 0, removed)

      return { ...column, widgets: newWidgets }
    })

    layoutConfigAtom.set({ columns: newColumns })
  },
  'moveWidgetInColumn'
)

export const resizeColumn = action((columnId: string, width: number) => {
  const config = layoutConfigAtom() ?? DEFAULT_LAYOUT
  const clampedWidth = Math.min(100, Math.max(0, width))
  const newColumns = config.columns.map((column) =>
    column.id === columnId ? { ...column, width: clampedWidth } : column
  )

  layoutConfigAtom.set({ columns: newColumns })
}, 'resizeColumn')

// Reset action for testing
export const resetLayoutStore = action(() => {
  layoutConfigAtom.set(DEFAULT_LAYOUT)
  isEditModeAtom.set(false)
}, 'resetLayoutStore')

// Store state type
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

// Action wrappers (stable references)
const actionToggleEditMode = () => wrap(toggleEditMode)()
const actionMoveWidget = (
  widgetId: WidgetId,
  fromColumnId: string,
  toColumnId: string
) => wrap(moveWidget)(widgetId, fromColumnId, toColumnId)
const actionMoveWidgetInColumn = (
  columnId: string,
  fromIndex: number,
  toIndex: number
) => wrap(moveWidgetInColumn)(columnId, fromIndex, toIndex)
const actionResizeColumn = (columnId: string, width: number) =>
  wrap(resizeColumn)(columnId, width)

// Cached state for useSyncExternalStore
let cachedState: LayoutState | null = null
let cachedLayoutConfig: LayoutConfig | undefined
let cachedIsEditMode: boolean | undefined

const getState = (): LayoutState => {
  // Fallback to DEFAULT_LAYOUT during hydration when localStorage hasn't loaded yet
  const layoutConfig = layoutConfigAtom() ?? DEFAULT_LAYOUT
  const isEditMode = isEditModeAtom() ?? false

  if (
    cachedState === null ||
    cachedLayoutConfig !== layoutConfig ||
    cachedIsEditMode !== isEditMode
  ) {
    cachedLayoutConfig = layoutConfig
    cachedIsEditMode = isEditMode
    cachedState = {
      layoutConfig,
      isEditMode,
      toggleEditMode: actionToggleEditMode,
      moveWidget: actionMoveWidget,
      moveWidgetInColumn: actionMoveWidgetInColumn,
      resizeColumn: actionResizeColumn,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  const unsub1 = layoutConfigAtom.subscribe(callback)
  const unsub2 = isEditModeAtom.subscribe(callback)
  return () => {
    unsub1()
    unsub2()
  }
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useLayoutStore(): LayoutState
export function useLayoutStore<T>(selector: (state: LayoutState) => T): T
export function useLayoutStore<T>(selector?: (state: LayoutState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
