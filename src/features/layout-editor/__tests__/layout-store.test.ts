import { wrap } from '@reatom/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import {
  useLayoutStore,
  resetLayoutStore,
  DEFAULT_LAYOUT,
} from '../model/queries'

let layoutConfig = DEFAULT_LAYOUT

jest.mock('@/shared/api', () => ({
  queryKeys: { layout: { all: ['layout'] } },
  getLayoutConfig: jest.fn(async () => layoutConfig),
  updateLayoutConfig: jest.fn(async (nextLayout: typeof layoutConfig) => {
    layoutConfig = nextLayout
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

describe('useLayoutStore', () => {
  beforeEach(() => {
    layoutConfig = DEFAULT_LAYOUT
    wrap(resetLayoutStore)()
  })

  it('should have default layout config', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns).toHaveLength(3)
      expect(result.current.isEditMode).toBe(false)
    })
  })

  it('should toggle edit mode', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

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
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.moveWidget('CALENDAR', 'col-1', 'col-2')
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].widgets).not.toContain(
        'CALENDAR'
      )
      expect(result.current.layoutConfig.columns[1].widgets).toContain(
        'CALENDAR'
      )
    })
  })

  it('should resize column', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.resizeColumn('col-1', 50)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(50)
    })
  })

  it('should not allow negative column width', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.resizeColumn('col-1', -10)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(0)
    })
  })

  it('should not allow column width exceeding 100', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.resizeColumn('col-1', 150)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].width).toBe(100)
    })
  })

  it('should move widget within same column', async () => {
    const { result } = renderHook(() => useLayoutStore(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.moveWidgetInColumn('col-1', 0, 1)
    })

    await waitFor(() => {
      expect(result.current.layoutConfig.columns[0].widgets).toEqual([
        'EXPENSE_LOG',
        'CALENDAR',
      ])
    })
  })
})
