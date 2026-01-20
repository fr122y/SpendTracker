import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useLayoutStore, resetLayoutStore } from '../model/layout-store'

describe('useLayoutStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    wrap(resetLayoutStore)()
  })

  it('should have default layout config', () => {
    const { result } = renderHook(() => useLayoutStore())

    expect(result.current.layoutConfig.columns).toHaveLength(3)
    expect(result.current.isEditMode).toBe(false)
  })

  it('should toggle edit mode', async () => {
    const { result } = renderHook(() => useLayoutStore())

    act(() => {
      result.current.toggleEditMode()
    })

    await waitFor(() => {
      expect(result.current.isEditMode).toBe(true)
    })

    act(() => {
      result.current.toggleEditMode()
    })

    await waitFor(() => {
      expect(result.current.isEditMode).toBe(false)
    })
  })

  it('should move widget between columns', async () => {
    const { result } = renderHook(() => useLayoutStore())

    act(() => {
      result.current.moveWidget('CALENDAR', 'col-1', 'col-2')
    })

    await waitFor(() => {
      // CALENDAR should be removed from col-1
      expect(result.current.layoutConfig.columns[0].widgets).not.toContain(
        'CALENDAR'
      )
      // CALENDAR should be added to col-2
      expect(result.current.layoutConfig.columns[1].widgets).toContain(
        'CALENDAR'
      )
    })
  })

  it('should resize column', async () => {
    const { result } = renderHook(() => useLayoutStore())

    act(() => {
      result.current.resizeColumn('col-1', 50)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(50)
    })
  })

  it('should not allow negative column width', async () => {
    const { result } = renderHook(() => useLayoutStore())

    act(() => {
      result.current.resizeColumn('col-1', -10)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(0)
    })
  })

  it('should not allow column width exceeding 100', async () => {
    const { result } = renderHook(() => useLayoutStore())

    act(() => {
      result.current.resizeColumn('col-1', 150)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(100)
    })
  })

  it('should move widget within same column', async () => {
    const { result } = renderHook(() => useLayoutStore())

    // Initial order in col-1: ['CALENDAR', 'EXPENSE_LOG']
    act(() => {
      result.current.moveWidgetInColumn('col-1', 0, 1)
    })

    // After move: ['EXPENSE_LOG', 'CALENDAR']
    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].widgets).toEqual([
        'EXPENSE_LOG',
        'CALENDAR',
      ])
    })
  })
})
