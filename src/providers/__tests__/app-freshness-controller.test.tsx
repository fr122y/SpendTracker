import { wrap } from '@reatom/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import { toast } from 'sonner'

import {
  selectedDateAtom,
  setSelectedDate,
  setToday,
} from '@/entities/session/model/store'

import { AppFreshnessController } from '../app-freshness-controller'

jest.mock('sonner', () => ({
  toast: jest.fn(),
}))

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => value,
  })
}

function setOnlineState(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

function renderController(queryClient = new QueryClient()) {
  const invalidateQueries = jest
    .spyOn(queryClient, 'invalidateQueries')
    .mockResolvedValue()

  const view = render(
    <QueryClientProvider client={queryClient}>
      <AppFreshnessController />
    </QueryClientProvider>
  )

  return { ...view, invalidateQueries }
}

const REFRESH_ALL = [{ refetchType: 'active' }, { cancelRefetch: false }]

describe('AppFreshnessController', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 10))
    setVisibilityState('visible')
    setOnlineState(true)
    wrap(setToday)()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('leaves a short tab return to the focus refetch of stale queries', () => {
    const { invalidateQueries } = renderController()

    setVisibilityState('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(invalidateQueries).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it('leaves a short reconnect to the reconnect refetch of stale queries', () => {
    const { invalidateQueries } = renderController()

    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))

    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('refreshes active queries after a long offline pause', () => {
    const { invalidateQueries } = renderController()

    window.dispatchEvent(new Event('offline'))
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000)
    })
    window.dispatchEvent(new Event('online'))

    expect(invalidateQueries).toHaveBeenCalledWith(...REFRESH_ALL)
  })

  it('does not refresh over a pending mutation after a long pause', () => {
    const queryClient = new QueryClient()
    jest.spyOn(queryClient, 'isMutating').mockReturnValue(1)
    const { invalidateQueries } = renderController(queryClient)

    setVisibilityState('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000)
    })
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('shows a toast after a long hidden pause', () => {
    const { invalidateQueries } = renderController()

    setVisibilityState('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000)
    })
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(invalidateQueries).toHaveBeenCalledWith(...REFRESH_ALL)
    expect(toast).toHaveBeenCalledWith('Данные обновлены')
  })

  it('syncs the selected date and refreshes active queries at midnight', () => {
    jest.setSystemTime(new Date(2026, 0, 15, 23, 59, 59))
    wrap(setToday)()
    const { invalidateQueries, unmount } = renderController()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(selectedDateAtom()).toEqual(new Date(2026, 0, 16))
    expect(invalidateQueries).toHaveBeenCalledWith(...REFRESH_ALL)
    expect(toast).toHaveBeenCalledWith('Данные обновлены')

    unmount()
  })

  it('does not overwrite a manually selected date at midnight', () => {
    jest.setSystemTime(new Date(2026, 0, 15, 23, 59, 59))
    wrap(setToday)()
    wrap(setSelectedDate)(new Date(2026, 0, 10))
    const { invalidateQueries } = renderController()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(selectedDateAtom()).toEqual(new Date(2026, 0, 10))
    expect(invalidateQueries).toHaveBeenCalledWith(...REFRESH_ALL)
  })
})
